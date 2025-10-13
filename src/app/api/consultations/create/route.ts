import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { logInfo, logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      providerType,
      chiefComplaint,
      symptoms,
      duration,
      urgency,
      preferredDate,
      attachments,
    } = body;

    // Validation
    if (!patientId || !providerType || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Patient ID, provider type, and chief complaint are required' },
        { status: 400 }
      );
    }

    if (!['gp', 'specialist'].includes(providerType)) {
      return NextResponse.json(
        { error: 'Provider type must be either "gp" or "specialist"' },
        { status: 400 }
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
          id, patient_id, provider_type, chief_complaint, symptoms,
          duration, urgency, preferred_date, consultation_fee,
          status, attachments, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, NOW(), NOW())
        RETURNING *`,
        [
          consultationId,
          patientId,
          providerType,
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

      // Create notifications for all available providers
      for (const provider of availableProviders.rows) {
        await client.query(
          `INSERT INTO notifications (
            id, user_id, title, message, type, entity_type, entity_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            crypto.randomUUID(),
            provider.id,
            'New Consultation Request',
            `${patient.name} has requested a consultation for: ${chiefComplaint}`,
            'consultation_request',
            'consultation',
            consultationId,
          ]
        );
      }

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
    
    return NextResponse.json(
      { error: error.message || 'Failed to create consultation request' },
      { status: 500 }
    );
  }
}

// GET - Fetch consultations for a patient
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
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
    
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}
