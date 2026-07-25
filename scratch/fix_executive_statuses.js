require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

const DeliveryExecutiveSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  status: String,
});

const DeliveryExecutive = mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);

async function runFix() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const executives = await DeliveryExecutive.find({});
    console.log(`Found ${executives.length} delivery executives in database:`);

    for (const exec of executives) {
      console.log(`- Executive: ${exec.name || 'Unnamed'}, Phone: ${exec.phone}, Current Status: ${exec.status}`);
      if (exec.status !== 'active') {
        exec.status = 'active';
        await exec.save();
        console.log(`  └─ Updated status to 'active'`);
      }
    }

    console.log('\n✅ All Delivery Executive accounts verified and set to active!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runFix();
