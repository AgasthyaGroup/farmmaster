const mongoose = require('mongoose');

async function checkLivestock() {
  await mongoose.connect('mongodb://localhost:27017/farmmaster');
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log("Collections present in DB:", collections.map(c => c.name));

  const livestockCol = collections.find(c => c.name.toLowerCase() === 'livestocks' || c.name.toLowerCase() === 'livestock');
  if (livestockCol) {
    const list = await db.collection(livestockCol.name).find({}).toArray();
    console.log(`\n--- ${livestockCol.name} (${list.length} records) ---`);
    list.forEach(item => {
      console.log(`Tag: ${item.tag_id || item.tag}, isPending: ${item.isPendingDetails}, onboardingType: ${item.onboardingType}, dameId: ${item.dameId}, status: ${item.status}`);
    });
  }

  const cattleCol = collections.find(c => c.name.toLowerCase() === 'cattles' || c.name.toLowerCase() === 'cattle');
  if (cattleCol) {
    const list = await db.collection(cattleCol.name).find({}).toArray();
    console.log(`\n--- ${cattleCol.name} (${list.length} records) ---`);
    list.forEach(item => {
      console.log(`Tag: ${item.tag || item.tag_id}, isPending: ${item.isPendingDetails}, onboardingType: ${item.onboardingType}, status: ${item.status}`);
    });
  }

  process.exit(0);
}

checkLivestock().catch(console.error);
