import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logInfo, logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionRequest {
  consultationId: string;
  patientId: string;
  providerId: string;
  providerName: string;
  medications: Medication[];
  diagnosis?: string;
  notes?: string;
  pharmacyId?: string;
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    const body: PrescriptionRequest = await request.json();
    
    const { 
      consultationId, 
      patientId, 
      providerId, 
      providerName,
      medications, 
      diagnosis, 
      notes,
      pharmacyId 
    } = body;

    // Validate required fields
    if (!consultationId || !patientId || !providerId || !medications || medications.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: consultationId, patientId, providerId, medications' },
        { status: 400 }
      );
    }

    // Validate medications
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        return NextResponse.json(
          { error: 'Each medication must have name, dosage, frequency, and duration' },
          { status: 400 }
        );
      }
    }

    await client.query('BEGIN');

    // Create prescription record
    const prescriptionId = crypto.randomUUID();
    const prescriptionQuery = `
      INSERT INTO prescriptions (
        id, consultation_id, patient_id, provider_id, provider_name,
        diagnosis, notes, status, pharmacy_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const prescriptionResult = await client.query(prescriptionQuery, [
      prescriptionId,
      consultationId,
      patientId,
      providerId,
      providerName,
      diagnosis || null,
      notes || null,
      'pending',
      pharmacyId || null
    ]);

    // Insert medications as JSON in notes or create separate items
    // For now, we'll store medications as JSON in the notes field
    // In production, you'd want a separate prescription_items table
    const medicationsJson = JSON.stringify(medications);
    
    await client.query(
      'UPDATE prescriptions SET notes = $1 WHERE id = $2',
      [`${notes || ''}\n\nMedications:\n${medicationsJson}`, prescriptionId]
    );

    // Create notification for patient
    const notificationId = crypto.randomUUID();
    await client.query(
      `INSERT INTO notifications (
        id, user_id, type, title, message, link, read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        notificationId,
        patientId,
        'prescription',
        'New Prescription',
        `Dr. ${providerName} has prescribed ${medications.length} medication(s) for you.`,
        `/patient/prescriptions/${prescriptionId}`,
        false
      ]
    );

    // Create notification for pharmacy if specified
    if (pharmacyId) {
      const pharmacyNotificationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO notifications (
          id, user_id, type, title, message, link, read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          pharmacyNotificationId,
          pharmacyId,
          'prescription',
          'New Prescription to Fulfill',
          `New prescription for patient. ${medications.length} medication(s).`,
          `/pharmacy/prescriptions/${prescriptionId}`,
          false
        ]
      );
    }

    // Update consultation status if needed
    await client.query(
      `UPDATE consultations 
       SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'in_progress'`,
      [consultationId]
    );

    await client.query('COMMIT');

    logInfo('Prescription created', {
      prescriptionId,
      consultationId,
      patientId,
      providerId,
      medicationsCount: medications.length
    });

    return NextResponse.json({
      success: true,
      prescription: prescriptionResult.rows[0],
      medications
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    logError('Prescription creation error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create prescription' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET: Fetch prescriptions for a patient
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const providerId = searchParams.get('providerId');
    const pharmacyId = searchParams.get('pharmacyId');

    let query = '';
    let params: any[] = [];

    if (patientId) {
      // Get patient's prescriptions
      query = `
        SELECT p.*, 
               u.name as provider_name,
               u.email as provider_email
        FROM prescriptions p
        LEFT JOIN "user" u ON p.provider_id = u.id
        WHERE p.patient_id = $1
        ORDER BY p.created_at DESC
      `;
      params = [patientId];
    } else if (providerId) {
      // Get prescriptions created by this provider
      query = `
        SELECT p.*,
               u.name as patient_name,
               u.email as patient_email
        FROM prescriptions p
        LEFT JOIN "user" u ON p.patient_id = u.id
        WHERE p.provider_id = $1
        ORDER BY p.created_at DESC
      `;
      params = [providerId];
    } else if (pharmacyId) {
      // Get prescriptions assigned to this pharmacy
      query = `
        SELECT p.*,
               u.name as patient_name,
               u.email as patient_email,
               prov.name as provider_name
        FROM prescriptions p
        LEFT JOIN "user" u ON p.patient_id = u.id
        LEFT JOIN "user" prov ON p.provider_id = prov.id
        WHERE p.pharmacy_id = $1
        ORDER BY p.created_at DESC
      `;
      params = [pharmacyId];
    } else {
      return NextResponse.json(
        { error: 'Must provide patientId, providerId, or pharmacyId' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, params);

    return NextResponse.json({
      prescriptions: result.rows
    });

  } catch (error: any) {
    logError('Fetch prescriptions error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}
