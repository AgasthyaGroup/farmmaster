import mongoose, { Schema } from 'mongoose';

const MilkProcurementSchema = new Schema(
  {
    date: { type: Date, required: true },
    procuredFrom: { type: String, required: true, trim: true },
    liters: { type: Number, required: true, default: 0 },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

MilkProcurementSchema.index({ farmId: 1, date: -1 });

export default mongoose.models.MilkProcurement || mongoose.model('MilkProcurement', MilkProcurementSchema);
