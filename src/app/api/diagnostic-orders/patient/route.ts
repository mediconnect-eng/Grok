import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status'); // optional filter

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: patientId' },
        { status: 400 }
      );
    }

    // Build query with optional status filter
    let query = `
      SELECT 
        do.*,
        d.name as doctor_name,
        d.email as doctor_email,
        dc.name as diagnostic_center_name,
        dc.email as diagnostic_center_email,
        dc.phone as diagnostic_center_phone
      FROM diagnostic_orders do
      JOIN "user" d ON do.doctor_id = d.id
      LEFT JOIN "user" dc ON do.diagnostic_center_id = dc.id
      WHERE do.patient_id = $1
    `;

    const params: any[] = [patientId];

    if (status) {
      query += ` AND do.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY do.created_at DESC`;

    const result = await client.query(query, params);

    const orders = result.rows.map((row: any) => ({
      id: row.id,
      patient_id: row.patient_id,
      doctor_id: row.doctor_id,
      doctor_name: row.doctor_name,
      doctor_email: row.doctor_email,
      diagnostic_center_id: row.diagnostic_center_id,
      diagnostic_center_name: row.diagnostic_center_name,
      diagnostic_center_email: row.diagnostic_center_email,
      diagnostic_center_phone: row.diagnostic_center_phone,
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
       WHERE patient_id = $1
       GROUP BY status`,
      [patientId]
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
    console.error('❌ Error fetching patient diagnostic orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch diagnostic orders', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
