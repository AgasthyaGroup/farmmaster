import mongoose, { Schema } from 'mongoose';

const DailyFeedingSchema = new Schema(
  {
    date: { type: Date, required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    animalId: { type: Schema.Types.ObjectId, ref: 'Cattle', required: false },
    greenGrass: { type: Number, required: false, default: 0 },
    dryGrass: { type: Number, required: false, default: 0 },
    cottonCake: { type: Number, required: false, default: 0 },
    chunni: { type: Number, required: false, default: 0 },
    maize: { type: Number, required: false, default: 0 },
    wheatBran: { type: Number, required: false, default: 0 },
    salt: { type: Number, required: false, default: 0 },
    oralCalcium: { type: Number, required: false, default: 0 },
    mineralMixture: { type: Number, required: false, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.DailyFeeding || mongoose.model('DailyFeeding', DailyFeedingSchema);
