const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect('mongodb://localhost:27017/farmmaster');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log('Users:');
  users.forEach(u => console.log(JSON.stringify(u)));
  const departments = await db.collection('departments').find({}).toArray();
  console.log('Departments:', departments.map(d => d.name));
  process.exit(0);
}

checkDB();
