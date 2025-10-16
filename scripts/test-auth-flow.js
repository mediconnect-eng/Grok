require('dotenv').config({ path: '.env.local' });

async function testAuthFlow() {
  const baseURL = process.env.BETTER_AUTH_URL || 'https://www.healthhubinternational.com';
  
  console.log('🔍 Testing auth configuration...\n');
  console.log('Base URL:', baseURL);
  console.log('Secret exists:', !!process.env.BETTER_AUTH_SECRET);
  console.log('Database URL exists:', !!process.env.DATABASE_URL);
  console.log('Node ENV:', process.env.NODE_ENV);
  console.log('\n✅ Configuration looks good!');
  console.log('\n📝 Try these steps:');
  console.log('1. Visit https://www.healthhubinternational.com/patient/signup');
  console.log('2. Create a new account');
  console.log('3. You will be redirected to login - enter your credentials');
  console.log('4. After login, you should stay logged in on the home page');
  console.log('\n🔧 If you still get kicked out:');
  console.log('1. Clear all cookies for healthhubinternational.com');
  console.log('2. Clear browser cache');
  console.log('3. Try in incognito/private mode');
}

testAuthFlow();
