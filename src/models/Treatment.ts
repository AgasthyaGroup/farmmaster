import mongoose, { Schema } from 'mongoose';

const TreatmentSchema = new Schema(
  {
    symptoms: { type: String, required: true, trim: true },
    diagnosis: { type: String, default: '', trim: true },
    treatment: { type: String, required: true, trim: true },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Treatment || mongoose.model('Treatment', TreatmentSchema);
