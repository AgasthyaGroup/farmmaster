import mongoose, { Schema } from 'mongoose';

const VaccinationLogSchema = new Schema(
  {
    tagId: { type: String, required: true },
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    animalId: { type: String, required: true },
    vaccinationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    treatmentOrStatus: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.VaccinationLog || mongoose.model('VaccinationLog', VaccinationLogSchema);
