require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

async function createOrderForTestRider() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    // Find Tester customer
    const customer = await db.collection('customers').findOne({ phone: '9876554939' });
    if (!customer) {
      console.log('Customer not found!');
      return;
    }

    // Find Test Rider executive
    const exec = await db.collection('deliveryexecutives').findOne({ phone: '9999922222' });
    if (!exec) {
      console.log('Test Rider executive not found!');
      return;
    }

    const order = {
      customerId: customer._id,
      orderNumber: 'ORD-' + Date.now().toString().slice(-6),
      status: 'pending',
      totalPrice: 250,
      items: [
        { product: new mongoose.Types.ObjectId(), name: 'Fresh Farm Milk 1L', price: 75, quantity: 2 },
        { product: new mongoose.Types.ObjectId(), name: 'Curd 500g', price: 50, quantity: 2 },
      ],
      address: {
        fullName: 'Tester',
        mobile: '9876554939',
        addressLine1: 'One West',
        addressLine2: 'Nanakramguda',
        city: 'hyd',
        state: 'Telangana',
        pincode: '500032'
      },
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      assignedTo: exec._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(order);
    console.log('Order created!');
    console.log('  Order ID:', result.insertedId.toString());
    console.log('  Order Number:', order.orderNumber);
    console.log('  Assigned to Test Rider:', exec._id.toString());
    console.log('  Customer: Tester (', customer.phone, ')');
    console.log('  Total: Rs.', order.totalPrice);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createOrderForTestRider();
