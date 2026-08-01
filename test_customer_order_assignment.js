async function test() {
  const credentials = [
    { username: '9999922222', password: '123456' },
    { username: '9999922222', password: 'Tester' },
    { username: '9999922222', password: '1234' }
  ];

  for (const creds of credentials) {
    console.log(`\nTrying login for customer ${creds.username} with password: ${creds.password}...`);
    try {
      const loginRes = await fetch('https://farm.agasthyanutromilk.com/api/customer-app/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      console.log('Login Status:', loginRes.status);
      const loginData = await loginRes.json();
      if (loginRes.status !== 200) {
        console.log('Login failed:', loginData);
        continue;
      }
      
      const token = loginData.data?.token || loginData.token;
      console.log('Login success! Fetching customer orders...');
      
      const ordersRes = await fetch('https://farm.agasthyanutromilk.com/api/customer-app/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Orders Status:', ordersRes.status);
      const ordersData = await ordersRes.json();
      console.log(`Fetched ${ordersData.length} customer orders.`);
      for (const order of ordersData) {
        console.log(`Order: ${order.orderNumber}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Assigned To:`, JSON.stringify(order.assignedTo || 'Unassigned', null, 2));
      }
      break;
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

test();
