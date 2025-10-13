import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import { hash } from '@node-rs/argon2';
import { sendProviderApplicationReceived } from '@/lib/email';
import { uploadLicenseDocument } from '@/lib/upload';
import { logAuth, logInfo, logError } from '@/lib/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract required fields
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    
    // Extract optional fields
    const specialization = formData.get('specialization') as string || null;
    const licenseNumber = formData.get('licenseNumber') as string || null;
    const qualifications = formData.get('qualifications') as string || null;
    const experienceYears = formData.get('experienceYears') as string || null;
    const hospitalAffiliation = formData.get('hospitalAffiliation') as string || null;
    const consultationFee = formData.get('consultationFee') as string || null;
    const licenseDocument = formData.get('licenseDocument') as File | null;

    // Validate required fields only
    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
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

      // Create user account (not verified yet - pending admin approval)
      await client.query(
        `INSERT INTO "user" (id, email, "emailVerified", name, "createdAt", "updatedAt")
         VALUES ($1, $2, false, $3, NOW(), NOW())`,
        [userId, email, name]
      );

      // Create credential account
      const accountId = crypto.randomUUID();
      await client.query(
        `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())`,
        [accountId, userId, email, passwordHash]
      );

      // Update phone
      await client.query(
        'UPDATE "user" SET phone_number = $1 WHERE id = $2',
        [phone, userId]
      );

      // Upload license document if provided
      let licenseDocumentUrl = null;
      if (licenseDocument && licenseDocument.size > 0) {
        try {
          // Convert File to Buffer for upload
          const arrayBuffer = await licenseDocument.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          licenseDocumentUrl = await uploadLicenseDocument(
            buffer,
            userId,
            licenseNumber || 'pending'
          );
          logInfo('License document uploaded:', licenseDocumentUrl);
        } catch (uploadError: any) {
          logError('License upload error:', uploadError);
          // Continue without document - it's optional
        }
      }

      // Create provider application
      const applicationId = crypto.randomUUID();
      await client.query(
        `INSERT INTO provider_applications (
          id, user_id, provider_type, license_number, specialization,
          qualifications, experience_years, hospital_affiliation,
          consultation_fee, license_document_url, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())`,
        [
          applicationId,
          userId,
          specialization === 'gp' ? 'gp' : 'specialist',
          licenseNumber,
          specialization,
          qualifications,
          experienceYears ? parseInt(experienceYears) : null,
          hospitalAffiliation,
          consultationFee ? parseFloat(consultationFee) : null,
          licenseDocumentUrl,
        ]
      );

      await client.query('COMMIT');

      // Send confirmation email
      await sendProviderApplicationReceived(
        email,
        name,
        specialization === 'gp' ? 'General Practitioner' : 'Specialist'
      );

      // Log the application
      logAuth('signup', userId, {
        email,
        name,
        type: 'provider_application',
        specialization: specialization || 'not specified',
      });

      logInfo('Provider application submitted:', {
        applicationId,
        email,
        specialization: specialization || 'not specified',
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Application submitted successfully',
          applicationId,
        },
        { status: 201 }
      );

    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Provider application error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}
