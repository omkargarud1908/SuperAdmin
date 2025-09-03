const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    const loginData = {
      email: 'superadmin@example.com',
      password: 'Test1234!'
    };

    console.log('Attempting login with:', loginData.email);
    
    const response = await axios.post('http://localhost:5000/api/v1/auth/login', loginData);
    
    if (response.data.token) {
      console.log('✅ Login successful!');
      console.log('Token received:', response.data.token.substring(0, 20) + '...');
      console.log('User:', response.data.user.name);
      console.log('Roles:', response.data.user.roles);
      
      // Test getting user info with the token
      console.log('\nTesting /me endpoint...');
      const meResponse = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      console.log('✅ /me endpoint working!');
      console.log('Current user:', meResponse.data.user.name);
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login failed with status:', error.response.status);
      console.log('Error message:', error.response.data.message);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

// Run the test
testLogin();
