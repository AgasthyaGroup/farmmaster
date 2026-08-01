const mongoose = require('mongoose');

async function checkOrders() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmmaster');
    const db = mongoose.connection.db;

    const ordersCount = await db.collection('orders').countDocuments();
    console.log(`Total orders in DB: ${ordersCount}`);

    const orders = await db.collection('orders').find({}).limit(5).toArray();
    console.log('Sample Orders:', JSON.stringify(orders, null, 2));

    const customersCount = await db.collection('customers').countDocuments();
    console.log(`Total customers in DB: ${customersCount}`);

    const executivesCount = await db.collection('deliveryexecutives').countDocuments();
    console.log(`Total deliveryexecutives in DB: ${executivesCount}`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkOrders();
