/**
 * Production Readiness Check Script
 * Run this before deploying to production
 * 
 * Usage: node scripts/check-production-ready.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Mediconnect Production Readiness Check\n');
console.log('='.repeat(60) + '\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function pass(message) {
  console.log('✅', message);
  checks.passed++;
}

function fail(message) {
  console.log('❌', message);
  checks.failed++;
}

function warn(message) {
  console.log('⚠️ ', message);
  checks.warnings++;
}

// Check 1: Environment file exists
console.log('📋 Checking Environment Configuration...\n');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  pass('Environment file (.env.local) exists');
  
  // Check environment variables
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const requiredVars = [
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=your-`)) {
      pass(`${varName} is configured`);
    } else {
      fail(`${varName} is missing or using default value`);
    }
  });
  
  // Check for production-specific settings
  if (envContent.includes('NODE_ENV=production')) {
    pass('NODE_ENV set to production');
  } else {
    warn('NODE_ENV not set to production');
  }
  
  // Check database type
  if (envContent.includes('postgresql://')) {
    pass('Using PostgreSQL database (recommended for production)');
  } else if (envContent.includes('sqlite')) {
    warn('Using SQLite database (consider PostgreSQL for 100+ users)');
  } else {
    fail('Database type unclear in DATABASE_URL');
  }
  
} else {
  fail('Environment file (.env.local) not found');
  warn('Copy .env.example to .env.local and configure production values');
}

// Check 2: Required dependencies
console.log('\n📦 Checking Dependencies...\n');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const requiredDeps = [
    'better-auth',
    '@node-rs/argon2',
    'next',
    'react',
    'react-dom'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      pass(`${dep} installed`);
    } else {
      fail(`${dep} not found in dependencies`);
    }
  });
} else {
  fail('package.json not found');
}

// Check 3: Database file (for SQLite)
console.log('\n💾 Checking Database...\n');
const dbPath = path.join(process.cwd(), 'sqlite.db');
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  if (stats.size > 0) {
    pass('Database file exists and has data');
  } else {
    warn('Database file exists but appears empty');
  }
} else {
  warn('SQLite database not found (OK if using PostgreSQL)');
}

// Check 4: Build artifacts
console.log('\n🏗️  Checking Build Status...\n');
const nextBuildPath = path.join(process.cwd(), '.next');
if (fs.existsSync(nextBuildPath)) {
  pass('Next.js build folder exists');
  
  // Check if it's a production build
  const buildManifest = path.join(nextBuildPath, 'build-manifest.json');
  if (fs.existsSync(buildManifest)) {
    pass('Build manifest found');
  } else {
    warn('Build manifest not found - run "npm run build"');
  }
} else {
  fail('No build found - run "npm run build" before deploying');
}

// Check 5: Required pages exist
console.log('\n📄 Checking Critical Pages...\n');
const criticalPages = [
  'src/app/page.tsx',
  'src/app/auth/[role]/login/page.tsx',
  'src/app/auth/[role]/signup/page.tsx',
  'src/app/patient/home/page.tsx',
  'src/components/RoleLogin.tsx',
  'src/lib/auth.ts'
];

criticalPages.forEach(page => {
  const pagePath = path.join(process.cwd(), page);
  if (fs.existsSync(pagePath)) {
    pass(`${page} exists`);
  } else {
    fail(`${page} missing`);
  }
});

// Check 6: Security considerations
console.log('\n🔒 Checking Security Configuration...\n');
const authConfigPath = path.join(process.cwd(), 'src/lib/auth.ts');
if (fs.existsSync(authConfigPath)) {
  const authConfig = fs.readFileSync(authConfigPath, 'utf-8');
  
  if (authConfig.includes('secret:')) {
    pass('Auth secret configuration present');
  } else {
    fail('Auth secret configuration missing');
  }
  
  if (authConfig.includes('emailAndPassword')) {
    pass('Email/password authentication configured');
  }
} else {
  fail('Auth configuration file not found');
}

// Check 7: Documentation
console.log('\n📚 Checking Documentation...\n');
const docs = [
  'README.md',
  'PRODUCTION_READINESS.md',
  'PRODUCTION_DEPLOYMENT.md',
  '.env.example'
];

docs.forEach(doc => {
  const docPath = path.join(process.cwd(), doc);
  if (fs.existsSync(docPath)) {
    pass(`${doc} exists`);
  } else {
    warn(`${doc} missing`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:\n');
console.log(`✅ Passed:   ${checks.passed}`);
console.log(`❌ Failed:   ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);

console.log('\n' + '='.repeat(60) + '\n');

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('🎉 All checks passed! Your application is ready for production.\n');
  process.exit(0);
} else if (checks.failed === 0) {
  console.log('✅ All critical checks passed, but there are warnings to address.\n');
  console.log('Review warnings above before deploying to production.\n');
  process.exit(0);
} else {
  console.log('❌ Production readiness check failed.\n');
  console.log('Please fix the failed checks before deploying to production.\n');
  console.log('See PRODUCTION_READINESS.md for detailed instructions.\n');
  process.exit(1);
}
