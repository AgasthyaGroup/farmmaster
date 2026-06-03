const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb://localhost:27017/farmmaster');
  const db = mongoose.connection.db;

  // Set isPendingDetails to true in livestocks collection to sync with cattles collection
  await db.collection('livestocks').updateMany(
    { tag_id: { $in: ['5Y', '31Y', 'CALF31Y20260501'] } },
    { $set: { isPendingDetails: true } }
  );

  // Set onboarding types
  await db.collection('livestocks').updateOne(
    { tag_id: 'CALF31Y20260501' },
    { $set: { onboardingType: 'CALVING', animalType: 'COW' } }
  );
  await db.collection('livestocks').updateOne(
    { tag_id: '31Y' },
    { $set: { onboardingType: 'CALVING', animalType: 'COW' } }
  );
  await db.collection('livestocks').updateOne(
    { tag_id: '5Y' },
    { $set: { onboardingType: 'PURCHASE', animalType: 'COW' } }
  );

  console.log("Database updated successfully!");
  process.exit(0);
}

migrate().catch(console.error);
