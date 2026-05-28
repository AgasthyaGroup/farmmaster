import mongoose, { Schema } from 'mongoose';

const TreatmentLogSchema = new Schema(
  {
    tagId: { type: String, required: true },
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    animalId: { type: String, required: true },
    symptoms: { type: String, required: false },
    doctor: { type: String, required: false },
    cost: { type: Number, required: false, default: 0 },
    healthStatus: { type: String, required: false },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.TreatmentLog || mongoose.model('TreatmentLog', TreatmentLogSchema);
