import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET() {
  try {
    const client = await pool.connect();

    try {
      // Try to get the doctor@healthhub.com account first
      let result = await client.query(
        `SELECT id, name, email, role 
         FROM "user" 
         WHERE email = $1 AND role = $2`,
        ['doctor@healthhub.com', 'gp']
      );

      // If not found, get any GP user
      if (result.rows.length === 0) {
        result = await client.query(
          `SELECT id, name, email, role 
           FROM "user" 
           WHERE role = $1 
           LIMIT 1`,
          ['gp']
        );
      }

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'No GP user found in database' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: result.rows[0],
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch GP user error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GP user' },
      { status: 500 }
    );
  }
}
