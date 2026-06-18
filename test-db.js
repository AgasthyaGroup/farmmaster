const mongoose = require('mongoose');

async function test() {
  const uri = "mongodb://localhost:27017/farmmaster"; // or let's read environment variable
  // Let's connect using the DB connection URI from env
  require('dotenv').config({ path: '/Users/jaswanthreddy/work/farmmaster/.env' });
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/farmmaster";
  console.log("Connecting to:", mongoUri);
  await mongoose.connect(mongoUri);
  
  const LiveStock = mongoose.connection.collection('livestock');
  const docs = await LiveStock.find({ remarks: { $ne: "" } }).limit(5).toArray();
  console.log("Found docs with remarks:", docs.length);
  for (const doc of docs) {
    console.log(`Tag: ${doc.tag_id || doc.tag}, Remarks: ${doc.remarks}`);
  }
  
  const allDocs = await LiveStock.find({}).limit(5).toArray();
  console.log("Sample docs:");
  for (const doc of allDocs) {
    console.log(`Tag: ${doc.tag_id || doc.tag}, Remarks: "${doc.remarks}" (Keys: ${Object.keys(doc)})`);
  }
  
  await mongoose.disconnect();
}

test().catch(console.error);
