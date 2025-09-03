const axios = require('axios');

async function testEmailReminders() {
  try {
    console.log('Testing Email Reminders endpoints...');
    
    // First, login to get a token
    const loginData = {
      email: 'superadmin@example.com',
      password: 'Test1234!'
    };
    
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', loginData);
    const token = loginResponse.data.token;
    
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 20) + '...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Get inactive user statistics
    console.log('\n1. Testing /stats endpoint...');
    try {
      const statsResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/stats', { headers });
      console.log('✅ Stats endpoint working!');
      console.log('Stats data:', statsResponse.data);
    } catch (error) {
      console.log('❌ Stats endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 2: Get inactive users list
    console.log('\n2. Testing /inactive-users endpoint...');
    try {
      const usersResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/inactive-users', { headers });
      console.log('✅ Inactive users endpoint working!');
      console.log('Users data:', usersResponse.data);
    } catch (error) {
      console.log('❌ Inactive users endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 3: Get cron status
    console.log('\n3. Testing /cron-status endpoint...');
    try {
      const cronResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/cron-status', { headers });
      console.log('✅ Cron status endpoint working!');
      console.log('Cron data:', cronResponse.data);
    } catch (error) {
      console.log('❌ Cron status endpoint failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testEmailReminders();
