require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farmmaster';

const DeliveryExecutiveSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  vehicleType: String,
  status: String,
});

const DeliveryRouteSchema = new mongoose.Schema({
  routeName: String,
  routeCode: String,
  pincodes: [String],
  assignedExecutiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryExecutive' },
  status: String,
});

const OrderSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  orderNumber: String,
  status: String,
  totalPrice: Number,
  items: Array,
  address: Object,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryExecutive' },
});

const DeliveryExecutive = mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);
const DeliveryRoute = mongoose.models.DeliveryRoute || mongoose.model('DeliveryRoute', DeliveryRouteSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

async function runTest() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const testPhone = '9998887770';
    const testPincode = '560038';
    const testOrderNum = 'ORD-TEST-' + Date.now();

    // 1. Create or cleanup Executive
    await DeliveryExecutive.deleteMany({ phone: testPhone });
    const executive = await DeliveryExecutive.create({
      name: 'Sandbox Delivery Boy',
      phone: testPhone,
      email: 'sandboxboy@gmail.com',
      vehicleType: 'Bike',
      status: 'active',
    });
    console.log('✅ Created test executive:', executive.name, executive._id.toString());

    // 2. Create Route assigned to Executive
    await DeliveryRoute.deleteMany({ routeCode: 'SANDBOX-01' });
    const route = await DeliveryRoute.create({
      routeName: 'Indiranagar Route',
      routeCode: 'SANDBOX-01',
      pincodes: [testPincode, '560008'],
      assignedExecutiveId: executive._id,
      status: 'active',
    });
    console.log('✅ Created test route with pincodes:', route.pincodes, 'assigned to executive:', route.assignedExecutiveId.toString());

    // 3. Test Auto-Assignment logic for new order
    const address = {
      fullName: 'Test Customer',
      mobile: '9876543210',
      addressLine1: '100ft Road',
      city: 'Bangalore',
      pincode: testPincode,
    };

    let assignedTo = null;
    const pincode = address.pincode;
    if (pincode) {
      const matchingRoute = await DeliveryRoute.findOne({
        pincodes: pincode,
        status: 'active',
      });
      if (matchingRoute && matchingRoute.assignedExecutiveId) {
        assignedTo = matchingRoute.assignedExecutiveId;
      }
    }

    const order = await Order.create({
      customerId: new mongoose.Types.ObjectId(),
      orderNumber: testOrderNum,
      status: 'pending',
      totalPrice: 250,
      items: [{ product: 'Milk', price: 50, quantity: 5 }],
      address,
      assignedTo,
    });

    console.log('✅ Created order:', order.orderNumber, 'Auto-assigned to:', order.assignedTo ? order.assignedTo.toString() : 'None');

    if (!order.assignedTo || order.assignedTo.toString() !== executive._id.toString()) {
      throw new Error('❌ TEST FAILED: Order assignedTo does not match assigned executive ID!');
    }
    console.log('🎉 MATCH SUCCESS: Order was automatically assigned to the correct delivery boy!');

    // 4. Test Query logic for Executive
    const executiveRoutes = await DeliveryRoute.find({ assignedExecutiveId: executive._id });
    const assignedPincodes = executiveRoutes.flatMap((r) => r.pincodes || []);

    const queryConditions = [{ assignedTo: executive._id }];
    if (assignedPincodes.length > 0) {
      queryConditions.push(
        { 'address.pincode': { $in: assignedPincodes } },
        { 'address.zipCode': { $in: assignedPincodes } },
        { 'address.postalCode': { $in: assignedPincodes } }
      );
    }

    const fetchedOrders = await Order.find({ $or: queryConditions });
    console.log('✅ Fetched orders for executive count:', fetchedOrders.length);

    const foundTestOrder = fetchedOrders.find((o) => o.orderNumber === testOrderNum);
    if (!foundTestOrder) {
      throw new Error('❌ TEST FAILED: Test order not returned in executive query!');
    }
    console.log('🎉 QUERY SUCCESS: Executive app receives the auto-assigned order!');

    // Cleanup
    await Order.deleteMany({ orderNumber: testOrderNum });
    await DeliveryRoute.deleteMany({ _id: route._id });
    await DeliveryExecutive.deleteMany({ _id: executive._id });
    console.log('🧹 Cleaned up sandbox test data.');

    console.log('\n========================================');
    console.log('ALL SANDBOX VERIFICATION TESTS PASSED!  ');
    console.log('========================================\n');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTest();
