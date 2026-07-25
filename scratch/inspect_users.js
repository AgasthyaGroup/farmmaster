require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`\nUSERS COLLECTION (${users.length}):`);
    users.forEach((u, i) => {
      console.log(`[${i + 1}] ID: ${u._id}, Phone/Username: "${u.username || u.phone || u.mobile}", Name: "${u.name}", Role: "${u.role}"`);
    });

    const execs = await mongoose.connection.db.collection('deliveryexecutives').find({}).toArray();
    console.log(`\nDELIVERYEXECUTIVES COLLECTION (${execs.length}):`);
    execs.forEach((e, i) => {
      console.log(`[${i + 1}] ID: ${e._id}, Name: "${e.name}", Phone: "${e.phone}", Email: "${e.email}"`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
