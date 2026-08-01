// Login as farmmaster admin and check all orders with their assignedTo fields
async function test() {
  // Try admin login
  const loginRes = await fetch('https://farm.agasthyanutromilk.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@farmmaster.com', password: 'admin123' })
  });
  console.log('Admin login status:', loginRes.status);
  const loginText = await loginRes.text();
  
  try {
    const loginData = JSON.parse(loginText);
    console.log('Admin login data:', JSON.stringify(loginData, null, 2).substring(0, 500));
    
    if (loginData.token || loginData.data?.token) {
      const token = loginData.token || loginData.data?.token;
      
      // Try to get all orders via admin
      const ordersRes = await fetch('https://farm.agasthyanutromilk.com/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersText = await ordersRes.text();
      console.log('Admin orders status:', ordersRes.status);
      console.log('Admin orders raw:', ordersText.substring(0, 500));
    }
  } catch(e) {
    console.log('Raw response:', loginText.substring(0, 300));
  }
}

test();
