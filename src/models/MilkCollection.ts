import mongoose, { Schema } from 'mongoose';

const MilkCollectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    tagId: { type: String, required: true },
    session: { type: String, enum: ['MORNING', 'EVENING'], required: true },
    quantity: { type: Number, required: true, default: 0 },
    selfConsumption: { type: Number, required: true, default: 0 },
    dayTotal: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MilkCollection || mongoose.model('MilkCollection', MilkCollectionSchema);
