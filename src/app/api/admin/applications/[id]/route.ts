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
    const applicationId = params.id;
    const client = await pool.connect();

    try {
      // Try to find in provider applications first
      const providerApp = await client.query(
        `SELECT 
          pa.*,
          u.name,
          u.email,
          u.phone_number
        FROM provider_applications pa
        JOIN "user" u ON pa.user_id = u.id
        WHERE pa.id = $1`,
        [applicationId]
      );

      if (providerApp.rows.length > 0) {
        return NextResponse.json({
          success: true,
          application: {
            ...providerApp.rows[0],
            type: 'provider',
          },
        });
      }

      // Try partner applications
      const partnerApp = await client.query(
        `SELECT 
          pa.*,
          u.name,
          u.email,
          u.phone_number
        FROM partner_applications pa
        JOIN "user" u ON pa.user_id = u.id
        WHERE pa.id = $1`,
        [applicationId]
      );

      if (partnerApp.rows.length > 0) {
        return NextResponse.json({
          success: true,
          application: {
            ...partnerApp.rows[0],
            type: 'partner',
          },
        });
      }

      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch application error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}
