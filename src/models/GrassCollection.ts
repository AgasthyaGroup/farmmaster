import mongoose, { Schema } from 'mongoose';

const GrassCollectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    farmId: { type: Schema.Types.Mixed, ref: 'Farm', required: false },
    sourcingFarmId: { type: Schema.Types.ObjectId, ref: 'GrassManagement', required: false },
    noOfLoads: { type: Number, required: true, default: 0 },
    weight: { type: Number, required: true, default: 0 },
    procuredBy: { type: String, required: false },
    session: { type: String, enum: ['Morning', 'Evening'], required: false },
    noOfWorkers: { type: Number, required: false, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.GrassCollection || mongoose.model('GrassCollection', GrassCollectionSchema);