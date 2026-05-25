const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/farmmaster');
  
  const db = mongoose.connection.db;
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const existingUser = await db.collection('users').findOne({ email: 'admin@admin.com' });
  if (!existingUser) {
    await db.collection('users').insertOne({
      userId: 'admin',
      name: 'Local Admin',
      email: 'admin@admin.com',
      department: 'IT',
      phone: '1234567890',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0
    });
    console.log('Seeded Local Admin user!');
  } else {
    console.log('Admin already exists!');
  }
  
  process.exit(0);
}

seed().catch(console.error);
