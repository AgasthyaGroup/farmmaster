import mongoose, { Schema } from 'mongoose';

const MilkCollectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    session: { type: String, enum: ['MORNING', 'EVENING'], required: true },
    quantity: { type: Number, required: true, default: 0 },
    selfConsumption: { type: Number, required: true, default: 0 },
    dayTotal: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MilkCollection || mongoose.model('MilkCollection', MilkCollectionSchema);
