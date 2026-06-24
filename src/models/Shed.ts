import mongoose, { Schema } from 'mongoose';

const ShedSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    lines: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    remarks: { type: String },
    lineManagement: { type: String, enum: ['Yes', 'No'], default: 'No' },
    milking: { type: String, enum: ['Yes', 'No'], default: 'No' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ShedSchema.index({ farmId: 1, code: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Shed) {
  delete mongoose.models.Shed;
}

export default mongoose.models.Shed || mongoose.model('Shed', ShedSchema);
