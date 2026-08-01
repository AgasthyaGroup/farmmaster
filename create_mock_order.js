const mongoose = require('mongoose');

async function createMockOrder() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmmaster');
    const db = mongoose.connection.db;

    const customer = await db.collection('customers').findOne({});
    if (!customer) {
      console.log('No customers found to associate the order with. Please register a customer first.');
      return;
    }

    const executive = await db.collection('deliveryexecutives').findOne({});

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
        fullName: customer.name || 'Test User',
        mobile: customer.phone || '9876543210',
        addressLine1: '123 Green Valley Road',
        addressLine2: 'Shed 4 Area',
        city: 'Austin',
        state: 'Texas',
        pincode: '78701'
      },
      paymentStatus: 'pending',
      paymentMethod: 'COD',
      assignedTo: executive ? executive._id : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(mockOrder);
    console.log('Successfully created mock order:', result.insertedId);
    console.log('Order details:', mockOrder);

  } catch (err) {
    console.error('Error creating mock order:', err);
  } finally {
    process.exit(0);
  }
}

createMockOrder();
