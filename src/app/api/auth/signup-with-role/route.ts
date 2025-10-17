import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : { rejectUnauthorized: false },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    const validRoles = ['patient', 'gp', 'specialist', 'pharmacy', 'diagnostics', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM "user" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user with role
    const userId = randomUUID();
    const now = new Date().toISOString();

    await pool.query(`
      INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, email, false, name, role, now, now]);

    // Hash password and create credential account
    const hashedPassword = await bcrypt.hash(password, 10);
    const accountId = randomUUID();

    await pool.query(`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [accountId, userId, email, 'credential', hashedPassword, now, now]);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        role,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
