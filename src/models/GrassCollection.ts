import mongoose, { Schema } from 'mongoose';

const GrassCollectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    farmId: { type: String, required: true },
    noOfLoads: { type: Number, required: true, default: 0 },
    weight: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.GrassCollection || mongoose.model('GrassCollection', GrassCollectionSchema);
