const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZjNjIzMWY2NTkwMTUwMTgxYzg5MjYiLCJlbWFpbCI6ImFkbWluQGFubS5jb20iLCJyb2xlIjoiRkFSTV9BRE1JTiIsImZhcm1JZCI6IjY5ZmIxNGRjZGVjMjIzY2Y5NWM5ZGQxNSIsImlhdCI6MTc3OTQ0ODk2OSwiZXhwIjoxNzc5NTM1MzY5fQ.laDhtuMDNMZxAl_L3KPvTXJkUz2Xjzmk-3HmlbAElWM";
const BASE_URL = "https://farm.agasthyanutromilk.com";

async function testEndpoint(name, endpoint, payload) {
  try {
    console.log(`\n======================================`);
    console.log(`🚀 Testing Module: ${name}`);
    console.log(`📡 Sending POST request to ${endpoint}`);
    console.log(`📦 Payload: ${JSON.stringify(payload)}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS: ${data.message}`);
      return true;
    } else {
      console.error(`❌ FAILED: API returned HTTP ${response.status}`);
      console.error(`❌ Error Message: ${data.error || data.message || 'Unknown Error'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ CRITICAL FAILURE: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  const tests = [
    {
      name: "Cattle / Livestock",
      endpoint: "/api/cattle",
      payload: {
        tag: "TAG-TEST-001",
        cattleType: "Cow",
        shed: "1",
        calvings: 2,
        gender: "Female",
        farmBorn: "Yes",
        status: "Active"
      }
    },
    {
      name: "Grass Collection",
      endpoint: "/api/operations/grass-collection",
      payload: {
        farmId: "TKP",
        noOfLoads: 3,
        weight: 1500,
        date: new Date().toISOString()
      }
    },
    {
      name: "Daily Feeding",
      endpoint: "/api/operations/daily-feeding",
      payload: {
        shedId: "1",
        animalId: "Cow",
        greenGrass: 15,
        dryGrass: 10,
        date: new Date().toISOString()
      }
    },
    {
      name: "Treatment Log",
      endpoint: "/api/health/treatments",
      payload: {
        tagId: "TAG-TEST-001",
        animalId: "Cow",
        shedId: "1",
        symptoms: "Fever",
        doctor: "Dr. Smith",
        cost: 500,
        healthStatus: "Pending",
        date: new Date().toISOString()
      }
    },
    {
      name: "Vaccination Log",
      endpoint: "/api/health/vaccinations",
      payload: {
        tagId: "TAG-TEST-001",
        animalId: "Cow",
        shedId: "1",
        vaccinationName: "FMD",
        batchNo: "BCH-1234",
        treatmentOrStatus: "Completed",
        manufactureDate: new Date().toISOString(),
        expiryDate: new Date().toISOString(),
        date: new Date().toISOString()
      }
    },
    {
      name: "Crossing Log",
      endpoint: "/api/crossing",
      payload: {
        tag: "TAG-TEST-001",
        maleTag: "BULL-001",
        crossingDate: new Date().toISOString(),
        crossingAttemptNumber: 1,
        "pregnancy status": "Pending"
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const isSuccess = await testEndpoint(test.name, test.endpoint, test.payload);
    if (isSuccess) passed++;
    else failed++;
  }

  console.log(`\n======================================`);
  console.log(`🎉 TEST SUMMARY`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  if (failed === 0) {
    console.log(`🏆 ALL MODULES ARE WORKING PERFECTLY END-TO-END!`);
  }
}

runAllTests();
