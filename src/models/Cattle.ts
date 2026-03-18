import mongoose, { Schema } from 'mongoose';

const CattleSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    type: { type: String, enum: ['COW', 'BUFFALO', 'CALF'], required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Cattle || mongoose.model('Cattle', CattleSchema);
