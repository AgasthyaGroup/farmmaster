import mongoose, { Schema } from 'mongoose';

const ProcurementResourceSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['CENTER', 'AGENT', 'VENDOR', 'COOPERATIVE', 'DIRECT_SUPPLIER'], 
      default: 'VENDOR' 
    },
    phone: { type: String },
    address: { type: String },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE'], 
      default: 'ACTIVE' 
    },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProcurementResourceSchema.index({ farmId: 1, code: 1 }, { unique: true });

if (mongoose.models && mongoose.models.ProcurementResource) {
  delete mongoose.models.ProcurementResource;
}

export default mongoose.models.ProcurementResource || mongoose.model('ProcurementResource', ProcurementResourceSchema);
