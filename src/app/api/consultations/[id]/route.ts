import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;

    if (!consultationId) {
      return NextResponse.json(
        { error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Fetch consultation with provider details
      const result = await client.query(
        `SELECT 
          c.*,
          p.name as provider_name,
          p.email as provider_email,
          p.role as provider_type,
          patient.name as patient_name,
          patient.email as patient_email,
          patient.phone as patient_phone
         FROM consultations c
         LEFT JOIN "user" p ON c.provider_id = p.id
         LEFT JOIN "user" patient ON c.patient_id = patient.id
         WHERE c.id = $1`,
        [consultationId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          consultation: result.rows[0],
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch consultation by ID error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consultation' },
      { status: 500 }
    );
  }
}
