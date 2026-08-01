const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farmmaster';

async function seed() {
  console.log('Connecting to local MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;

  // 1. Create or update Delivery Executive
  const hashedPassword = await bcrypt.hash('Tester', 10);
  const execsColl = db.collection('deliveryexecutives');

  let exec = await execsColl.findOne({ phone: '1234567890' });
  if (!exec) {
    const res = await execsColl.insertOne({
      name: 'Test Rider',
      phone: '1234567890',
      email: 'testrider@farmmaster.com',
      password: hashedPassword,
      vehicleType: 'Bike',
      vehicleNumber: 'TS 09 AB 1234',
      pincodes: ['500032'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    exec = await execsColl.findOne({ _id: res.insertedId });
    console.log('Created Delivery Executive: Test Rider');
  } else {
    await execsColl.updateOne(
      { _id: exec._id },
      { 
        $set: { 
          password: hashedPassword, 
          status: 'active',
          pincodes: ['500032']
        } 
      }
    );
    console.log('Updated existing Delivery Executive: Test Rider');
  }

  // 2. Create or update Delivery Route
  const routesColl = db.collection('deliveryroutes');
  let route = await routesColl.findOne({ routeCode: 'FD-01' });
  if (!route) {
    const res = await routesColl.insertOne({
      routeName: 'Financial District',
      routeCode: 'FD-01',
      startPoint: 'Gachibowli',
      endPoint: 'Financial District',
      pincodes: ['500032'],
      assignedExecutiveId: exec._id,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    route = await routesColl.findOne({ _id: res.insertedId });
    console.log('Created Delivery Route: Financial District');
  } else {
    await routesColl.updateOne(
      { _id: route._id },
      { $set: { assignedExecutiveId: exec._id, status: 'active', pincodes: ['500032'] } }
    );
    console.log('Updated Delivery Route: Financial District');
  }

  // Update exec assignedRouteId
  await execsColl.updateOne({ _id: exec._id }, { $set: { assignedRouteId: route._id } });

  // 3. Create Customer
  const customersColl = db.collection('customers');
  let customer = await customersColl.findOne({ phone: '9999922222' });
  if (!customer) {
    const res = await customersColl.insertOne({
      name: 'Tester Customer',
      phone: '9999922222',
      email: 'tester@customer.com',
      status: true,
      createdAt: new Date()
    });
    customer = await customersColl.findOne({ _id: res.insertedId });
    console.log('Created Customer: Tester Customer');
  }

  // 4. Create Orders for today (2026-07-28)
  const ordersColl = db.collection('orders');

  const todayStr = new Date().toISOString().split('T')[0];
  const sampleOrders = [
    {
      orderNumber: 'ORD-100001',
      status: 'confirmed',
      totalPrice: 150,
      deliveryDate: todayStr,
      customerId: customer._id,
      assignedTo: exec._id,
      address: {
        fullName: 'Tester Customer',
        mobile: '9999922222',
        addressLine1: 'Flat 402, Highrise Heights',
        addressLine2: 'Financial District',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [{ name: 'Full Cream Milk 500ml', quantity: 2, price: 50 }],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-100002',
      status: 'out_for_delivery',
      totalPrice: 200,
      deliveryDate: todayStr,
      customerId: customer._id,
      assignedTo: exec._id,
      address: {
        fullName: 'Tester Customer',
        mobile: '9999922222',
        addressLine1: 'Villa 12, Green Meadows',
        addressLine2: 'Financial District',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [{ name: 'Pure Desi Ghee 500g', quantity: 1, price: 200 }],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-100003',
      status: 'delivered',
      totalPrice: 100,
      deliveryDate: todayStr,
      customerId: customer._id,
      assignedTo: exec._id,
      address: {
        fullName: 'Tester Customer',
        mobile: '9999922222',
        addressLine1: 'Plot 88, IT Park',
        addressLine2: 'Financial District',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [{ name: 'Fresh Curd 500g', quantity: 2, price: 50 }],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const ord of sampleOrders) {
    await ordersColl.updateOne(
      { orderNumber: ord.orderNumber },
      { $set: ord },
      { upsert: true }
    );
  }

  console.log('Successfully seeded 3 test orders for today!');

  // 5. Seed default payment methods
  console.log('Seeding payment methods...');
  const payColl = db.collection('paymentmethods');
  const samplePayments = [
    { name: 'Cash on Delivery', code: 'COD', description: 'Pay with cash upon delivery', enabled: true, displayOrder: 0, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Online Payment', code: 'ONLINE', description: 'Pay instantly with credit/debit card, UPI, or NetBanking', enabled: true, displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    { name: 'Subscription Wallet', code: 'SUBSCRIPTION', description: 'Pay from your subscription wallet balance', enabled: true, displayOrder: 2, createdAt: new Date(), updatedAt: new Date() }
  ];
  for (const pm of samplePayments) {
    await payColl.updateOne(
      { code: pm.code },
      { $set: pm },
      { upsert: true }
    );
  }
  console.log('Seeded payment methods!');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
