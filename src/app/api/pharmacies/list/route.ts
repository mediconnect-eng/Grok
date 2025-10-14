import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET: Fetch list of available pharmacies
export async function GET(request: NextRequest) {
  try {
    // Get all users with role 'pharmacy' and application approved
    // For now, we'll get all pharmacy users
    // Later, this can be filtered by location
    
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        pa.business_name,
        pa.license_number,
        pa.address,
        pa.city,
        pa.state,
        pa.zip_code
      FROM "user" u
      LEFT JOIN provider_applications pa ON u.id = pa.user_id
      WHERE u.role = 'pharmacy' 
        AND (pa.status = 'approved' OR pa.status IS NULL)
      ORDER BY u.name ASC
    `;

    const result = await pool.query(query);

    // Format the response
    const pharmacies = result.rows.map(row => ({
      id: row.id,
      name: row.business_name || row.name,
      email: row.email,
      phone: row.phone,
      address: row.address || 'Address not available',
      city: row.city,
      state: row.state,
      zipCode: row.zip_code,
      // For future location-based sorting
      distance: null
    }));

    return NextResponse.json({
      pharmacies,
      count: pharmacies.length
    });

  } catch (error: any) {
    logError('Fetch pharmacies error', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}
