import mongoose, { Schema } from 'mongoose';

const AnimalSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '', trim: true },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Animal || mongoose.model('Animal', AnimalSchema);
