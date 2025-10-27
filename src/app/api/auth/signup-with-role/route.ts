import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { validatePassword } from '@/lib/password-validation';
import { logAuth, logError, logInfo } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

type RoleDescriptor = {
  dbRole: string;
  responseRole: string;
};

const ROLE_MAP: Record<string, RoleDescriptor> = {
  patient: { dbRole: 'patient', responseRole: 'patient' },
  gp: { dbRole: 'gp', responseRole: 'gp' },
  specialist: { dbRole: 'specialist', responseRole: 'specialist' },
  pharmacy: { dbRole: 'pharmacy', responseRole: 'pharmacy' },
  diagnostics: { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },
  'diagnostic-center': { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },
  'diagnostic_center': { dbRole: 'diagnostic-center', responseRole: 'diagnostics' },
  admin: { dbRole: 'admin', responseRole: 'admin' },
};

function resolveRole(input?: string | null): RoleDescriptor | null {
  if (!input) {
    return null;
  }

  const key = input.trim().toLowerCase();
  return ROLE_MAP[key] ?? null;
}

const SCRYPT_OPTIONS = {
  cost: 16384,
  blockSize: 16,
  parallelization: 1,
  maxmem: 128 * 16384 * 16 * 2,
};

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');

  const derivedKey: Buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      SCRYPT_OPTIONS,
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(key as Buffer);
      },
    );
  });

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function POST(request: NextRequest) {
  let client;

  try {
    const body = await request.json();
    const { name, email, password, role } = body ?? {};

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 },
      );
    }

    const normalizedRole = resolveRole(role);
    if (!normalizedRole) {
      return NextResponse.json(
        { error: 'Invalid role. Please choose a valid portal.' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 },
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { error: passwordCheck.errors[0] || 'Invalid password' },
        { status: 400 },
      );
    }

    client = await pool.connect();
    await client.query('BEGIN');

    const existingUser = await client.query(
      'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)',
      [email],
    );

    if (existingUser.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    const now = new Date();
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

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
        userId,
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
