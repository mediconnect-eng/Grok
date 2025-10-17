require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 OAuth Configuration Check\n');
console.log('='.repeat(60));
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  '✅ Set (' + process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...)' : 
  '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  '✅ Set (' + process.env.GOOGLE_CLIENT_SECRET.substring(0, 10) + '...)' : 
  '❌ Missing');
console.log('BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL || '❌ Not set');
console.log('NEXT_PUBLIC_BETTER_AUTH_URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL || '❌ Not set');
console.log('='.repeat(60));

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\n❌ OAuth will NOT work - credentials missing!\n');
  console.log('Action required:');
  console.log('1. Get credentials from Google Cloud Console');
  console.log('2. Update GOOGLE_CLIENT_ID in .env.local');
  console.log('3. Update GOOGLE_CLIENT_SECRET in .env.local');
  console.log('4. Restart dev server\n');
} else {
  console.log('\n✅ OAuth credentials configured!\n');
  console.log('Test by visiting:');
  console.log('  - http://localhost:3000/patient/login');
  console.log('  - Click "Continue with Google"');
  console.log('  - Should redirect to Google login\n');
  
  console.log('Required in Google Cloud Console:');
  console.log('\n📍 Authorised JavaScript origins:');
  console.log('  - http://localhost:3000');
  console.log('  - https://healthhubinternational.com');
  console.log('  - https://www.healthhubinternational.com');
  
  console.log('\n📍 Authorised redirect URIs:');
  console.log('  - http://localhost:3000/api/auth/callback/google');
  console.log('  - https://healthhubinternational.com/api/auth/callback/google');
  console.log('  - https://www.healthhubinternational.com/api/auth/callback/google\n');
}
