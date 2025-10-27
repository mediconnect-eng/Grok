import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server';

import { Pool } from 'pg';

import bcrypt from 'bcryptjs';import { Pool } from 'pg';import { Pool } from 'pg';



const pool = new Pool({import bcrypt from 'bcryptjs';import { hash } from '@node-rs/argon2';

  connectionString: process.env.DATABASE_URL,

  ssl: {import crypto from 'crypto';

    rejectUnauthorized: false,

  },const pool = new Pool({import { validatePassword } from '@/lib/password-validation';

});

  connectionString: process.env.DATABASE_URL,import { logAuth, logError, logInfo } from '@/lib/logger';

export async function POST(request: NextRequest) {

  try {  ssl: {

    const body = await request.json();

    const { email, password, name, role } = body;    rejectUnauthorized: false,const pool = new Pool({



    if (!email || !password || !name) {  },  connectionString: process.env.DATABASE_URL,

      return NextResponse.json(

        { error: 'Email, password, and name are required' },});  ssl: {

        { status: 400 }

      );    rejectUnauthorized: false,

    }

export async function POST(request: NextRequest) {  },

    const validRoles = ['patient', 'admin', 'gp', 'specialist', 'pharmacy', 'diagnostic-center'];

    const userRole = validRoles.includes(role) ? role : 'patient';  try {});



    const client = await pool.connect();    const body = await request.json();



    try {    const { email, password, name, role } = body;type RoleDescriptor = {

      const existingUser = await client.query(

        'SELECT id FROM "user" WHERE email = $1',  dbRole: string;

        [email.toLowerCase().trim()]

      );    // Validate required fields  responseRole: string;



      if (existingUser.rows.length > 0) {    if (!email || !password || !name) {};

        return NextResponse.json(

          { error: 'An account with this email already exists' },      return NextResponse.json(

          { status: 409 }

        );        { error: 'Email, password, and name are required' },const ROLE_MAP: Record<string, RoleDescriptor> = {

      }

        { status: 400 }  patient: { dbRole: 'patient', responseRole: 'patient' },

      const hashedPassword = await bcrypt.hash(password, 10);

      const userId = crypto.randomUUID();      );  gp: { dbRole: 'gp', responseRole: 'gp' },



      await client.query(    }  specialist: { dbRole: 'specialist', responseRole: 'specialist' },

        `INSERT INTO "user" (id, email, name, "emailVerified", role, "createdAt", "updatedAt")

         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,  pharmacy: { dbRole: 'pharmacy', responseRole: 'pharmacy' },

        [userId, email.toLowerCase().trim(), name.trim(), false, userRole]

      );    // Validate role  diagnostics: { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },



      await client.query(    const validRoles = ['patient', 'admin', 'gp', 'specialist', 'pharmacy', 'diagnostic-center'];  'diagnostic-center': { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },

        `INSERT INTO account (id, "userId", "accountId", provider, "accessToken", "refreshToken", "expiresAt", password, "createdAt", "updatedAt")

         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,    const userRole = validRoles.includes(role) ? role : 'patient';  'diagnostic_center': { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },

        [

          crypto.randomUUID(),  admin: { dbRole: 'admin', responseRole: 'admin' },

          userId,

          email.toLowerCase().trim(),    const client = await pool.connect();};

          'credential',

          null,

          null,

          null,    try {function resolveRole(input?: string | null): RoleDescriptor | null {

          hashedPassword,

        ]      // Check if user already exists  if (!input) {

      );

      const existingUser = await client.query(    return null;

      return NextResponse.json(

        {        'SELECT id FROM "user" WHERE email = $1',  }

          success: true,

          message: 'Account created successfully',        [email.toLowerCase().trim()]

          user: {

            id: userId,      );  const key = input.trim().toLowerCase();

            email: email.toLowerCase().trim(),

            name: name.trim(),  return ROLE_MAP[key] ?? null;

            role: userRole,

          },      if (existingUser.rows.length > 0) {}

        },

        { status: 201 }        return NextResponse.json(

      );

    } finally {          { error: 'An account with this email already exists' },export async function POST(request: NextRequest) {

      client.release();

    }          { status: 409 }  let client;

  } catch (error: any) {

    console.error('Signup error:', error);        );

    return NextResponse.json(

      { error: 'Failed to create account. Please try again.' },      }  try {

      { status: 500 }

    );    const body = await request.json();

  }

}      // Hash password    const { name, email, password, role } = body ?? {};


      const hashedPassword = await bcrypt.hash(password, 10);

    if (!name || !email || !password || !role) {

      // Generate user ID      return NextResponse.json(

      const userId = crypto.randomUUID();        { error: 'Name, email, password, and role are required' },

        { status: 400 },

      // Create user with role      );

      await client.query(    }

        `INSERT INTO "user" (id, email, name, "emailVerified", role, "createdAt", "updatedAt")

         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,    const normalizedRole = resolveRole(role);

        [userId, email.toLowerCase().trim(), name.trim(), false, userRole]    if (!normalizedRole) {

      );      return NextResponse.json(

        { error: 'Invalid role. Please choose a valid portal.' },

      // Create account with hashed password        { status: 400 },

      await client.query(      );

        `INSERT INTO account (id, "userId", "accountId", provider, "accessToken", "refreshToken", "expiresAt", password, "createdAt", "updatedAt")    }

         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,

        [    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          crypto.randomUUID(),    if (!emailRegex.test(email)) {

          userId,      return NextResponse.json(

          email.toLowerCase().trim(),        { error: 'Invalid email address' },

          'credential',        { status: 400 },

          null,      );

          null,    }

          null,

          hashedPassword,    const passwordCheck = validatePassword(password);

        ]    if (!passwordCheck.isValid) {

      );      return NextResponse.json(

        { error: passwordCheck.errors[0] || 'Invalid password' },

      return NextResponse.json(        { status: 400 },

        {      );

          success: true,    }

          message: 'Account created successfully',

          user: {    client = await pool.connect();

            id: userId,    await client.query('BEGIN');

            email: email.toLowerCase().trim(),

            name: name.trim(),    const existingUser = await client.query(

            role: userRole,      'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)',

          },      [email],

        },    );

        { status: 201 }

      );    if (existingUser.rowCount) {

    } finally {      await client.query('ROLLBACK');

      client.release();      return NextResponse.json(

    }        { error: 'An account with this email already exists' },

  } catch (error: any) {        { status: 409 },

    console.error('Signup error:', error);      );

    return NextResponse.json(    }

      { error: 'Failed to create account. Please try again.' },

      { status: 500 }    const now = new Date();

    );    const userId = crypto.randomUUID();

  }    const accountId = crypto.randomUUID();

}    const passwordHash = await hash(password, {

      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    await client.query(
      `INSERT INTO "user" (
        id, email, "emailVerified", name, role, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        email,
        false,
        name,
        normalizedRole.dbRole,
        now,
        now,
      ],
    );

    await client.query(
      `INSERT INTO account (
        id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        accountId,
        userId,
        email,
        'credential',
        passwordHash,
        now,
        now,
      ],
    );

    await client.query('COMMIT');

    logAuth('signup', userId, {
      email,
      role: normalizedRole.dbRole,
      source: 'signup-with-role',
    });
    logInfo('Created user with explicit role', {
      userId,
      email,
      role: normalizedRole.dbRole,
    });

    return NextResponse.json(
      {
        success: true,
        userId,
        role: normalizedRole.responseRole,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logError('Failed to rollback signup transaction', rollbackError);
      }
    }

    logError('Role-based signup failed', error);

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 },
    );
  } finally {
    if (client) {
      client.release();
    }
  }
}
