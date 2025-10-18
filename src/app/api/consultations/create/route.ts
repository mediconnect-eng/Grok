import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { logInfo, logError } from '@/lib/logger';
import { createNotifications, notifyConsultationRequested } from '@/lib/notifications';
import { requireAuth, requireOwnership } from '@/lib/auth-middleware';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { validateBody, validateQuery, CreateConsultationSchema, GetConsultationsSchema } from '@/lib/validation';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    // Step 1: Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Step 2: Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const session = authResult.session!;

    // Step 3: Input validation
    const validationResult = await validateBody(request, CreateConsultationSchema);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: validationResult.error,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const {
      patientId,
      providerType,
      consultationType,
      chiefComplaint,
      symptoms,
      duration,
      urgency,
      preferredDate,
      attachments,
    } = validationResult.data;

    // Step 4: Authorization - verify user owns the resource
    if (session.user.id !== patientId) {
      return NextResponse.json(
        { 
          error: 'You can only create consultations for yourself',
          code: 'AUTHORIZATION_FAILED',
        },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify patient exists
      const patientCheck = await client.query(
        'SELECT id, name, email FROM "user" WHERE id = $1',
        [patientId]
      );

      if (patientCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }

      const patient = patientCheck.rows[0];

      // Create consultation
      const consultationId = crypto.randomUUID();
      const consultationFee = providerType === 'gp' ? 50.00 : 100.00; // Default fees

      const consultation = await client.query(
        `INSERT INTO consultations (
          id, patient_id, provider_type, consultation_type, chief_complaint, symptoms,
          duration, urgency, preferred_date, consultation_fee,
          status, attachments, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, NOW(), NOW())
        RETURNING *`,
        [
          consultationId,
          patientId,
          providerType,
          consultationType || 'video',
          chiefComplaint,
          symptoms || null,
          duration || null,
          urgency || 'routine',
          preferredDate || null,
          consultationFee,
          JSON.stringify(attachments || []),
        ]
      );

      // Find available providers of the requested type
      const availableProviders = await client.query(
        `SELECT u.id, u.name, u.email, pa.specialization
         FROM "user" u
         JOIN provider_applications pa ON u.id = pa.user_id
         WHERE pa.provider_type = $1 
         AND pa.status = 'approved'
         AND u."emailVerified" = true
         LIMIT 10`,
        [providerType]
      );

      // Notify patient that request was submitted
      await notifyConsultationRequested(patientId, patient.name, consultationId);

      // Notify all available providers about the consultation request
      const providerNotifications = availableProviders.rows.map(provider => ({
        userId: provider.id,
        type: 'consultation' as const,
        title: 'New Consultation Request',
        message: `${patient.name} has requested a consultation for: ${chiefComplaint}`,
        link: `/gp/consultations/${consultationId}`,
        metadata: { consultationId, patientName: patient.name, chiefComplaint },
        entityType: 'consultation' as const,
        entityId: consultationId,
      }));
      
      await createNotifications(providerNotifications);

      await client.query('COMMIT');

      logInfo('Consultation created:', {
        consultationId,
        patientId,
        providerType,
        urgency: urgency || 'routine',
      });

      return NextResponse.json(
        {
          success: true,
          consultation: consultation.rows[0],
          message: 'Consultation request created successfully',
          availableProviders: availableProviders.rows.length,
        },
        { status: 201 }
      );

    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Create consultation error:', error);
    
    // Sanitized error for production
    return NextResponse.json(
      { 
        error: 'Failed to create consultation request',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// GET - Fetch consultations for a patient
export async function GET(request: NextRequest) {
  try {
    // Step 1: Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Step 2: Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const session = authResult.session!;

    // Step 3: Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const validationResult = validateQuery(searchParams, GetConsultationsSchema);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: validationResult.error,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { userId: patientId } = validationResult.data;

    // Step 4: Authorization - verify user owns the resource
    if (session.user.id !== patientId) {
      return NextResponse.json(
        { 
          error: 'You can only view your own consultations',
          code: 'AUTHORIZATION_FAILED',
        },
        { status: 403 }
      );
    }

    const client = await pool.connect();

    try {
      const consultations = await client.query(
        `SELECT 
          c.*,
          p.name as provider_name,
          p.email as provider_email
         FROM consultations c
         LEFT JOIN "user" p ON c.provider_id = p.id
         WHERE c.patient_id = $1
         ORDER BY c.created_at DESC`,
        [patientId]
      );

      return NextResponse.json(
        {
          success: true,
          consultations: consultations.rows,
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch consultations error:', error);
    
    // Sanitized error for production
    return NextResponse.json(
      { 
        error: 'Failed to fetch consultations',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
