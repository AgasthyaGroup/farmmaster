const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/farmmaster';

async function addMoreOrders() {
  console.log('Connecting to local MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const execsColl = db.collection('deliveryexecutives');
  const customersColl = db.collection('customers');
  const ordersColl = db.collection('orders');

  const exec = await execsColl.findOne({ phone: '1234567890' });
  if (!exec) {
    console.error('Test Rider executive not found! Please run seed_local_data.js first.');
    process.exit(1);
  }

  let customer = await customersColl.findOne({ phone: '9999922222' });

  const todayStr = '2026-07-28';

  const additionalOrders = [
    {
      orderNumber: 'ORD-200101',
      status: 'confirmed',
      totalPrice: 240,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Rahul Sharma',
        mobile: '9876543210',
        addressLine1: 'Flat 101, Sunshine Apartments',
        addressLine2: 'Financial District',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'Organic Cow Milk 1L', quantity: 2, price: 70 },
        { name: 'Fresh Paneer 200g', quantity: 1, price: 100 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-200102',
      status: 'confirmed',
      totalPrice: 350,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Ananya Verma',
        mobile: '9123456789',
        addressLine1: 'Plot 45, DLF Cyber City',
        addressLine2: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'A2 Buffalo Milk 1L', quantity: 3, price: 90 },
        { name: 'Fresh Butter 100g', quantity: 1, price: 80 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-200103',
      status: 'confirmed',
      totalPrice: 180,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Srinivas Rao',
        mobile: '9988776655',
        addressLine1: 'Block B-302, My Home Bhooja',
        addressLine2: 'Kondapur',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'Full Cream Milk 500ml', quantity: 2, price: 40 },
        { name: 'Fresh Curd 1kg', quantity: 1, price: 100 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-200104',
      status: 'out_for_delivery',
      totalPrice: 420,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Priya Reddy',
        mobile: '9849012345',
        addressLine1: 'Tower 4 - 1204, Jayabheri Silicon County',
        addressLine2: 'Financial District',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'Pure Cow Ghee 500g', quantity: 1, price: 350 },
        { name: 'Flavored Badam Milk 200ml', quantity: 2, price: 35 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-200105',
      status: 'delivered',
      totalPrice: 160,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Vikram Mehta',
        mobile: '9700112233',
        addressLine1: 'Flat 505, Aparna Sarovar',
        addressLine2: 'Nallagandla',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'Standardized Milk 1L', quantity: 2, price: 65 },
        { name: 'Butter Milk 500ml', quantity: 1, price: 30 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      orderNumber: 'ORD-200106',
      status: 'customer_unavailable',
      totalPrice: 120,
      deliveryDate: todayStr,
      customerId: customer ? customer._id : null,
      assignedTo: exec._id,
      address: {
        fullName: 'Kavitha K',
        mobile: '9654321098',
        addressLine1: 'House No 12-3, Telecom Nagar',
        addressLine2: 'Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032'
      },
      items: [
        { name: 'Toned Milk 1L', quantity: 2, price: 60 }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const ord of additionalOrders) {
    await ordersColl.updateOne(
      { orderNumber: ord.orderNumber },
      { $set: ord },
      { upsert: true }
    );
  }

  console.log('Successfully added 6 additional test orders!');
  await mongoose.disconnect();
}

addMoreOrders().catch(err => {
  console.error('Error adding orders:', err);
  process.exit(1);
});
