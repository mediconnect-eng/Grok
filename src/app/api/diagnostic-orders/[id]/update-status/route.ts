import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import {
  notifyDiagnosticOrderScheduled,
  notifyDiagnosticOrderCompleted,
  notifyDiagnosticOrderStatusUpdate
} from '@/lib/notifications';

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
    const { status, diagnosticCenterId, scheduledDate, scheduledTime, resultsUrl, resultsNotes } = body;
    const orderId = params.id;

    // Validate required fields
    if (!status || !diagnosticCenterId) {
      return NextResponse.json(
        { error: 'Missing required fields: status, diagnosticCenterId' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'scheduled', 'sample_collected', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Get order details
    const orderQuery = await client.query(
      `SELECT 
        do.*,
        p.name as patient_name,
        p.email as patient_email,
        d.name as doctor_name,
        d.email as doctor_email
       FROM diagnostic_orders do
       JOIN "user" p ON do.patient_id = p.id
       JOIN "user" d ON do.doctor_id = d.id
       WHERE do.id = $1`,
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Diagnostic order not found' },
        { status: 404 }
      );
    }

    const order = orderQuery.rows[0];

    // Get diagnostic center name
    const centerQuery = await client.query(
      `SELECT name FROM "user" WHERE id = $1 AND role = 'diagnostic'`,
      [diagnosticCenterId]
    );

    if (centerQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Diagnostic center not found' },
        { status: 404 }
      );
    }

    const centerName = centerQuery.rows[0].name;

    // Build update query based on status
    let updateQuery = `UPDATE diagnostic_orders SET status = $1, updated_at = NOW()`;
    const updateParams: any[] = [status];
    let paramCount = 1;

    // Assign diagnostic center if not already assigned
    if (!order.diagnostic_center_id) {
      paramCount++;
      updateQuery += `, diagnostic_center_id = $${paramCount}`;
      updateParams.push(diagnosticCenterId);
    }

    // Handle scheduled status
    if (status === 'scheduled' && scheduledDate) {
      paramCount++;
      updateQuery += `, scheduled_date = $${paramCount}`;
      updateParams.push(scheduledDate);
      
      if (scheduledTime) {
        paramCount++;
        updateQuery += `, scheduled_time = $${paramCount}`;
        updateParams.push(scheduledTime);
      }
      
      paramCount++;
      updateQuery += `, scheduled_at = NOW()`;
    }

    // Handle completed status
    if (status === 'completed') {
      paramCount++;
      updateQuery += `, completed_at = NOW()`;
      
      if (resultsUrl) {
        paramCount++;
        updateQuery += `, results_url = $${paramCount}`;
        updateParams.push(resultsUrl);
      }
      
      if (resultsNotes) {
        paramCount++;
        updateQuery += `, results_notes = $${paramCount}`;
        updateParams.push(resultsNotes);
      }
    }

    updateQuery += ` WHERE id = $${paramCount + 1} RETURNING *`;
    updateParams.push(orderId);

    const updateResult = await client.query(updateQuery, updateParams);
    const updatedOrder = updateResult.rows[0];

    // Send notifications based on status
    if (status === 'scheduled') {
      await notifyDiagnosticOrderScheduled(
        order.patient_id,
        order.doctor_id,
        centerName,
        scheduledDate || '',
        scheduledTime || '',
        orderId
      );
    } else if (status === 'completed') {
      await notifyDiagnosticOrderCompleted(
        order.patient_id,
        order.doctor_id,
        centerName,
        orderId,
        resultsUrl
      );
    } else if (['sample_collected', 'in_progress', 'cancelled'].includes(status)) {
      await notifyDiagnosticOrderStatusUpdate(
        order.patient_id,
        order.doctor_id,
        centerName,
        status,
        orderId
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Diagnostic order ${orderId} updated to status: ${status} by ${centerName}`);

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        diagnostic_center_id: updatedOrder.diagnostic_center_id,
        scheduled_date: updatedOrder.scheduled_date,
        scheduled_time: updatedOrder.scheduled_time,
        results_url: updatedOrder.results_url,
        results_notes: updatedOrder.results_notes,
        updated_at: updatedOrder.updated_at
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating diagnostic order:', error);
    return NextResponse.json(
      { error: 'Failed to update diagnostic order', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
