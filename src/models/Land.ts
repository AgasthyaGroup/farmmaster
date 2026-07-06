import mongoose, { Schema } from 'mongoose';

const LandSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    totalArea: { type: Number, required: true },
    unit: { type: String, enum: ['Acres', 'Hectares', 'Sq Meters'], default: 'Acres' },
    status: { type: String, enum: ['AVAILABLE', 'LEASED', 'MAINTENANCE'], default: 'AVAILABLE' },
    location: { type: String }, // Coordinates or description
    description: { type: String },
    ownershipType: { type: String, enum: ['OWNED', 'LEASED'], default: 'OWNED' },
    lastRegrownAt: { type: Date, default: null, required: false },

    // Lease information (embedded for clean, performant management)
    landownerName: { type: String, default: '' },
    landownerPhone: { type: String, default: '' },
    leaseStartDate: { type: Date },
    leaseEndDate: { type: Date },
    rentAmount: { type: Number, default: 0 },
    paymentInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LandSchema.index({ farmId: 1, code: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Land) {
  delete mongoose.models.Land;
}

export default mongoose.models.Land || mongoose.model('Land', LandSchema);
