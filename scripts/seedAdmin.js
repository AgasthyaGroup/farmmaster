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
    userId: { type: String, required: true, unique: true },
    name: String,
    email: { type: String, required: true, unique: true },
    department: String,
    phone: String,
    password: { type: String, required: true },
    role: String,
    status: Boolean,
  });

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  // 1. Seed admin@farmmaster.com
  const existingAdmin = await User.findOne({ email: 'admin@farmmaster.com' });
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      userId: 'main_admin',
      name: 'Main Admin',
      email: 'admin@farmmaster.com',
      department: 'Management',
      phone: '1234567890',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: true,
    });
    await admin.save();
    console.log('Super Admin admin@farmmaster.com created successfully');
  } else {
    console.log('Admin admin@farmmaster.com already exists');
  }

  // 2. Seed jash@gmail.com
  const existingJash = await User.findOne({ email: 'jash@gmail.com' });
  if (!existingJash) {
    const jashPassword = await bcrypt.hash('Admin@143', 10);
    const jashAdmin = new User({
      userId: 'jash',
      name: 'Jash',
      email: 'jash@gmail.com',
      department: 'Management',
      phone: '1234567890',
      password: jashPassword,
      role: 'SUPER_ADMIN',
      status: true,
    });
    await jashAdmin.save();
    console.log('Super Admin jash@gmail.com created successfully with password Admin@143');
  } else {
    console.log('Admin jash@gmail.com already exists');
  }

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
