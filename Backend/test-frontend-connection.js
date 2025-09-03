const axios = require('axios');

async function testFrontendConnection() {
  try {
    console.log('🔍 Testing frontend-backend connection comprehensively...');
    
    // Test 1: Check if server is running
    console.log('\n1. Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server health check:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      return;
    }
    
    // Test 2: Test CORS preflight for email reminders
    console.log('\n2. Testing CORS for email reminders...');
    try {
      const corsResponse = await axios.options('http://localhost:5000/api/v1/superadmin/email-reminders/stats');
      console.log('✅ CORS preflight successful for email reminders');
    } catch (error) {
      console.log('❌ CORS preflight failed for email reminders:', error.message);
    }
    
    // Test 3: Test email reminders endpoint without auth (should return 401)
    console.log('\n3. Testing email reminders without auth...');
    try {
      await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/stats');
      console.log('❌ Should have returned 401 (unauthorized)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly returned 401 (unauthorized) - endpoint exists and accessible');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.message);
      }
    }
    
    // Test 4: Test with proper auth - FULL TEST
    console.log('\n4. Testing email reminders with FULL authentication...');
    try {
      // Login first
      const loginData = {
        email: 'superadmin@example.com',
        password: 'Test1234!'
      };
      
      console.log('   Logging in...');
      const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', loginData);
      const token = loginResponse.data.token;
      
      console.log('✅ Login successful');
      console.log('   Token length:', token.length);
      console.log('   Token preview:', token.substring(0, 20) + '...');
      
      // Test email reminders with token
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('   Testing stats endpoint...');
      const statsResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/stats', { headers });
      console.log('✅ Stats endpoint working:', statsResponse.data);
      
      console.log('   Testing inactive users endpoint...');
      const usersResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/inactive-users', { headers });
      console.log('✅ Inactive users endpoint working:', usersResponse.data);
      
      console.log('   Testing cron status endpoint...');
      const cronResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/cron-status', { headers });
      console.log('✅ Cron status endpoint working:', cronResponse.data);
      
      console.log('\n🎉 ALL EMAIL REMINDERS ENDPOINTS ARE WORKING!');
      
    } catch (error) {
      console.log('❌ Auth test failed:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response) {
        console.log('   Response headers:', error.response.headers);
        console.log('   Response data:', error.response.data);
      }
    }
    
    // Test 5: Test the exact URL pattern the frontend uses
    console.log('\n5. Testing frontend URL pattern...');
    try {
      const loginData = {
        email: 'superadmin@example.com',
        password: 'Test1234!'
      };
      
      const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', loginData);
      const token = loginResponse.data.token;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Test the exact URL the frontend uses
      const frontendTestResponse = await axios.get('http://localhost:5000/api/v1/superadmin/email-reminders/stats', { headers });
      console.log('✅ Frontend URL pattern test successful:', frontendTestResponse.data);
      
    } catch (error) {
      console.log('❌ Frontend URL pattern test failed:', error.response?.status, error.response?.data?.message || error.message);
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
testFrontendConnection();
