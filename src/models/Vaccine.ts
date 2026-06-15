import mongoose, { Schema } from 'mongoose';
import { safeDateParse } from './Logs';

const VaccineSchema = new Schema(
  {
    vaccinationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    manufactureDate: { type: Date, required: true, set: safeDateParse },
    expiryDate: { type: Date, required: true, set: safeDateParse },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

VaccineSchema.index({ farmId: 1 });

export default mongoose.models.Vaccine || mongoose.model('Vaccine', VaccineSchema);
