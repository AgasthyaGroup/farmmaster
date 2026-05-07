require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log('Connected to DB:', db.databaseName);

  const collections = (await db.listCollections().toArray()).map(c => c.name);
  console.log('Collections:', collections);

  if (!collections.includes('users')) {
    console.log('No `users` collection exists. Seed has never run on this cluster/db.');
    await mongoose.disconnect();
    return;
  }

  const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
  console.log(`User count: ${users.length}`);
  for (const u of users) {
    console.log('-', {
      _id: u._id?.toString(),
      userId: u.userId,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department,
      hasPassword: !!u.password === false ? 'no (projected)' : 'yes',
      createdAt: u.createdAt,
    });
  }

  await mongoose.disconnect();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
