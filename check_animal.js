const mongoose = require('mongoose');

async function checkAnimal() {
  await mongoose.connect('mongodb://localhost:27017/farmmaster');
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  const livestockCol = collections.find(c => c.name.toLowerCase() === 'livestocks' || c.name.toLowerCase() === 'livestock');
  if (livestockCol) {
    const item = await db.collection(livestockCol.name).findOne({ tag_id: '21345P' });
    console.log("Livestock Record for 21345P:", JSON.stringify(item, null, 2));
  }

  const cattleCol = collections.find(c => c.name.toLowerCase() === 'cattles' || c.name.toLowerCase() === 'cattle');
  if (cattleCol) {
    const item = await db.collection(cattleCol.name).findOne({ tag: '21345P' });
    console.log("Cattle Record for 21345P:", JSON.stringify(item, null, 2));
  }

  process.exit(0);
}

checkAnimal().catch(console.error);
