require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

const DeliveryExecutiveSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  password: String,
  vehicleType: String,
  vehicleNumber: String,
  status: String,
}, { timestamps: true });

const DeliveryExecutive = mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const hashedPassword1 = await bcrypt.hash('123456', 10);
    const hashedPassword2 = await bcrypt.hash('password123', 10);

    const execsToSeed = [
      {
        name: 'Demo Delivery Partner',
        phone: '9876543210',
        email: 'delivery@agasthya.com',
        password: hashedPassword1,
        vehicleType: 'Bike',
        vehicleNumber: 'KA-01-EA-1234',
        status: 'active',
      },
      {
        name: 'Primary Executive',
        phone: '1234567890',
        email: 'executive@agasthya.com',
        password: hashedPassword1,
        vehicleType: 'Bike',
        vehicleNumber: 'KA-01-EA-5678',
        status: 'active',
      }
    ];

    for (const data of execsToSeed) {
      const existing = await DeliveryExecutive.findOne({ phone: data.phone });
      if (!existing) {
        const created = await DeliveryExecutive.create(data);
        console.log(`✅ Seeded Executive: ${created.name} (Phone: ${created.phone}, Password: 123456)`);
      } else {
        existing.password = hashedPassword1;
        existing.status = 'active';
        await existing.save();
        console.log(`✅ Updated existing Executive: ${existing.name} (Phone: ${existing.phone}, Password reset to 123456)`);
      }
    }

    console.log('\n🎉 DEMO EXECUTIVE SEEDING COMPLETE!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
