import mongoose, { Schema } from 'mongoose';

const FarmSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: { type: String },
    location: { type: String }, // Geo or Text
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete
  },
  { timestamps: true }
);

export default mongoose.models.Farm || mongoose.model('Farm', FarmSchema);
