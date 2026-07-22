import mongoose, { Schema } from 'mongoose';

const ProductInventorySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.ProductInventory) {
  delete mongoose.models.ProductInventory;
}

export default mongoose.model('ProductInventory', ProductInventorySchema);
