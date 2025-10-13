import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendProviderApplicationRejected } from '@/lib/email';
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
    const { applicationId, applicationType, reason } = body;

    if (!applicationId || !applicationType || !reason) {
      return NextResponse.json(
        { error: 'Application ID, type, and rejection reason are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let userData: any;

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

        // Update application status with rejection reason
        await client.query(
          `UPDATE provider_applications 
           SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
           WHERE id = $2`,
          [reason, applicationId]
        );

        logInfo('Provider application rejected:', {
          applicationId,
          userId: userData.user_id,
          email: userData.email,
          reason,
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

        // Update application status with rejection reason
        await client.query(
          `UPDATE partner_applications 
           SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
           WHERE id = $2`,
          [reason, applicationId]
        );

        logInfo('Partner application rejected:', {
          applicationId,
          userId: userData.user_id,
          email: userData.email,
          reason,
        });
      } else {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Invalid application type' },
          { status: 400 }
        );
      }

      // Log the rejection in audit log
      await client.query(
        `INSERT INTO application_audit_log (application_id, application_type, action, performed_by, details)
         VALUES ($1, $2, 'rejected', 'admin', $3)`,
        [applicationId, applicationType, JSON.stringify({ reason, email: userData.email })]
      );

      await client.query('COMMIT');

      // Send rejection email
      await sendProviderApplicationRejected(
        userData.email,
        userData.name,
        reason
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Application rejected successfully',
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
    logError('Reject application error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to reject application' },
      { status: 500 }
    );
  }
}
