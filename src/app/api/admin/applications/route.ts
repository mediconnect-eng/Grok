import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { logError } from '@/lib/logger';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Authentication - require admin role
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['admin'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }
    const client = await pool.connect();

    try {
      // Fetch provider applications with user details
      const providerApps = await client.query(`
        SELECT 
          pa.id,
          pa.user_id,
          pa.provider_type,
          pa.license_number,
          pa.specialization,
          pa.qualifications,
          pa.experience_years,
          pa.hospital_affiliation,
          pa.consultation_fee,
          pa.license_document_url,
          pa.status,
          pa.rejection_reason,
          pa.created_at,
          pa.updated_at,
          u.name,
          u.email,
          u.phone_number
        FROM provider_applications pa
        JOIN "user" u ON pa.user_id = u.id
        ORDER BY pa.created_at DESC
      `);

      // Fetch partner applications with user details
      const partnerApps = await client.query(`
        SELECT 
          pa.id,
          pa.user_id,
          pa.partner_type,
          pa.business_name,
          pa.license_number,
          pa.owner_name,
          pa.address,
          pa.services_offered,
          pa.license_document_url,
          pa.status,
          pa.rejection_reason,
          pa.created_at,
          pa.updated_at,
          u.name,
          u.email,
          u.phone_number
        FROM partner_applications pa
        JOIN "user" u ON pa.user_id = u.id
        ORDER BY pa.created_at DESC
      `);

      // Combine and format applications
      const applications = [
        ...providerApps.rows.map(app => ({
          ...app,
          type: 'provider' as const,
        })),
        ...partnerApps.rows.map(app => ({
          ...app,
          type: 'partner' as const,
        })),
      ];

      return NextResponse.json(
        {
          success: true,
          applications,
          counts: {
            total: applications.length,
            pending: applications.filter(a => a.status === 'pending').length,
            approved: applications.filter(a => a.status === 'approved').length,
            rejected: applications.filter(a => a.status === 'rejected').length,
            providers: providerApps.rows.length,
            partners: partnerApps.rows.length,
          },
        },
        { status: 200 }
      );

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Fetch applications error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
