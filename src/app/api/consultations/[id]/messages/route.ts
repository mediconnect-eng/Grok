import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logInfo, logError } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { createNotification } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// GET - Fetch all messages for a consultation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient', 'gp', 'specialist'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const session = authResult.session!;
    const consultationId = params.id;

    const client = await pool.connect();

    try {
      // Verify user is part of this consultation
      const consultation = await client.query(
        'SELECT patient_id, provider_id FROM consultations WHERE id = $1',
        [consultationId]
      );

      if (consultation.rows.length === 0) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      const { patient_id, provider_id } = consultation.rows[0];

      // Check if user is authorized to view messages
      if (session.user.id !== patient_id && session.user.id !== provider_id) {
        return NextResponse.json(
          { error: 'You are not authorized to view these messages' },
          { status: 403 }
        );
      }

      // Fetch messages with sender info
      const messages = await client.query(
        `SELECT 
          cm.*,
          u.name as sender_name,
          u.email as sender_email
         FROM consultation_messages cm
         JOIN "user" u ON cm.sender_id = u.id
         WHERE cm.consultation_id = $1
         ORDER BY cm.created_at ASC`,
        [consultationId]
      );

      // Mark messages as read if they're for the current user
      const otherRole = session.user.id === patient_id ? 'provider' : 'patient';
      await client.query(
        `UPDATE consultation_messages 
         SET is_read = true, read_at = NOW()
         WHERE consultation_id = $1 
         AND sender_role = $2 
         AND is_read = false`,
        [consultationId, otherRole]
      );

      return NextResponse.json({
        success: true,
        messages: messages.rows,
        count: messages.rows.length,
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch consultation messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message in consultation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient', 'gp', 'specialist'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const session = authResult.session!;
    const consultationId = params.id;

    const body = await request.json();
    const { message, attachments } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify consultation exists and user is part of it
      const consultation = await client.query(
        `SELECT 
          c.patient_id, 
          c.provider_id, 
          c.status,
          patient.name as patient_name,
          provider.name as provider_name
         FROM consultations c
         LEFT JOIN "user" patient ON c.patient_id = patient.id
         LEFT JOIN "user" provider ON c.provider_id = provider.id
         WHERE c.id = $1`,
        [consultationId]
      );

      if (consultation.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      const { patient_id, provider_id, status, patient_name, provider_name } = consultation.rows[0];

      // Check if consultation is active
      if (status !== 'in-progress' && status !== 'scheduled') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Cannot send messages to a closed consultation' },
          { status: 400 }
        );
      }

      // Check if user is authorized
      if (session.user.id !== patient_id && session.user.id !== provider_id) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'You are not authorized to send messages in this consultation' },
          { status: 403 }
        );
      }

      // Determine sender role
      const senderRole = session.user.id === patient_id ? 'patient' : 'provider';
      const recipientId = senderRole === 'patient' ? provider_id : patient_id;
      const recipientName = senderRole === 'patient' ? provider_name : patient_name;

      // Insert message
      const newMessage = await client.query(
        `INSERT INTO consultation_messages (
          consultation_id, sender_id, sender_role, message, attachments, created_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *`,
        [
          consultationId,
          session.user.id,
          senderRole,
          message.trim(),
          JSON.stringify(attachments || []),
        ]
      );

      // Update consultation updated_at
      await client.query(
        'UPDATE consultations SET updated_at = NOW() WHERE id = $1',
        [consultationId]
      );

      // Send notification to recipient
      if (recipientId) {
        await createNotification({
          userId: recipientId,
          type: 'consultation',
          title: 'New Message',
          message: `${session.user.name || 'Someone'} sent you a message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          link: `/${senderRole === 'patient' ? 'gp' : 'patient'}/consultations/${consultationId}`,
          metadata: { consultationId, senderId: session.user.id },
          entityType: 'consultation',
          entityId: consultationId,
        });
      }

      await client.query('COMMIT');

      logInfo('Message sent:', {
        consultationId,
        senderId: session.user.id,
        senderRole,
        messageLength: message.length,
      });

      return NextResponse.json({
        success: true,
        message: {
          ...newMessage.rows[0],
          sender_name: session.user.name,
          sender_email: session.user.email,
        },
      }, { status: 201 });

    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Send consultation message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
