const FormData = require('form-data');
const fetch = require('node-fetch');

async function testConnectAPI() {
  const formData = new FormData();
  formData.append('game', 'PUBG');
  formData.append('user_key', 'TEST-KEY-1234'); // Replace with a valid key from your database
  formData.append('serial', 'test-device-001');

  try {
    const response = await fetch('http://localhost:3000/api/connect', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing connect API:', error);
  }
}

// Test GET request
async function testConnectGET() {
  try {
    const response = await fetch('http://localhost:3000/api/connect', {
      method: 'GET'
    });

    const data = await response.json();
    console.log('GET Response status:', response.status);
    console.log('GET Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing connect GET API:', error);
  }
}

// Run tests
console.log('Testing POST /api/connect...');
testConnectAPI();

console.log('\nTesting GET /api/connect...');
testConnectGET(); 