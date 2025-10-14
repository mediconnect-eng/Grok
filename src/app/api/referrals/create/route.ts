import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { notifyReferralCreated, notifySpecialistNewReferral } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const {
      consultationId,
      patientId,
      referringProviderId,
      specialization,
      reason,
      medicalHistory,
      urgency = 'routine'
    } = body;

    // Validate required fields
    if (!consultationId || !patientId || !referringProviderId || !specialization || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, patientId, referringProviderId, specialization, reason' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Verify consultation exists and belongs to patient
    const consultationCheck = await client.query(
      `SELECT id, patient_id, provider_id 
       FROM consultations 
       WHERE id = $1 AND patient_id = $2`,
      [consultationId, patientId]
    );

    if (consultationCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Consultation not found or does not belong to patient' },
        { status: 404 }
      );
    }

    // Find available specialists by specialization
    const specialistsQuery = await client.query(
      `SELECT u.id, u.name, u.email, pa.specialization
       FROM "user" u
       LEFT JOIN provider_applications pa ON u.id = pa.user_id
       WHERE u.role = 'specialist' 
       AND (pa.specialization ILIKE $1 OR pa.specialization ILIKE '%' || $1 || '%')
       AND (pa.status = 'approved' OR pa.status IS NULL)
       LIMIT 20`,
      [specialization]
    );

    const availableSpecialists = specialistsQuery.rows;

    if (availableSpecialists.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: `No specialists found for specialization: ${specialization}` },
        { status: 404 }
      );
    }

    // Create referral record (without specialist_id - they will accept it)
    const referralResult = await client.query(
      `INSERT INTO referrals (
        patient_id,
        referring_provider_id,
        consultation_id,
        specialization,
        reason,
        medical_history,
        urgency,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        patientId,
        referringProviderId,
        consultationId,
        specialization,
        reason,
        medicalHistory || null,
        urgency
      ]
    );

    const referral = referralResult.rows[0];

    // Get patient and referring provider names
    const namesQuery = await client.query(
      `SELECT id, name FROM "user" WHERE id IN ($1, $2)`,
      [patientId, referringProviderId]
    );

    const names = namesQuery.rows.reduce((acc: any, row: any) => {
      acc[row.id] = row.name;
      return acc;
    }, {});

    const patientName = names[patientId];
    const referringProviderName = names[referringProviderId];

    // Notify patient about the referral
    await notifyReferralCreated(patientId, referringProviderName, specialization, referral.id);

    // Notify all available specialists about the referral
    for (const specialist of availableSpecialists) {
      await notifySpecialistNewReferral(
        specialist.id,
        patientName,
        referringProviderName,
        referral.id
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Referral created: ${referral.id} - ${specialization} for patient ${patientId}`);
    console.log(`📧 Notified ${availableSpecialists.length} specialist(s)`);

    return NextResponse.json({
      success: true,
      referral: {
        ...referral,
        patientName,
        referringProviderName,
        availableSpecialistsCount: availableSpecialists.length,
        availableSpecialists: availableSpecialists.map(s => ({
          id: s.id,
          name: s.name,
          specialization: s.specialization
        }))
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
