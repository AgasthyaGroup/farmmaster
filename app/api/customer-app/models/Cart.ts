import mongoose, { Schema } from 'mongoose';

const CartItemSchema = new Schema({
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  price: { type: Number, default: 0 },
  addedAt: { type: Date, default: Date.now }
});

const CartSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

if (mongoose.models.Cart) {
  delete mongoose.models.Cart;
}

export default mongoose.model('Cart', CartSchema);
