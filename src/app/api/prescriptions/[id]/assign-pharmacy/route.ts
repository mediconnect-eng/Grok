import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logInfo, logError } from '@/lib/logger';
import { notifyPharmacyNewPrescription } from '@/lib/notifications';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// POST: Patient assigns pharmacy to prescription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    const prescriptionId = params.id;
    const body = await request.json();
    
    const { pharmacyId, patientId } = body;

    if (!pharmacyId || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields: pharmacyId, patientId' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Verify prescription belongs to patient and has no pharmacy assigned yet
    const checkQuery = `
      SELECT * FROM prescriptions 
      WHERE id = $1 AND patient_id = $2
    `;
    const checkResult = await client.query(checkQuery, [prescriptionId, patientId]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Prescription not found or unauthorized' },
        { status: 404 }
      );
    }

    const prescription = checkResult.rows[0];

    if (prescription.pharmacy_id) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Prescription already assigned to a pharmacy' },
        { status: 400 }
      );
    }

    // Assign pharmacy to prescription
    const updateQuery = `
      UPDATE prescriptions 
      SET pharmacy_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await client.query(updateQuery, [pharmacyId, prescriptionId]);

    // Get pharmacy details
    const pharmacyQuery = 'SELECT name FROM "user" WHERE id = $1';
    const pharmacyResult = await client.query(pharmacyQuery, [pharmacyId]);
    const pharmacyName = pharmacyResult.rows[0]?.name || 'Pharmacy';

    // Notify pharmacy about new prescription
    await notifyPharmacyNewPrescription(
      pharmacyId,
      prescription.patient_name || 'Patient',
      prescriptionId
    );

    await client.query('COMMIT');

    logInfo('Pharmacy assigned to prescription', {
      prescriptionId,
      pharmacyId,
      patientId
    });

    return NextResponse.json({
      success: true,
      prescription: updateResult.rows[0],
      pharmacyName
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    logError('Pharmacy assignment error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to assign pharmacy' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
