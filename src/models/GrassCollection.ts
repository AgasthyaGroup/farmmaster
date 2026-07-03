import mongoose, { Schema } from 'mongoose';

const GrassCollectionSchema = new Schema(
  {
    date: { type: Date, required: true },
    farmId: { type: Schema.Types.Mixed, ref: 'Farm', required: false },
    sourcingFarmId: { type: Schema.Types.ObjectId, ref: 'GrassManagement', required: false },
    noOfLoads: { type: Number, required: true, min: [1, 'Number of loads must be greater than zero'] },
    weight: { type: Number, required: true, min: [1, 'Weight must be greater than zero'] },
    procuredBy: { type: String, required: false },
    session: { type: String, enum: ['Morning', 'Evening'], required: false },
    noOfWorkers: { type: Number, required: false, min: [1, 'Number of workers must be greater than zero'], default: 1 },
    laborId: { type: Schema.Types.ObjectId, ref: 'Labor', required: false },
    harvestedArea: { type: Number, required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.GrassCollection || mongoose.model('GrassCollection', GrassCollectionSchema);