import mongoose, { Schema } from 'mongoose';

const MilkQualitySchema = new Schema(
  {
    date: { type: Date, required: true },
    fat: { type: Number, required: true, default: 0 },
    snf: { type: Number, required: true, default: 0 },
    density: { type: Number, required: true, default: 0 },
    water: { type: Number, required: true, default: 0 },
    indentLiters: { type: Number, default: 0 },
    temperature: { type: Number, default: 0 },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
    bmcs: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.MilkQuality || mongoose.model('MilkQuality', MilkQualitySchema);
