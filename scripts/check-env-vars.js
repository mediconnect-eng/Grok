require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Check\n');
console.log('============================================================\n');

console.log('📋 CRITICAL ENVIRONMENT VARIABLES:\n');

const criticalVars = {
  'BETTER_AUTH_SECRET': process.env.BETTER_AUTH_SECRET,
  'BETTER_AUTH_URL': process.env.BETTER_AUTH_URL,
  'NEXT_PUBLIC_BETTER_AUTH_URL': process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  'DATABASE_URL': process.env.DATABASE_URL,
  'NODE_ENV': process.env.NODE_ENV,
};

for (const [key, value] of Object.entries(criticalVars)) {
  if (value) {
    if (key.includes('SECRET') || key.includes('DATABASE_URL')) {
      console.log(`✅ ${key}: ${value.substring(0, 30)}...`);
    } else {
      console.log(`✅ ${key}: ${value}`);
    }
  } else {
    console.log(`❌ ${key}: NOT SET`);
  }
}

console.log('\n============================================================\n');
console.log('📝 VERCEL ENVIRONMENT VARIABLES NEEDED:\n');
console.log('Go to: https://vercel.com/dashboard → Settings → Environment Variables\n');
console.log('Add these (for Production, Preview, and Development):\n');

console.log('1. BETTER_AUTH_SECRET');
console.log(`   ${process.env.BETTER_AUTH_SECRET || 'NOT SET IN .env.local'}\n`);

console.log('2. BETTER_AUTH_URL');
console.log(`   ${process.env.BETTER_AUTH_URL || 'https://www.healthhubinternational.com'}\n`);

console.log('3. NEXT_PUBLIC_BETTER_AUTH_URL');
console.log(`   ${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'https://www.healthhubinternational.com'}\n`);

console.log('4. DATABASE_URL');
console.log(`   ${process.env.DATABASE_URL || 'NOT SET'}\n`);

console.log('5. GOOGLE_CLIENT_ID (if using OAuth)');
console.log(`   ${process.env.GOOGLE_CLIENT_ID || 'NOT SET'}\n`);

console.log('6. GOOGLE_CLIENT_SECRET (if using OAuth)');
console.log(`   ${process.env.GOOGLE_CLIENT_SECRET?.substring(0, 30) || 'NOT SET'}...\n`);

console.log('============================================================\n');
console.log('⚠️  IMPORTANT:\n');
console.log('After adding/updating environment variables in Vercel:');
console.log('1. Click "Save"');
console.log('2. Go to Deployments tab');
console.log('3. Click "..." menu on latest deployment');
console.log('4. Click "Redeploy"');
console.log('5. Wait 2-3 minutes for redeployment');
console.log('6. Try logging in again\n');
