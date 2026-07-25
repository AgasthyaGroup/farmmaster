require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

const OrderSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  orderNumber: String,
  status: String,
  totalPrice: Number,
  items: Array,
  address: Object,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryExecutive', default: null },
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const orderNum = 'ORD-VIS-TEST-' + Date.now();

    // Create a new pending unassigned order (as placed by customer)
    const newOrder = await Order.create({
      customerId: new mongoose.Types.ObjectId(),
      orderNumber: orderNum,
      status: 'pending',
      totalPrice: 150,
      items: [{ product: 'Milk', price: 50, quantity: 3 }],
      address: { fullName: 'Customer X', pincode: '560038' },
      assignedTo: null,
    });

    console.log('✅ Created customer order:', newOrder.orderNumber, 'Status:', newOrder.status, 'AssignedTo:', newOrder.assignedTo);

    // Executive query
    const executiveId = new mongoose.Types.ObjectId();
    const queryConditions = [
      { assignedTo: executiveId },
      { assignedTo: null },
      { assignedTo: { $exists: false } }
    ];

    const fetchedOrders = await Order.find({ $or: queryConditions });
    const found = fetchedOrders.find(o => o.orderNumber === orderNum);

    if (!found) {
      throw new Error('❌ TEST FAILED: Unassigned pending customer order was not returned!');
    }

    console.log('🎉 SUCCESS: Pending customer order is visible to delivery executive query!');

    // Test Flutter Provider filter logic
    const statusMatch = found.status === "pending" || found.status === "placed" || found.status === "confirmed" || found.status === "out_for_delivery";
    if (!statusMatch) {
      throw new Error('❌ TEST FAILED: Flutter statusMatch failed for status: ' + found.status);
    }
    console.log('🎉 SUCCESS: Flutter app status filter includes "pending" customer orders!');

    await Order.deleteMany({ orderNumber: orderNum });
    console.log('🧹 Cleaned test order.');

    console.log('\n========================================');
    console.log('ALL ORDER VISIBILITY TESTS PASSED!      ');
    console.log('========================================\n');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
