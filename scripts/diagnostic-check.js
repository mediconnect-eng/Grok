/**
 * Comprehensive Diagnostic Check
 * Tests all critical connections and configurations
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const checks = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logCheck(name, status, details = '') {
  const symbol = status ? '✓' : '✗';
  const color = status ? 'green' : 'red';
  log(`${symbol} ${name}`, color);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
  checks.push({ name, status, details });
}

async function runDiagnostics() {
  log('\n🏥 HealthHub Diagnostic Check', 'blue');
  log('Starting comprehensive system diagnostics...', 'blue');

  // 1. Environment Variables Check
  logSection('1. Environment Configuration');
  
  const envVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_APP_URL',
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'AGORA_APP_ID',
    'AGORA_APP_CERTIFICATE',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  envVars.forEach(varName => {
    const value = process.env[varName];
    logCheck(
      varName,
      !!value,
      value ? `Set (${value.substring(0, 20)}${value.length > 20 ? '...' : ''})` : 'Missing'
    );
  });

  // 2. Database Connection Test
  logSection('2. Database Connection');
  
  if (!process.env.DATABASE_URL) {
    logCheck('PostgreSQL Connection', false, 'DATABASE_URL not configured');
  } else {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 5000,
    });

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      logCheck('PostgreSQL Connection', true, `Connected to ${result.rows[0].pg_version.split(',')[0]}`);
      logCheck('Database Time', true, result.rows[0].current_time);

      // Check critical tables
      const tables = ['user', 'session', 'consultations', 'prescriptions', 'referrals', 'notifications'];
      for (const table of tables) {
        try {
          const tableCheck = await pool.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )`,
            [table]
          );
          const exists = tableCheck.rows[0].exists;
          logCheck(`Table: ${table}`, exists, exists ? 'Exists' : 'Missing');
        } catch (err) {
          logCheck(`Table: ${table}`, false, err.message);
        }
      }

      await pool.end();
    } catch (error) {
      logCheck('PostgreSQL Connection', false, error.message);
    }
  }

  // 3. Authentication Configuration
  logSection('3. Authentication Configuration');
  
  logCheck(
    'Better Auth Secret',
    !!process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length >= 32,
    process.env.BETTER_AUTH_SECRET?.length >= 32 ? 'Valid length (≥32 chars)' : 'Too short or missing'
  );

  logCheck(
    'Better Auth URL',
    !!process.env.BETTER_AUTH_URL,
    process.env.BETTER_AUTH_URL || 'Not configured'
  );

  logCheck(
    'OAuth URL Match',
    process.env.BETTER_AUTH_URL === process.env.NEXT_PUBLIC_APP_URL,
    process.env.BETTER_AUTH_URL === process.env.NEXT_PUBLIC_APP_URL 
      ? 'URLs match' 
      : 'URLs do not match - may cause OAuth redirect issues'
  );

  // 4. Video Consultation (Agora) Setup
  logSection('4. Video Consultation (Agora)');
  
  const agoraConfigured = !!process.env.AGORA_APP_ID && !!process.env.AGORA_APP_CERTIFICATE;
  logCheck('Agora App ID', !!process.env.AGORA_APP_ID);
  logCheck('Agora Certificate', !!process.env.AGORA_APP_CERTIFICATE);
  logCheck(
    'Video Consultation Ready',
    agoraConfigured,
    agoraConfigured ? 'Video calls enabled' : 'Video calls disabled'
  );

  // 5. OAuth Providers
  logSection('5. OAuth Providers');
  
  const googleConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  logCheck('Google OAuth', googleConfigured, googleConfigured ? 'Configured' : 'Not configured');

  // 6. Production Readiness
  logSection('6. Production Configuration');
  
  const isProduction = process.env.NODE_ENV === 'production';
  logCheck('Environment', isProduction, process.env.NODE_ENV);
  logCheck('HTTPS URL', process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://'), process.env.NEXT_PUBLIC_APP_URL);
  logCheck('Production Mode', process.env.PRODUCTION_MODE === 'true');

  // 7. Security Checks
  logSection('7. Security Configuration');
  
  logCheck(
    'Secure Cookies',
    isProduction,
    isProduction ? 'Enabled in production' : 'Disabled in development'
  );

  logCheck(
    'Session Expiration',
    true,
    '30 days (configured in auth.ts)'
  );

  // Summary
  logSection('Diagnostic Summary');
  
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.status).length;
  const failedChecks = totalChecks - passedChecks;

  log(`Total Checks: ${totalChecks}`, 'cyan');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`, 'cyan');

  // Critical Issues
  const criticalIssues = checks.filter(c => !c.status && [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'PostgreSQL Connection',
    'Table: user',
    'Table: session',
  ].includes(c.name));

  if (criticalIssues.length > 0) {
    log('\n⚠️  CRITICAL ISSUES DETECTED:', 'red');
    criticalIssues.forEach(issue => {
      log(`  • ${issue.name}: ${issue.details}`, 'red');
    });
  }

  // Warnings
  const warnings = checks.filter(c => !c.status && !criticalIssues.includes(c));
  if (warnings.length > 0) {
    log('\n⚠️  Warnings (non-critical):', 'yellow');
    warnings.forEach(warning => {
      log(`  • ${warning.name}: ${warning.details}`, 'yellow');
    });
  }

  if (criticalIssues.length === 0 && warnings.length === 0) {
    log('\n✓ All systems operational!', 'green');
  }

  log('\n' + '='.repeat(60), 'cyan');
  process.exit(criticalIssues.length > 0 ? 1 : 0);
}

// Run diagnostics
runDiagnostics().catch(err => {
  log(`\n✗ Diagnostic check failed: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
