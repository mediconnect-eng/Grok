import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Find user
      const userResult = await client.query(
        'SELECT * FROM "user" WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if user exists or not for security
        return NextResponse.json(
          { success: true, message: 'If an account with that email exists, a verification email has been sent.' },
          { status: 200 }
        );
      }

      const user = userResult.rows[0];

      // Check if already verified
      if (user.emailVerified) {
        return NextResponse.json(
          { error: 'Email is already verified' },
          { status: 400 }
        );
      }

      // Check rate limiting (max 3 verification emails per hour)
      const recentVerifications = await client.query(
        `SELECT COUNT(*) FROM email_verifications 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [user.id]
      );

      if (parseInt(recentVerifications.rows[0].count) >= 3) {
        return NextResponse.json(
          { error: 'Too many verification emails sent. Please try again later.' },
          { status: 429 }
        );
      }

      // Invalidate old tokens
      await client.query(
        `UPDATE email_verifications 
         SET expires_at = NOW()
         WHERE user_id = $1 AND verified_at IS NULL`,
        [user.id]
      );

      // Generate new token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await client.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, verificationToken, expiresAt]
      );

      // Send verification email
      const emailSent = await sendVerificationEmail(email, user.name, verificationToken);
      
      if (!emailSent) {
        logError('Failed to send verification email to:', email);
        return NextResponse.json(
          { error: 'Failed to send verification email. Please try again.' },
          { status: 500 }
        );
      }

      logInfo('Verification email resent to:', email);

      return NextResponse.json(
        {
          success: true,
          message: 'Verification email sent successfully',
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Resend verification error:', error);
    
    return NextResponse.json(
      { error: 'Failed to resend verification email. Please try again.' },
      { status: 500 }
    );
  }
}
