// Test Better Auth login endpoint
require('dotenv').config({ path: '.env.local' });

const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'https://www.healthhubinternational.com';

console.log('\n🧪 TESTING BETTER AUTH LOGIN\n');
console.log('='.repeat(60));
console.log('Base URL:', baseURL);
console.log('Login endpoint:', `${baseURL}/api/auth/sign-in/email`);
console.log('\nAttempting login for: abcd@gm.com');
console.log('='.repeat(60) + '\n');

async function testLogin() {
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'abcd@gm.com',
        password: 'test1234', // Try common test password
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ LOGIN FAILED!');
      console.log('Error response:', JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.log('\n🔍 Error details:');
        console.log('   Message:', data.error.message || data.error);
        console.log('   Status:', data.error.status || 'unknown');
      }
      
      console.log('\n💡 Possible reasons:');
      console.log('   1. Wrong password (most likely)');
      console.log('   2. Better Auth configuration issue');
      console.log('   3. Database connection problem');
      console.log('   4. Password hashing algorithm mismatch');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ REQUEST FAILED!');
    console.error('Error:', error.message);
    console.error('\n💡 This could mean:');
    console.error('   1. Server is not responding');
    console.error('   2. Network/CORS issue');
    console.error('   3. Invalid URL configuration');
    console.error('\n' + '='.repeat(60) + '\n');
  }
}

testLogin();
