const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTFhZWJlZGE1ZjNiN2IzMmQ0YTI5ZGMiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsImlhdCI6MTc4MDMwOTM1NCwiZXhwIjoxNzgwMzk1NzU0fQ.ppanZdxGX5xO_TiIAziGPqgCaeHHVpgekfUNHZzob24";
const BASE_URL = "http://localhost:3001";

async function testAddLivestock() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testTag = `TAG-LIVESTOCK-${randomSuffix}`;
  console.log(`Creating unique livestock tag: ${testTag}`);

  const payload = {
    tag: testTag,
    cattleType: "Cow",
    shed: "1",
    calvings: 1,
    gender: "Female",
    farmBorn: "Yes",
    status: "Active"
  };

  try {
    const response = await fetch(`${BASE_URL}/api/cattle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log(`✅ Livestock ${testTag} successfully created!`);
    } else {
      console.error(`❌ Failed to create livestock:`, data.error || data.message || data);
    }
  } catch (error) {
    console.error("Error making request:", error);
  }
}

testAddLivestock();
