import mongoose, { Schema } from 'mongoose';

const BMCSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    capacity: { type: Number, required: true }, // in Liters
    currentVolume: { type: Number, default: 0 }, // in Liters
    temperature: { type: Number }, // in Celsius
    location: { type: String }, // Facility or shed where cooler is located
    status: { 
      type: String, 
      enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE'], 
      default: 'ACTIVE' 
    },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BMCSchema.index({ farmId: 1, code: 1 }, { unique: true });

if (mongoose.models && mongoose.models.BMC) {
  delete mongoose.models.BMC;
}

export default mongoose.models.BMC || mongoose.model('BMC', BMCSchema);
