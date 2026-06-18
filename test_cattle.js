const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/farmmaster');
const db = mongoose.connection;
db.once('open', async () => {
  const cattle = await db.collection('cattles').find({}).limit(10).toArray();
  console.log(JSON.stringify(cattle.map(c => ({ tag: c.tag, shed: c.shed, onboardingType: c.onboardingType, isPendingDetails: c.isPendingDetails })), null, 2));
  process.exit();
});
