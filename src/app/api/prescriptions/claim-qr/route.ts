import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logInfo, logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// POST: Pharmacy claims prescription using QR token
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body = await request.json();
    const { qrToken, pharmacyId } = body;

    if (!qrToken || !pharmacyId) {
      return NextResponse.json(
        { error: 'Missing required fields: qrToken, pharmacyId' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Find prescription by QR token
    const findQuery = `
      SELECT p.*, 
             patient.name as patient_name,
             patient.email as patient_email
      FROM prescriptions p
      LEFT JOIN "user" patient ON p.patient_id = patient.id
      WHERE p.qr_token = $1
    `;
    const findResult = await client.query(findQuery, [qrToken]);

    if (findResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Invalid QR code. Prescription not found.' },
        { status: 404 }
      );
    }

    const prescription = findResult.rows[0];

    // Check if already claimed by another pharmacy
    if (prescription.pharmacy_id && prescription.pharmacy_id !== pharmacyId) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'This prescription has already been claimed by another pharmacy.' },
        { status: 400 }
      );
    }

    // If already claimed by this pharmacy, just return success
    if (prescription.pharmacy_id === pharmacyId) {
      await client.query('COMMIT');
      return NextResponse.json({
        success: true,
        message: 'Prescription already claimed by your pharmacy',
        prescription
      });
    }

    // Claim the prescription
    const updateQuery = `
      UPDATE prescriptions 
      SET pharmacy_id = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    await client.query(updateQuery, [pharmacyId, prescription.id]);

    // Get pharmacy details
    const pharmacyQuery = 'SELECT name FROM "user" WHERE id = $1';
    const pharmacyResult = await client.query(pharmacyQuery, [pharmacyId]);
    const pharmacyName = pharmacyResult.rows[0]?.name || 'Pharmacy';

    // Create notification for patient
    const notificationId = crypto.randomUUID();
    await client.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        notificationId,
        prescription.patient_id,
        'prescription',
        'Pharmacy Processing Your Prescription',
        `${pharmacyName} has received your prescription and will begin processing it.`,
        `/patient/prescriptions/${prescription.id}`,
        false
      ]
    );

    await client.query('COMMIT');

    logInfo('Prescription claimed via QR code', {
      prescriptionId: prescription.id,
      pharmacyId,
      qrToken,
      patientId: prescription.patient_id
    });

    return NextResponse.json({
      success: true,
      message: 'Prescription claimed successfully',
      prescription: {
        ...prescription,
        pharmacy_id: pharmacyId
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    logError('QR claim error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to claim prescription' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
