const mongoose = require('mongoose');

async function createOrderForTester() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmmaster');
    const db = mongoose.connection.db;

    // Find the customer "Tester"
    const customer = await db.collection('customers').findOne({ phone: "9876554939" });
    if (!customer) {
      console.log('Customer with phone 9876554939 not found. Finding any customer...');
      return;
    }

    // Find delivery executive
    const executive = await db.collection('deliveryexecutives').findOne({ phone: "1234567890" });
    if (!executive) {
      console.log('Delivery executive not found!');
    }

    const mockOrder = {
      customerId: customer._id,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      totalPrice: 150,
      items: [
        {
          product: new mongoose.Types.ObjectId(),
          name: 'Fresh Farm Milk 1L',
          price: 75,
          quantity: 2
        }
      ],
      address: {
        fullName: customer.name || 'Tester',
        mobile: customer.phone || '9876554939',
        addressLine1: customer.address1 || 'One West',
        addressLine2: customer.address2 || 'Nanakramguda',
        city: customer.city || 'hyd',
        state: customer.state || 'Telangana',
        pincode: customer.pincode || '500032'
      },
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      assignedTo: executive ? executive._id : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(mockOrder);
    console.log('Successfully created order for Tester customer!');
    console.log('Order ID:', result.insertedId);
    console.log('Order Number:', mockOrder.orderNumber);
    console.log('Assigned to executive:', executive ? executive.name : 'None');
    console.log('Full Order:', JSON.stringify(mockOrder, null, 2));

  } catch (err) {
    console.error('Error creating order:', err);
  } finally {
    process.exit(0);
  }
}

createOrderForTester();
