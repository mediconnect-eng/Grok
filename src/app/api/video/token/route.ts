import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { requireAuth } from '@/lib/auth-middleware';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter';
import { logInfo, logError } from '@/lib/logger';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const APP_ID = process.env.AGORA_APP_ID || '';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || '';

// POST - Generate Agora token for video call
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = checkRateLimit(request, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    // Authentication
    const authResult = await requireAuth(request, {
      requireAuth: true,
      requiredRoles: ['patient', 'gp', 'specialist'],
    });

    if (!authResult.success) {
      return authResult.response!;
    }

    const session = authResult.session!;
    const body = await request.json();
    const { consultationId, channelName } = body;

    // Validation
    if (!consultationId) {
      return NextResponse.json(
        { error: 'Consultation ID is required' },
        { status: 400 }
      );
    }

    if (!channelName) {
      return NextResponse.json(
        { error: 'Channel name is required' },
        { status: 400 }
      );
    }

    // Check if Agora is configured
    if (!APP_ID || !APP_CERTIFICATE) {
      return NextResponse.json(
        { 
          error: 'Video service not configured. Please contact support.',
          code: 'AGORA_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    const client = await pool.connect();

    try {
      // Verify consultation exists and user is part of it
      const consultation = await client.query(
        'SELECT patient_id, provider_id, status FROM consultations WHERE id = $1',
        [consultationId]
      );

      if (consultation.rows.length === 0) {
        return NextResponse.json(
          { error: 'Consultation not found' },
          { status: 404 }
        );
      }

      const { patient_id, provider_id, status } = consultation.rows[0];

      // Check if user is authorized
      if (session.user.id !== patient_id && session.user.id !== provider_id) {
        return NextResponse.json(
          { error: 'You are not authorized for this consultation' },
          { status: 403 }
        );
      }

      // Check if consultation is active
      if (status !== 'in-progress' && status !== 'scheduled') {
        return NextResponse.json(
          { error: 'Consultation is not active' },
          { status: 400 }
        );
      }

      // Generate Agora token
      // UID: Use user ID hash or 0 for auto-assignment
      const uid = 0; // Agora will auto-assign
      const role = RtcRole.PUBLISHER; // Both patient and provider can publish

      // Token expires in 24 hours
      const expirationTimeInSeconds = 86400; // 24 hours
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Build the token
      const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role,
        privilegeExpiredTs
      );

      // Update consultation status to in-progress if it was scheduled
      if (status === 'scheduled') {
        await client.query(
          `UPDATE consultations 
           SET status = 'in-progress', updated_at = NOW()
           WHERE id = $1`,
          [consultationId]
        );
      }

      // Log video call initiation
      logInfo('Video call token generated:', {
        consultationId,
        userId: session.user.id,
        channelName,
      });

      return NextResponse.json({
        success: true,
        token,
        appId: APP_ID,
        channelName,
        uid,
        expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    logError('Generate Agora token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate video call token' },
      { status: 500 }
    );
  }
}
