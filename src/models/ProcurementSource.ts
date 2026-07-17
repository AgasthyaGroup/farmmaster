import mongoose, { Schema } from 'mongoose';

const ProcurementSourceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, default: '', trim: true },
    location: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    status: { type: Boolean, default: true },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ProcurementSourceSchema.index({ farmId: 1, name: 1 });

if (mongoose.models.ProcurementSource) {
  delete mongoose.models.ProcurementSource;
}

export default mongoose.model('ProcurementSource', ProcurementSourceSchema);
