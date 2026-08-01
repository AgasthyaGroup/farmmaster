const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmmaster');
    const db = mongoose.connection.db;
    const execs = await db.collection('deliveryexecutives').find({}).toArray();
    console.log('Executives in DB:', JSON.stringify(execs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
