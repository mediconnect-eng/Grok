import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { notifyReferralAccepted } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { action, specialistId, notes } = body;
    const referralId = params.id;

    // Validate required fields
    if (!action || !specialistId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, specialistId' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Get referral details
    const referralQuery = await client.query(
      `SELECT r.*, 
              p.name as patient_name, 
              p.email as patient_email,
              rp.name as referring_provider_name
       FROM referrals r
       JOIN "user" p ON r.patient_id = p.id
       JOIN "user" rp ON r.referring_provider_id = rp.id
       WHERE r.id = $1`,
      [referralId]
    );

    if (referralQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    const referral = referralQuery.rows[0];

    // Check if referral is still pending
    if (referral.status !== 'pending') {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: `Referral already ${referral.status}` },
        { status: 400 }
      );
    }

    // Get specialist details
    const specialistQuery = await client.query(
      `SELECT id, name, email FROM "user" WHERE id = $1 AND role = 'specialist'`,
      [specialistId]
    );

    if (specialistQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Specialist not found' },
        { status: 404 }
      );
    }

    const specialist = specialistQuery.rows[0];

    if (action === 'accept') {
      // Update referral status and assign specialist
      await client.query(
        `UPDATE referrals 
         SET status = 'accepted', 
             specialist_id = $1, 
             accepted_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [specialistId, referralId]
      );

      // Create a new consultation for the specialist
      const consultationResult = await client.query(
        `INSERT INTO consultations (
          patient_id,
          provider_id,
          provider_type,
          chief_complaint,
          symptoms,
          urgency,
          status,
          doctor_notes
        ) VALUES ($1, $2, 'specialist', $3, $4, $5, 'accepted', $6)
        RETURNING *`,
        [
          referral.patient_id,
          specialistId,
          `Referral: ${referral.specialization}`,
          referral.reason,
          referral.urgency,
          `Referred by Dr. ${referral.referring_provider_name}. ${notes || ''}`
        ]
      );

      const consultation = consultationResult.rows[0];

      // Update referral with consultation_id if it doesn't have one
      if (!referral.consultation_id) {
        await client.query(
          `UPDATE referrals SET consultation_id = $1 WHERE id = $2`,
          [consultation.id, referralId]
        );
      }

      // Notify patient and GP about acceptance
      await notifyReferralAccepted(
        referral.patient_id,
        referral.referring_provider_id,
        specialist.name,
        referralId
      );

      await client.query('COMMIT');

      console.log(`✅ Referral accepted: ${referralId} by specialist ${specialistId}`);
      console.log(`📅 Consultation created: ${consultation.id}`);

      return NextResponse.json({
        success: true,
        message: 'Referral accepted and consultation created',
        referral: {
          id: referralId,
          status: 'accepted',
          specialist_id: specialistId,
          specialist_name: specialist.name
        },
        consultation: {
          id: consultation.id,
          patient_id: consultation.patient_id,
          provider_id: consultation.provider_id,
          status: consultation.status
        }
      });

    } else if (action === 'decline') {
      // Update referral status
      await client.query(
        `UPDATE referrals 
         SET status = 'declined', 
             updated_at = NOW()
         WHERE id = $1`,
        [referralId]
      );

      // Notify referring GP about decline
      await client.query(
        `INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          link,
          read
        ) VALUES ($1, 'referral', $2, $3, $4, false)`,
        [
          referral.referring_provider_id,
          'Referral Declined',
          `Dr. ${specialist.name} has declined the referral of ${referral.patient_name} for ${referral.specialization}. ${notes ? 'Note: ' + notes : 'Other specialists may still accept this referral.'}`,
          '/gp/consultations'
        ]
      );

      await client.query('COMMIT');

      console.log(`❌ Referral declined: ${referralId} by specialist ${specialistId}`);

      return NextResponse.json({
        success: true,
        message: 'Referral declined',
        referral: {
          id: referralId,
          status: 'declined'
        }
      });
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error processing referral action:', error);
    return NextResponse.json(
      { error: 'Failed to process referral action', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
