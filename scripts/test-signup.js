require('dotenv').config({ path: '.env.local' });

async function testSignup() {
  const baseURL = process.env.BETTER_AUTH_URL || 'https://www.healthhubinternational.com';
  
  console.log('\n🧪 TESTING BETTER AUTH SIGNUP\n');
  console.log('='.repeat(60));
  console.log('Base URL:', baseURL);
  console.log('Signup endpoint:', `${baseURL}/api/auth/sign-up/email`);
  console.log('='.repeat(60) + '\n');

  try {
    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: '12345@gm.com',
        password: 'password123',
        name: '12345',
      }),
    });

    console.log('Status:', response.status, response.statusText);
    
    const data = await response.text();
    console.log('\nResponse:\n', data);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testSignup();
