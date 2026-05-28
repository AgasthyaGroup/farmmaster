import mongoose, { Schema } from 'mongoose';

const CrossingLogSchema = new Schema(
  {
    tag: { type: String, required: true },
    maleTag: { type: String, required: false },
    crossingDate: { type: Date, required: false },
    crossingAttemptNumber: { type: Number, required: false },
    'PD date': { type: Date, required: false },
    'pregnancy status': { type: String, required: false },
    'pregnancy confirmed date': { type: Date, required: false },
    'estimated calving date': { type: Date, required: false },
    'Pregnant age': { type: String, required: false },
    'actual calving date': { type: Date, required: false },
    'calf tag': { type: String, required: false },
    remarks: { type: String, required: false },
    breedType: { type: String, required: false },
    'heat monitoring 1st notification': { type: Date, required: false },
    'heat monitoring 2nd notification': { type: Date, required: false },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.CrossingLog || mongoose.model('CrossingLog', CrossingLogSchema);
