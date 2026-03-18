require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Since we're running from node, we might need a simplified model or direct mongo
const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: { type: String, required: true },
    role: String,
    status: Boolean,
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const existingAdmin = await User.findOne({ email: 'admin@farmmaster.com' });
  if (existingAdmin) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = new User({
    name: 'Main Admin',
    email: 'admin@farmmaster.com',
    phone: '1234567890',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    status: true,
  });

  await admin.save();
  console.log('Super Admin created successfully');
  console.log('Email: admin@farmmaster.com');
  console.log('Password: admin123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
