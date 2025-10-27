/**
 * Admin Verification API
 * Verifies if the current user has admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { auth } from '@/lib/auth';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check user role in database
    const client = await pool.connect();
    
    try {
      const result = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [session.user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { isAdmin: false, error: 'User not found' },
          { status: 404 }
        );
      }

      const role = result.rows[0].role;
      const isAdmin = role === 'admin';

      return NextResponse.json({
        isAdmin,
        userId: session.user.id,
        email: session.user.email,
        role,
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Admin verification error:', error);
    
    return NextResponse.json(
      { isAdmin: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
