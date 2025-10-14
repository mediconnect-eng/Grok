import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT 
        id, email, name, phone, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone,
        blood_type, allergies, chronic_conditions, current_medications,
        created_at
       FROM "user"
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      blood_type,
      allergies,
      chronic_conditions,
      current_medications
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE "user"
       SET 
         name = $1,
         phone = $2,
         date_of_birth = $3,
         gender = $4,
         address = $5,
         emergency_contact_name = $6,
         emergency_contact_phone = $7,
         blood_type = $8,
         allergies = $9,
         chronic_conditions = $10,
         current_medications = $11,
         updated_at = NOW()
       WHERE id = $12
       RETURNING id, email, name, phone, date_of_birth, gender, address,
                 emergency_contact_name, emergency_contact_phone,
                 blood_type, allergies, chronic_conditions, current_medications`,
      [
        name,
        phone,
        date_of_birth,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        blood_type,
        allergies,
        chronic_conditions,
        current_medications,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
