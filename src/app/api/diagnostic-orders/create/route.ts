import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { 
  notifyDiagnosticOrderCreated, 
  notifyDiagnosticCentersNewOrder 
} from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Common diagnostic test types
export const TEST_TYPES = [
  'Complete Blood Count (CBC)',
  'Blood Glucose',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Function Test (TFT)',
  'Urinalysis',
  'HbA1c',
  'Vitamin D',
  'Vitamin B12',
  'Chest X-Ray',
  'ECG',
  'Ultrasound',
  'MRI Scan',
  'CT Scan',
  'Echocardiogram',
  'Mammogram',
  'Bone Density Scan'
];

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const {
      patientId,
      doctorId,
      consultationId,
      testTypes,
      specialInstructions,
      urgency = 'routine',
      diagnosticCenterId
    } = body;

    // Validate required fields
    if (!patientId || !doctorId || !testTypes || testTypes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, doctorId, testTypes' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Verify consultation exists if provided
    if (consultationId) {
      const consultationCheck = await client.query(
        `SELECT id FROM consultations WHERE id = $1 AND patient_id = $2`,
        [consultationId, patientId]
      );

      if (consultationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Consultation not found or does not belong to patient' },
          { status: 404 }
        );
      }
    }

    // Create diagnostic order
    const orderResult = await client.query(
      `INSERT INTO diagnostic_orders (
        patient_id,
        doctor_id,
        diagnostic_center_id,
        consultation_id,
        test_types,
        special_instructions,
        urgency,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        patientId,
        doctorId,
        diagnosticCenterId || null,
        consultationId || null,
        testTypes,
        specialInstructions || null,
        urgency
      ]
    );

    const order = orderResult.rows[0];

    // Get names for notifications
    const namesQuery = await client.query(
      `SELECT id, name, email FROM "user" WHERE id IN ($1, $2)`,
      [patientId, doctorId]
    );

    const names = namesQuery.rows.reduce((acc: any, row: any) => {
      acc[row.id] = { name: row.name, email: row.email };
      return acc;
    }, {});

    const patientName = names[patientId]?.name;
    const doctorName = names[doctorId]?.name;

    // Notify patient about the diagnostic order
    await notifyDiagnosticOrderCreated(
      patientId,
      doctorName,
      testTypes,
      order.id
    );

    // If specific diagnostic center assigned, notify them
    if (diagnosticCenterId) {
      await notifyDiagnosticCentersNewOrder(
        [diagnosticCenterId],
        patientName,
        doctorName,
        testTypes,
        order.id
      );
    } else {
      // Notify all diagnostic centers about the order
      const centersQuery = await client.query(
        `SELECT id FROM "user" WHERE role = 'diagnostic_center' LIMIT 20`
      );

      if (centersQuery.rows.length > 0) {
        const centerIds = centersQuery.rows.map((c: any) => c.id);
        await notifyDiagnosticCentersNewOrder(
          centerIds,
          patientName,
          doctorName,
          testTypes,
          order.id
        );
      }
    }

    await client.query('COMMIT');

    console.log(`✅ Diagnostic order created: ${order.id} - ${testTypes.length} test(s) for patient ${patientId}`);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        patient_id: order.patient_id,
        doctor_id: order.doctor_id,
        diagnostic_center_id: order.diagnostic_center_id,
        consultation_id: order.consultation_id,
        test_types: order.test_types,
        special_instructions: order.special_instructions,
        urgency: order.urgency,
        status: order.status,
        created_at: order.created_at,
        patientName,
        doctorName
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating diagnostic order:', error);
    return NextResponse.json(
      { error: 'Failed to create diagnostic order', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET endpoint to fetch available test types
export async function GET() {
  return NextResponse.json({
    success: true,
    testTypes: TEST_TYPES
  });
}
