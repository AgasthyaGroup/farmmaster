import mongoose, { Schema } from 'mongoose';

const TreatmentLogSchema = new Schema(
  {
    tagId: { type: String, required: true },
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    animalId: { type: String, required: true },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    treatment: { type: String, required: true },
    healthStatus: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.TreatmentLog || mongoose.model('TreatmentLog', TreatmentLogSchema);
