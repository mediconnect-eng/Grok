import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { logInfo, logError } from '@/lib/logger';
import { notifyConsultationAccepted, notifyConsultationCompleted } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const body = await request.json();
    const { providerId, action } = body; // action: 'accept' or 'decline'

    if (!providerId || !action) {
      return NextResponse.json(
        { error: 'Provider ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get consultation details
      const consultation = await client.query(
        `SELECT c.*, pat.name as patient_name, pat.email as patient_email
         FROM consultations c
         JOIN "user" pat ON c.patient_id = pat.id
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

      const consult = consultation.rows[0];

      if (consult.status !== 'pending') {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: `Consultation is already ${consult.status}` },
          { status: 400 }
        );
      }

      // Get provider details
      const provider = await client.query(
        'SELECT name, email FROM "user" WHERE id = $1',
        [providerId]
      );

      if (provider.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Provider not found' },
          { status: 404 }
        );
      }

      const providerData = provider.rows[0];

      if (action === 'accept') {
        // Update consultation - assign provider and set status to accepted
        await client.query(
          `UPDATE consultations
           SET provider_id = $1, status = 'accepted', accepted_at = NOW(), updated_at = NOW()
           WHERE id = $2`,
          [providerId, consultationId]
        );

        // Notify patient about acceptance
        await notifyConsultationAccepted(consult.patient_id, providerData.name, consultationId);

        logInfo('Consultation accepted:', {
          consultationId,
          providerId,
          patientId: consult.patient_id,
        });

        await client.query('COMMIT');

        return NextResponse.json(
          {
            success: true,
            message: 'Consultation accepted successfully',
            consultation: {
              ...consult,
              provider_id: providerId,
              provider_name: providerData.name,
              status: 'accepted',
            },
          },
          { status: 200 }
        );

      } else {
        // Decline consultation
        await client.query(
          `UPDATE consultations
           SET status = 'declined', updated_at = NOW()
           WHERE id = $1`,
          [consultationId]
        );

        // Create notification for patient
        await client.query(
          `INSERT INTO notifications (
            id, user_id, title, message, type, entity_type, entity_id, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            crypto.randomUUID(),
            consult.patient_id,
            'Consultation Declined',
            `Your consultation request has been declined. Please try booking with another provider.`,
            'consultation_declined',
            'consultation',
            consultationId,
          ]
        );

        logInfo('Consultation declined:', {
          consultationId,
          providerId,
        });

        await client.query('COMMIT');

        return NextResponse.json(
          {
            success: true,
            message: 'Consultation declined',
          },
          { status: 200 }
        );
      }

    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Accept/decline consultation error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to process consultation action' },
      { status: 500 }
    );
  }
}
