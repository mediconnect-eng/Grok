import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendEmailVerifiedConfirmation } from '@/lib/email';
import { logInfo, logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find verification record
      const verificationResult = await client.query(
        `SELECT * FROM email_verifications 
         WHERE token = $1 AND verified_at IS NULL`,
        [token]
      );

      if (verificationResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid or expired verification token' },
          { status: 400 }
        );
      }

      const verification = verificationResult.rows[0];

      // Check if token is expired
      if (new Date(verification.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Verification link has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      // Get user details
      const userResult = await client.query(
        'SELECT * FROM "user" WHERE id = $1',
        [verification.user_id]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Mark email as verified
      await client.query(
        `UPDATE "user" 
         SET "emailVerified" = true, email_verified_at = NOW()
         WHERE id = $1`,
        [verification.user_id]
      );

      // Mark verification as used
      await client.query(
        `UPDATE email_verifications 
         SET verified_at = NOW()
         WHERE token = $1`,
        [token]
      );

      // Send confirmation email
      await sendEmailVerifiedConfirmation(user.email, user.name);

      logInfo('Email verified successfully:', user.email);

      return NextResponse.json(
        {
          success: true,
          message: 'Email verified successfully',
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Email verification error:', error);
    
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    );
  }
}
