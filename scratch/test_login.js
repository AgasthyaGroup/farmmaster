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
  status: String,
});

const DeliveryExecutive = mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);

async function testAuth() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const testPhone = '9876543210';
    const testPass = 'password123';

    await DeliveryExecutive.deleteMany({ phone: testPhone });

    const hashedPassword = await bcrypt.hash(testPass, 10);
    const exec = await DeliveryExecutive.create({
      name: 'Ramesh Delivery Boy',
      phone: testPhone,
      email: 'ramesh@gmail.com',
      password: hashedPassword,
      vehicleType: 'Bike',
      status: 'active',
    });
    console.log('✅ Executive created:', exec.name, 'Phone:', exec.phone);

    // Test Login lookup logic with different inputs (+91 9876543210, 9876543210)
    const inputs = ['9876543210', '+919876543210', '+91 9876543210', '09876543210'];

    for (const input of inputs) {
      const cleanPhone = input.replace(/^(\+91|0)/, '').replace(/\D/g, '');
      const found = await DeliveryExecutive.findOne({
        $or: [
          { phone: input },
          { phone: cleanPhone },
          { phone: `+91${cleanPhone}` },
          { email: input.toLowerCase() }
        ]
      });

      if (!found) {
        throw new Error(`❌ Lookup failed for input: "${input}"`);
      }

      const isPassMatch = await bcrypt.compare(testPass, found.password);
      if (!isPassMatch) {
        throw new Error(`❌ Password match failed for input: "${input}"`);
      }

      console.log(`🎉 SUCCESS: Authenticated successfully for input "${input}" -> Executive ID: ${found._id}`);
    }

    await DeliveryExecutive.deleteMany({ _id: exec._id });
    console.log('🧹 Cleaned up test executive.');
    console.log('\n========================================');
    console.log('ALL LOGIN VERIFICATION TESTS PASSED!    ');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testAuth();
