import mongoose, { Schema } from 'mongoose';

const MilkQualitySchema = new Schema(
  {
    date: { type: Date, required: true },
    fat: { type: Number, required: true, default: 0 },
    snf: { type: Number, required: true, default: 0 },
    density: { type: Number, required: true, default: 0 },
    water: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MilkQuality || mongoose.model('MilkQuality', MilkQualitySchema);
