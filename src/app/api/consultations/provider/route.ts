import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const providerType = searchParams.get('providerType'); // 'gp' or 'specialist'
    const status = searchParams.get('status'); // filter by status

    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          c.*,
          pat.name as patient_name,
          pat.email as patient_email,
          pat.phone_number as patient_phone,
          pat.date_of_birth as patient_dob,
          pp.blood_group,
          pp.allergies,
          pp.current_medications,
          pp.medical_history
        FROM consultations c
        JOIN "user" pat ON c.patient_id = pat.id
        LEFT JOIN patient_profiles pp ON pat.id = pp.user_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 0;

      // If providerId specified, get consultations assigned to this provider
      if (providerId) {
        paramCount++;
        query += ` AND c.provider_id = $${paramCount}`;
        params.push(providerId);
      } else if (providerType) {
        // If no specific provider, show all pending for this provider type
        paramCount++;
        query += ` AND c.provider_type = $${paramCount}`;
        params.push(providerType);
        
        // Only show unassigned consultations if no providerId
        query += ` AND c.provider_id IS NULL`;
      }

      // Filter by status
      if (status) {
        paramCount++;
        query += ` AND c.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY c.created_at DESC`;

      const consultations = await client.query(query, params);

      return NextResponse.json(
        {
          success: true,
          consultations: consultations.rows,
          count: consultations.rows.length,
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch provider consultations error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}
