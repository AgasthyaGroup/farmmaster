const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTFhZWJlZGE1ZjNiN2IzMmQ0YTI5ZGMiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImlhdCI6MTc4MDMwOTM1NCwiZXhwIjoxNzgwMzk1NzU0fQ.ppanZdxGX5xO_TiIAziGPqgCaeHHVpgekfUNHZzob24";
const BASE_URL = "http://localhost:3001";

async function testFetch() {
  try {
    const res = await fetch(`${BASE_URL}/api/cattle`, {
      headers: {
        "Authorization": `Bearer ${TOKEN}`
      }
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    
    // Auto-unwrap data envelope
    const records = Array.isArray(data) ? data : (data.success ? data.data : (data.data ? data.data : []));
    console.log("Total records fetched:", records.length);

    const pending = records.filter(r => r.isPendingDetails === true || String(r.isPendingDetails) === 'true');
    console.log("\n--- Pending Animals ---");
    pending.forEach(p => {
      console.log(`Tag: ${p.tag_id || p.tag || p.tag_id}, OnboardingType: ${p.onboardingType}, dameId: ${p.dameId}, status: ${p.status}`);
    });
  } catch (err) {
    console.error(err);
  }
}

testFetch();