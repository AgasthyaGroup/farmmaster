import mongoose, { Schema } from 'mongoose';

const OrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    orderNumber: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' }, // 'pending', 'confirmed', 'out_for_delivery', 'delivered', 'customer_unavailable', 'cancelled'
    totalPrice: { type: Number, default: 0 },
    items: [OrderItemSchema],
    address: { type: Object },
    paymentStatus: { type: String, default: 'pending' }, // 'pending', 'paid'
    paymentMethod: { type: String, default: 'COD' }, // 'COD', 'Online'
    assignedTo: { type: Schema.Types.ObjectId, ref: 'DeliveryExecutive', default: null },
    reason: { type: String, default: '' },
    comment: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
