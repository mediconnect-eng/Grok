// Test production login API directly
const testLogin = async () => {
  console.log('\n🔍 Testing PRODUCTION Login API...\n');
  
  const loginData = {
    email: 'doctor@healthhub.com',
    password: 'Doctor@2024',
  };
  
  console.log('📧 Attempting login with:', loginData.email);
  console.log('🌐 Target: https://www.healthhubinternational.com/api/auth/sign-in/email');
  
  try {
    const response = await fetch('https://www.healthhubinternational.com/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });
    
    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);
    
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log('\n📋 Response Headers:', JSON.stringify(responseHeaders, null, 2));
    
    const responseText = await response.text();
    console.log('\n📄 Response Body (raw):', responseText);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log('\n✅ Response Body (parsed):', JSON.stringify(responseJson, null, 2));
      
      if (responseJson.error) {
        console.log('\n❌ ERROR:', responseJson.error);
      }
      
      if (responseJson.session || responseJson.token) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
      } else {
        console.log('\n❌ LOGIN FAILED - No session/token returned');
      }
    } catch (e) {
      console.log('⚠️  Response is not JSON');
    }
    
  } catch (error) {
    console.error('\n❌ Fetch Error:', error.message);
  }
};

testLogin();
