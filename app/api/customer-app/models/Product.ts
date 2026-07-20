import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    size: { type: String, default: '' },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    status: { type: String, default: 'inactive' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    categoryCode: { type: String, required: true },
  },
  { timestamps: true }
);

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default mongoose.model('Product', ProductSchema);
