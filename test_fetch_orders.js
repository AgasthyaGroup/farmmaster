const jwt = require('jsonwebtoken');

async function testFetch() {
  const token = jwt.sign(
    { userId: '6a4b3f5a5b1c9aa52fb17103', role: 'SUPER_ADMIN', email: 'admin@admin.com' },
    'dev_secret_key_12345',
    { expiresIn: '1d' }
  );

  console.log('Sending request to /api/admin/orders...');
  try {
    const res = await fetch('http://localhost:3002/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Admin Orders Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching admin orders:', err);
  }

  // Also query customer app orders endpoint as delivery executive
  // The primary executive ID is: 6a6491d1373481000acb3055
  const execToken = jwt.sign(
    { userId: '6a6491d1373481000acb3055', role: 'DELIVERY_EXECUTIVE', phone: '1234567890' },
    'dev_secret_key_12345',
    { expiresIn: '1d' }
  );

  console.log('\nSending request to /api/customer-app/orders...');
  try {
    const res = await fetch('http://localhost:3002/api/customer-app/orders', {
      headers: { 'Authorization': `Bearer ${execToken}` }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Executive Orders Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching executive orders:', err);
  }
}

testFetch();
