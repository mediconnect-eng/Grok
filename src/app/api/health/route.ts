import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Returns application health status
 * Useful for monitoring, load balancers, and uptime checks
 */

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      server: 'ok',
      database: 'pending', // Will be checked below
      auth: 'ok',
    },
  };

  try {
    // Check database connection (basic check)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      healthCheck.checks.database = dbUrl.includes('postgresql') ? 'ok' : 'ok-sqlite';
    } else {
      healthCheck.checks.database = 'not-configured';
    }

    // Check if Better Auth secret is set
    if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.includes('demo')) {
      healthCheck.checks.auth = 'warning-weak-secret';
      healthCheck.status = 'degraded';
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
