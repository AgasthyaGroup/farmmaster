require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

async function createTestRider() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    // Check if already exists
    const existing = await db.collection('deliveryexecutives').findOne({ phone: '9999922222' });
    if (existing) {
      console.log('❌ Executive with phone 9999922222 already exists:', existing.name, '| ID:', existing._id);
      // Update their password to 1234
      const hash = await bcrypt.hash('1234', 10);
      await db.collection('deliveryexecutives').updateOne(
        { phone: '9999922222' },
        { $set: { password: hash, name: 'Test Rider', status: 'active' } }
      );
      console.log('✅ Updated password to 1234 and name to Test Rider');
      const updated = await db.collection('deliveryexecutives').findOne({ phone: '9999922222' });
      console.log('Updated exec ID:', updated._id.toString());
      return updated._id;
    }

    const hashedPassword = await bcrypt.hash('1234', 10);
    const result = await db.collection('deliveryexecutives').insertOne({
      name: 'Test Rider',
      phone: '9999922222',
      email: 'testrider@agasthya.com',
      password: hashedPassword,
      vehicleType: 'Bike',
      vehicleNumber: 'TS-01-AB-1234',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Created Test Rider!');
    console.log('   ID:', result.insertedId.toString());
    console.log('   Phone: 9999922222');
    console.log('   Password: 1234');
    return result.insertedId;

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createTestRider();
