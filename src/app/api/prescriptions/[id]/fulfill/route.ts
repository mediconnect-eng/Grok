import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logInfo, logError } from '@/lib/logger';
import { notifyPrescriptionFilled } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

interface FulfillRequest {
  pharmacyId: string;
  pharmacyName: string;
  status: 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    const prescriptionId = params.id;
    const body: FulfillRequest = await request.json();
    
    const { pharmacyId, pharmacyName, status, notes } = body;

    // Validate required fields
    if (!pharmacyId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: pharmacyId, status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: preparing, ready, delivered, or cancelled' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Check if prescription exists
    const checkQuery = 'SELECT * FROM prescriptions WHERE id = $1';
    const checkResult = await client.query(checkQuery, [prescriptionId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    const prescription = checkResult.rows[0];

    // Update prescription status
    const updateQuery = `
      UPDATE prescriptions 
      SET status = $1,
          pharmacy_id = $2,
          notes = CASE 
            WHEN $3 IS NOT NULL THEN COALESCE(notes, '') || E'\n\nPharmacy Notes: ' || $3
            ELSE notes
          END,
          updated_at = NOW(),
          fulfilled_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE fulfilled_at END
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      status,
      pharmacyId,
      notes || null,
      prescriptionId
    ]);

    // Notify patient about prescription status update
    if (status === 'ready' || status === 'delivered') {
      await notifyPrescriptionFilled(prescription.patient_id, pharmacyName || 'Pharmacy', prescriptionId);
    }

    await client.query('COMMIT');

    logInfo('Prescription updated by pharmacy', {
      prescriptionId,
      pharmacyId,
      status,
      patientId: prescription.patient_id
    });

    return NextResponse.json({
      success: true,
      prescription: updateResult.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    logError('Prescription fulfillment error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to update prescription' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET: Get prescription details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prescriptionId = params.id;

    const query = `
      SELECT p.*,
             patient.name as patient_name,
             patient.email as patient_email,
             patient.phone as patient_phone,
             provider.name as provider_name,
             provider.email as provider_email,
             pp.blood_group,
             pp.allergies,
             pp.current_medications
      FROM prescriptions p
      LEFT JOIN "user" patient ON p.patient_id = patient.id
      LEFT JOIN "user" provider ON p.provider_id = provider.id
      LEFT JOIN patient_profiles pp ON p.patient_id = pp.user_id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [prescriptionId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prescription: result.rows[0]
    });

  } catch (error: any) {
    logError('Fetch prescription details error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}
