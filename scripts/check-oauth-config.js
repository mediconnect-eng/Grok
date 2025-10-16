// Check OAuth Configuration
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 OAUTH CONFIGURATION CHECK\n');
console.log('=' .repeat(60));

console.log('\n📋 Environment Variables:');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || '❌ NOT SET');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ NOT SET');
console.log('NEXT_PUBLIC_BETTER_AUTH_URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL || '❌ NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

console.log('\n🔐 Google OAuth:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('ENABLE_OAUTH:', process.env.ENABLE_OAUTH || '❌ NOT SET');

console.log('\n🎥 Agora Configuration:');
console.log('AGORA_APP_ID:', process.env.AGORA_APP_ID ? '✅ SET' : '❌ NOT SET');
console.log('AGORA_APP_CERTIFICATE:', process.env.AGORA_APP_CERTIFICATE ? '✅ SET' : '❌ NOT SET');

console.log('\n💾 Database:');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const dbType = dbUrl.startsWith('postgresql') ? 'PostgreSQL (Neon)' : 'Unknown';
  console.log('DATABASE_URL:', `✅ ${dbType}`);
} else {
  console.log('DATABASE_URL:', '❌ NOT SET');
}

console.log('\n🔑 Better Auth:');
console.log('BETTER_AUTH_SECRET:', process.env.BETTER_AUTH_SECRET ? '✅ SET' : '❌ NOT SET');

console.log('\n' + '=' .repeat(60));

console.log('\n📝 Expected OAuth Redirect URIs:\n');

const urls = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000'
].filter(Boolean);

const uniqueUrls = [...new Set(urls)];

uniqueUrls.forEach(url => {
  console.log(`   ${url}/api/auth/callback/google`);
});

console.log('\n' + '=' .repeat(60));

console.log('\n✅ NEXT STEPS:\n');

if (process.env.BETTER_AUTH_URL?.includes('localhost')) {
  console.log('⚠️  You are in DEVELOPMENT mode (localhost)');
  console.log('   - Google Cloud Console should have: http://localhost:3000');
  console.log('   - Make sure your .env.local has localhost URLs\n');
} else if (process.env.BETTER_AUTH_URL?.includes('healthhubinternational.com')) {
  console.log('✅ You are in PRODUCTION mode (healthhubinternational.com)');
  console.log('   - Google Cloud Console MUST have:');
  console.log('     • https://healthhubinternational.com');
  console.log('     • https://www.healthhubinternational.com');
  console.log('   - Vercel environment variables MUST be set\n');
} else {
  console.log('⚠️  BETTER_AUTH_URL is not set correctly!');
  console.log('   For development: BETTER_AUTH_URL=http://localhost:3000');
  console.log('   For production: BETTER_AUTH_URL=https://www.healthhubinternational.com\n');
}

console.log('=' .repeat(60) + '\n');
