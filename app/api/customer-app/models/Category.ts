import mongoose, { Schema } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    image: { type: String, default: '' },
    volume: { type: String, default: '' },
    price: { type: Number, default: 0 },
    description: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    status: { type: String, default: 'inactive' },
  },
  { timestamps: true }
);

if (mongoose.models.Category) {
  delete mongoose.models.Category;
}

export default mongoose.model('Category', CategorySchema);
