import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { hash } from '@node-rs/argon2';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';
import { validatePassword } from '@/lib/password-validation';
import { logInfo, logError, logAuth } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, dateOfBirth, password } = body;

    // Validate required fields (only name, email, phone, password)
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || 'Invalid password' },
        { status: 400 }
      );
    }

    // Validate age only if dateOfBirth provided (optional)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 13) {
        return NextResponse.json(
          { error: 'You must be at least 13 years old to register' },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();

    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id, email FROM "user" WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const passwordHash = await hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      // Generate user ID
      const userId = crypto.randomUUID();
      const now = new Date();

      // Insert user
      await client.query(
        `INSERT INTO "user" (id, email, "emailVerified", name, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, email, false, name, now, now]
      );

      // Insert account (credentials)
      const accountId = crypto.randomUUID();
      await client.query(
        `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [accountId, userId, email, 'credential', passwordHash, now, now]
      );

      // Add phone and date of birth to user table (DOB optional)
      await client.query(
        `UPDATE "user" SET phone_number = $1, date_of_birth = $2 WHERE id = $3`,
        [phone, dateOfBirth || null, userId]
      );

      // Create patient profile
      await client.query(
        `INSERT INTO patient_profiles (user_id, onboarding_completed)
         VALUES ($1, $2)`,
        [userId, false]
      );

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await client.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, verificationToken, expiresAt]
      );

      // Send verification email
      const emailSent = await sendVerificationEmail(email, name, verificationToken);
      
      if (!emailSent) {
        logError('Failed to send verification email to:', email);
      }

      logAuth('signup', userId, { email, name });
      logInfo('New patient account created:', email);

      return NextResponse.json(
        {
          success: true,
          message: 'Account created successfully. Please check your email to verify your account.',
          userId,
        },
        { status: 201 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Patient signup error:', error);
    
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
