import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
});

const SubcategorySchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
});

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
    category: { type: CategorySchema, required: true },
    subcategory: { type: SubcategorySchema, required: true },
  },
  { timestamps: true }
);

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export default mongoose.model('Product', ProductSchema);
