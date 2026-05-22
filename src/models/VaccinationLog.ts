import mongoose, { Schema } from 'mongoose';

const VaccinationLogSchema = new Schema(
  {
    tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    date: { type: Date, required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    animalId: { type: Schema.Types.ObjectId, ref: 'Cattle', required: true },
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
