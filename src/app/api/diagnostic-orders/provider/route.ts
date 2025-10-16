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
    const providerId = searchParams.get('providerId');
    const status = searchParams.get('status'); // optional filter

    if (!providerId) {
      return NextResponse.json(
        { error: 'Missing required parameter: providerId' },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let query = `
      SELECT 
        do.*,
        p.name as patient_name,
        p.email as patient_email,
        p.phone as patient_phone,
        dc.name as diagnostic_center_name,
        dc.email as diagnostic_center_email
      FROM diagnostic_orders do
      JOIN "user" p ON do.patient_id = p.id
      LEFT JOIN "user" dc ON do.diagnostic_center_id = dc.id
      WHERE do.doctor_id = $1
    `;

    const params: any[] = [providerId];

    if (status) {
      query += ` AND do.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY do.created_at DESC`;

    const result = await client.query(query, params);

    const orders = result.rows.map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      patient_name: row.patient_name,
      patient_email: row.patient_email,
      patient_phone: row.patient_phone,
      doctor_id: row.doctor_id,
      diagnostic_center_id: row.diagnostic_center_id,
      diagnostic_center_name: row.diagnostic_center_name,
      diagnostic_center_email: row.diagnostic_center_email,
      consultation_id: row.consultation_id,
      test_types: row.test_types,
      special_instructions: row.special_instructions,
      urgency: row.urgency,
      status: row.status,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      results_url: row.results_url,
      results_notes: row.results_notes,
      order_fee: row.order_fee,
      payment_status: row.payment_status,
      created_at: row.created_at,
      scheduled_at: row.scheduled_at,
      completed_at: row.completed_at,
      updated_at: row.updated_at
    }));

    // Get counts by status
    const countsQuery = await client.query(
      `SELECT 
        status,
        COUNT(*) as count
       FROM diagnostic_orders
       WHERE doctor_id = $1
       GROUP BY status`,
      [providerId]
    );

    const counts = countsQuery.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
      counts: {
        pending: counts.pending || 0,
        scheduled: counts.scheduled || 0,
        sample_collected: counts.sample_collected || 0,
        in_progress: counts.in_progress || 0,
        completed: counts.completed || 0,
        cancelled: counts.cancelled || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching provider diagnostic orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnostic orders', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
