const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const config = {
  local: 'http://localhost:3000',
  production: 'https://your-project.vercel.app', // Replace with your Vercel domain
  testKey: 'TEST-KEY-1234' // Replace with a valid key from your database
};

async function testConnectAPI(baseUrl, label) {
  console.log(`\n🧪 Testing ${label} API...`);
  
  const formData = new FormData();
  formData.append('game', 'PUBG');
  formData.append('user_key', config.testKey);
  formData.append('serial', 'test-device-001');

  try {
    const response = await fetch(`${baseUrl}/connect`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(`✅ ${label} Response status:`, response.status);
    console.log(`📦 ${label} Response data:`, JSON.stringify(data, null, 2));
    
    // Validate response format
    if (data.status === true && data.data && data.data.token) {
      console.log(`✅ ${label} Authentication successful!`);
    } else {
      console.log(`❌ ${label} Authentication failed or invalid response format`);
    }
    
  } catch (error) {
    console.error(`❌ ${label} Error:`, error.message);
  }
}

// Test GET request
async function testConnectGET(baseUrl, label) {
  console.log(`\n🧪 Testing ${label} GET API...`);
  
  try {
    const response = await fetch(`${baseUrl}/connect`, {
      method: 'GET'
    });

    const data = await response.json();
    console.log(`✅ ${label} GET Response status:`, response.status);
    console.log(`📦 ${label} GET Response data:`, JSON.stringify(data, null, 2));
    
    // Validate response format
    if (data.web_info && data.web__dev) {
      console.log(`✅ ${label} GET request successful!`);
    } else {
      console.log(`❌ ${label} GET request failed or invalid response format`);
    }
    
  } catch (error) {
    console.error(`❌ ${label} GET Error:`, error.message);
  }
}

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🧪 Testing Database Connection...');
  
  try {
    const { testConnection } = require('../lib/db.js');
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection successful!');
    } else {
      console.log('❌ Database connection failed!');
    }
  } catch (error) {
    console.error('❌ Database test error:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Kuro Panel API Tests...\n');
  
  // Test database connection first
  await testDatabaseConnection();
  
  // Test local API (if running locally)
  if (process.env.NODE_ENV !== 'production') {
    await testConnectAPI(config.local, 'LOCAL');
    await testConnectGET(config.local, 'LOCAL');
  }
  
  // Test production API
  await testConnectAPI(config.production, 'PRODUCTION');
  await testConnectGET(config.production, 'PRODUCTION');
  
  console.log('\n✨ Tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testConnectAPI,
  testConnectGET,
  testDatabaseConnection,
  runTests
}; 