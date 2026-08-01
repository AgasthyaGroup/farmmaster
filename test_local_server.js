async function testLocal() {
  console.log('Testing local login...');
  try {
    const loginRes = await fetch('http://localhost:3001/api/customer-app/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '1234567890', password: 'Tester' })
    });
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('Login message:', loginData.message);

    const token = loginData.data?.token;

    const ordersRes = await fetch('http://localhost:3001/api/customer-app/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Orders status:', ordersRes.status);
    const ordersData = await ordersRes.json();
    console.log('Fetched orders count:', ordersData.length);
    ordersData.forEach(o => {
      console.log(` - #${o.orderNumber} | Status: ${o.status} | Date: ${o.deliveryDate}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testLocal();
