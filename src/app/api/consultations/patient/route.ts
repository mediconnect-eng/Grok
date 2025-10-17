import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get all consultations for this patient with provider details
      const result = await client.query(
        `SELECT 
          c.*,
          p.name as provider_name,
          p.email as provider_email,
          p.role as provider_type
         FROM consultations c
         LEFT JOIN "user" p ON c.provider_id = p.id
         WHERE c.patient_id = $1
         ORDER BY c.created_at DESC`,
        [patientId]
      );

      return NextResponse.json(
        {
          success: true,
          consultations: result.rows,
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch patient consultations error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}
