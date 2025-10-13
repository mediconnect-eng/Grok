import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendProviderApplicationApproved } from '@/lib/email';
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
    const { applicationId, applicationType } = body;

    if (!applicationId || !applicationType) {
      return NextResponse.json(
        { error: 'Application ID and type are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let userData: any;
      let loginUrl: string;

      if (applicationType === 'provider') {
        // Get provider application details
        const providerApp = await client.query(
          `SELECT pa.*, u.name, u.email
           FROM provider_applications pa
           JOIN "user" u ON pa.user_id = u.id
           WHERE pa.id = $1`,
          [applicationId]
        );

        if (providerApp.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Provider application not found' },
            { status: 404 }
          );
        }

        userData = providerApp.rows[0];

        // Update application status
        await client.query(
          `UPDATE provider_applications 
           SET status = 'approved', verified_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [applicationId]
        );

        // Set email as verified
        await client.query(
          'UPDATE "user" SET "emailVerified" = true, email_verified_at = NOW() WHERE id = $1',
          [userData.user_id]
        );

        // Determine login URL
        loginUrl = userData.provider_type === 'gp' 
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gp/login`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/specialist/login`;

        logInfo('Provider application approved:', {
          applicationId,
          userId: userData.user_id,
          email: userData.email,
          providerType: userData.provider_type,
        });

      } else if (applicationType === 'partner') {
        // Get partner application details
        const partnerApp = await client.query(
          `SELECT pa.*, u.name, u.email
           FROM partner_applications pa
           JOIN "user" u ON pa.user_id = u.id
           WHERE pa.id = $1`,
          [applicationId]
        );

        if (partnerApp.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json(
            { error: 'Partner application not found' },
            { status: 404 }
          );
        }

        userData = partnerApp.rows[0];

        // Update application status
        await client.query(
          `UPDATE partner_applications 
           SET status = 'approved', verified_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [applicationId]
        );

        // Set email as verified
        await client.query(
          'UPDATE "user" SET "emailVerified" = true, email_verified_at = NOW() WHERE id = $1',
          [userData.user_id]
        );

        // Determine login URL
        loginUrl = userData.partner_type === 'pharmacy'
          ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pharmacy/login`
          : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/diagnostics/login`;

        logInfo('Partner application approved:', {
          applicationId,
          userId: userData.user_id,
          email: userData.email,
          partnerType: userData.partner_type,
        });
      } else {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Invalid application type' },
          { status: 400 }
        );
      }

      // Log the approval in audit log
      await client.query(
        `INSERT INTO application_audit_log (application_id, application_type, action, performed_by, details)
         VALUES ($1, $2, 'approved', 'admin', $3)`,
        [applicationId, applicationType, JSON.stringify({ email: userData.email })]
      );

      await client.query('COMMIT');

      // Send approval email
      const typeLabel = applicationType === 'provider'
        ? (userData.provider_type === 'gp' ? 'General Practitioner' : 'Specialist')
        : (userData.partner_type === 'pharmacy' ? 'Pharmacy Partner' : 'Diagnostics Partner');

      await sendProviderApplicationApproved(
        userData.email,
        userData.name,
        typeLabel,
        loginUrl
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Application approved successfully',
        },
        { status: 200 }
      );

    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Approve application error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to approve application' },
      { status: 500 }
    );
  }
}
