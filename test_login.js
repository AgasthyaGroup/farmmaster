const jwt = require('jsonwebtoken');

async function testLogin() {
  // Test 1: Primary Executive - password: 123456
  console.log('--- Test 1: Primary Executive (password: 123456) ---');
  try {
    const res = await fetch('http://localhost:3002/api/customer-app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '1234567890', password: '123456' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }

  // Test 2: Test Rider - password: 1234
  console.log('\n--- Test 2: Test Rider (password: 1234) ---');
  try {
    const res = await fetch('http://localhost:3002/api/customer-app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '9999922222', password: '1234' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLogin();
