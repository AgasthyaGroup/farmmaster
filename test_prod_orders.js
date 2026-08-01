// Test the exact URL and token from the Flutter app logs
async function test() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTY0NTAwNzljYjM0MWFhNzY3N2FjMDMiLCJlbWFpbCI6InRlc3RAZ21haWwuY29tIiwicm9sZSI6IkRFTElWRVJZX0VYRUNVVElWRSIsInBlcm1pc3Npb25zIjpbIkRFTElWRVJZX0VYRUNVVElWRSJdLCJpYXQiOjE3ODUyMjE4NTQsImV4cCI6MTgxNjc1Nzg1NH0.HBuhQJkjNh39vV7Xe6XQk1otmdyLCg95-xpz_sG5vvA';
  const url = 'https://farm.agasthyanutromilk.com/api/customer-app/orders';

  console.log('Testing:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    console.log('HTTP Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body (first 1000):', text.substring(0, 1000));
  } catch (err) {
    console.error('Fetch error:', err.message);
    console.error('Full error:', err);
  }
}

test();
