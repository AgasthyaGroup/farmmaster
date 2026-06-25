const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const SECRET = 'super-secret-key-123-change-this-in-production';
const TOKEN = jwt.sign(
  { userId: '6a3a375d4bdde30582a91c36', role: 'SUPER_ADMIN', email: 'admin@admin.com' },
  SECRET,
  { expiresIn: '1h' }
);
const BASE_URL = "http://localhost:3001";

async function testEditCattle() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmmaster');
    const db = mongoose.connection.db;
    const record = await db.collection('livestocks').findOne({ isDeleted: false });
    if (!record) {
      console.log("No active livestock record found in DB.");
      process.exit(0);
    }
    console.log("Found Livestock Record:", record._id.toString(), "Tag:", record.tag_id);

    const payload = {
      tag: record.tag_id,
      cattleType: record.animalType || "Cow",
      shed: record.shedId || "1",
      remarks: "TEST EDIT " + new Date().toISOString()
    };

    console.log("Sending PUT request to:", `${BASE_URL}/api/cattle/${record._id.toString()}`);
    const response = await fetch(`${BASE_URL}/api/cattle/${record._id.toString()}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testEditCattle();
