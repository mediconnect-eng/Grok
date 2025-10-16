import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const specialistId = searchParams.get('specialistId');
    const status = searchParams.get('status') || 'pending';

    if (!specialistId) {
      return NextResponse.json(
        { error: 'Missing required parameter: specialistId' },
        { status: 400 }
      );
    }

    // Fetch referrals based on status
    let query = '';
    let params: any[] = [];

    if (status === 'pending') {
      // For pending referrals, show all that match specialist's specialization
      query = `
        SELECT 
          r.*,
          p.name as patient_name,
          p.email as patient_email,
          p.phone as patient_phone,
          rp.name as referring_provider_name,
          rp.email as referring_provider_email,
          pp.medical_conditions,
          pp.allergies,
          pp.current_medications,
          pp.blood_type,
          c.chief_complaint as original_complaint,
          c.symptoms as original_symptoms,
          c.diagnosis as original_diagnosis
        FROM referrals r
        JOIN "user" p ON r.patient_id = p.id
        JOIN "user" rp ON r.referring_provider_id = rp.id
        LEFT JOIN patient_profiles pp ON r.patient_id = pp.user_id
        LEFT JOIN consultations c ON r.consultation_id = c.id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
      `;
      params = [];
    } else {
      // For accepted/declined, show only this specialist's actions
      query = `
        SELECT 
          r.*,
          p.name as patient_name,
          p.email as patient_email,
          p.phone as patient_phone,
          rp.name as referring_provider_name,
          rp.email as referring_provider_email,
          pp.medical_conditions,
          pp.allergies,
          pp.current_medications,
          pp.blood_type,
          c.chief_complaint as original_complaint,
          c.symptoms as original_symptoms,
          c.diagnosis as original_diagnosis
        FROM referrals r
        JOIN "user" p ON r.patient_id = p.id
        JOIN "user" rp ON r.referring_provider_id = rp.id
        LEFT JOIN patient_profiles pp ON r.patient_id = pp.user_id
        LEFT JOIN consultations c ON r.consultation_id = c.id
        WHERE r.specialist_id = $1 AND r.status = $2
        ORDER BY r.updated_at DESC
      `;
      params = [specialistId, status];
    }

    const result = await client.query(query, params);

    const referrals = result.rows.map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      patient_email: row.patient_email,
      patient_phone: row.patient_phone,
      referring_provider_id: row.referring_provider_id,
      referring_provider_name: row.referring_provider_name,
      referring_provider_email: row.referring_provider_email,
      specialist_id: row.specialist_id,
      consultation_id: row.consultation_id,
      specialization: row.specialization,
      reason: row.reason,
      medical_history: row.medical_history,
      urgency: row.urgency,
      status: row.status,
      created_at: row.created_at,
      accepted_at: row.accepted_at,
      completed_at: row.completed_at,
      updated_at: row.updated_at,
      // Patient medical profile
      patient_profile: {
        medical_conditions: row.medical_conditions,
        allergies: row.allergies,
        current_medications: row.current_medications,
        blood_type: row.blood_type
      },
      // Original consultation details
      original_consultation: row.consultation_id ? {
        chief_complaint: row.original_complaint,
        symptoms: row.original_symptoms,
        diagnosis: row.original_diagnosis
      } : null
    }));

    return NextResponse.json({
      success: true,
      referrals,
      count: referrals.length,
      status: status
    });

  } catch (error: any) {
    console.error('❌ Error fetching specialist referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
