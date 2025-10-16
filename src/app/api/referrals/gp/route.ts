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
    const gpId = searchParams.get('gpId');
    const status = searchParams.get('status'); // optional filter

    if (!gpId) {
      return NextResponse.json(
        { error: 'Missing required parameter: gpId' },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let query = `
      SELECT 
        r.*,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        s.name as specialist_name,
        s.email as specialist_email,
        pa.specialization as specialist_specialization
      FROM referrals r
      JOIN "user" p ON r.patient_id = p.id
      LEFT JOIN "user" s ON r.specialist_id = s.id
      LEFT JOIN provider_applications pa ON s.id = pa.user_id
      WHERE r.referring_provider_id = $1
    `;

    const params: any[] = [gpId];

    if (status) {
      query += ` AND r.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await client.query(query, params);

    const referrals = result.rows.map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      patient_email: row.patient_email,
      patient_phone: row.patient_phone,
      specialist_id: row.specialist_id,
      specialist_name: row.specialist_name,
      specialist_email: row.specialist_email,
      specialist_specialization: row.specialist_specialization,
      consultation_id: row.consultation_id,
      specialization: row.specialization,
      reason: row.reason,
      medical_history: row.medical_history,
      urgency: row.urgency,
      status: row.status,
      created_at: row.created_at,
      accepted_at: row.accepted_at,
      completed_at: row.completed_at,
      updated_at: row.updated_at
    }));

    // Get counts by status
    const countsQuery = await client.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM referrals
       WHERE referring_provider_id = $1
       GROUP BY status`,
      [gpId]
    );

    const counts = countsQuery.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      referrals,
      count: referrals.length,
      counts: {
        pending: counts.pending || 0,
        accepted: counts.accepted || 0,
        declined: counts.declined || 0,
        completed: counts.completed || 0,
        cancelled: counts.cancelled || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching GP referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
