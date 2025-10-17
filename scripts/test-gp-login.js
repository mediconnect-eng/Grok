const fetch = require('node-fetch');

async function testGPLogin() {
  console.log('🔍 Testing GP Login Endpoint\n');
  console.log('============================================================\n');
  
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/api/auth/sign-in/email`;
  
  console.log(`Testing: ${loginUrl}\n`);
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Status Text: ${response.statusText}\n`);
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}\n`);
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Response Body:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response Body (text):');
      console.log(text.substring(0, 500)); // First 500 chars
    }
    
    if (response.status === 429) {
      console.log('\n⚠️  RATE LIMITING ERROR');
      console.log('The login endpoint is being rate limited!');
    } else if (response.status === 404) {
      console.log('\n⚠️  ENDPOINT NOT FOUND');
      console.log('The sign-in endpoint might not be configured correctly.');
    } else if (response.status >= 500) {
      console.log('\n⚠️  SERVER ERROR');
      console.log('There is a server-side error with Better Auth.');
    } else if (response.status === 401) {
      console.log('\n✅ Endpoint is working (401 = invalid credentials, as expected)');
    } else if (response.status === 200) {
      console.log('\n✅ Login would succeed with these credentials');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error.message);
    console.error('\nFull error:', error);
  }
  
  console.log('\n============================================================');
}

testGPLogin();
