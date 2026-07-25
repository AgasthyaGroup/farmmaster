require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

const DeliveryExecutiveSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  status: String,
}, { strict: false });

const DeliveryExecutive = mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);

async function inspectExecs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB!\n');

    const execs = await DeliveryExecutive.find({});
    console.log(`FOUND ${execs.length} DELIVERY EXECUTIVES IN MONGODB:\n`);

    for (let i = 0; i < execs.length; i++) {
      const e = execs[i];
      const hasPass = Boolean(e.password && e.password.length > 0);
      const isBcrypt = hasPass && e.password.startsWith('$2');
      console.log(`[${i + 1}] ID: ${e._id.toString()}`);
      console.log(`    Name: "${e.name}"`);
      console.log(`    Phone: "${e.phone}"`);
      console.log(`    Email: "${e.email}"`);
      console.log(`    Status: "${e.status}"`);
      console.log(`    Has Password: ${hasPass}`);
      console.log(`    Password Format: ${isBcrypt ? 'bcrypt hash' : (hasPass ? 'PLAIN TEXT: "' + e.password + '"' : 'MISSING')}`);
      console.log('----------------------------------------');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

inspectExecs();
