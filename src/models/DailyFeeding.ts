import mongoose, { Schema } from 'mongoose';

/**
 * DailyFeeding
 *
 * Records per-animal/per-shed daily feed quantities.
 * Adds the unified `tag_id` relational key alongside the existing `animalId`
 * field. A pre-save hook keeps them in sync for zero-downtime backward compat.
 */
const DailyFeedingSchema = new Schema(
  {
    // Unified relational key — matches LiveStock.tag_id
    tag_id: {
      type: String,
      required: false,
      trim: true,
      uppercase: true,
      index: true,
      default: '',
    },
    // Legacy identifier (kept for backward compatibility)
    animalId: { type: String, required: false, trim: true, index: true },
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    greenGrass: { type: Number, required: false, default: 0 },
    dryGrass: { type: Number, required: false, default: 0 },
    cottonCake: { type: Number, required: false, default: 0 },
    chunni: { type: Number, required: false, default: 0 },
    maize: { type: Number, required: false, default: 0 },
    wheatBran: { type: Number, required: false, default: 0 },
    salt: { type: Number, required: false, default: 0 },
    oralCalcium: { type: Number, required: false, default: 0 },
    mineralMixture: { type: Number, required: false, default: 0 },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for per-farm, per-animal, per-date queries
DailyFeedingSchema.index({ farmId: 1, tag_id: 1 });
DailyFeedingSchema.index({ farmId: 1, date: -1 });

// Pre-save hook: sync tag_id ↔ animalId so both are always populated
DailyFeedingSchema.pre('save', function (this: any) {
  if (this.animalId && !this.tag_id) {
    this.tag_id = String(this.animalId).trim().toUpperCase();
  }
  if (this.tag_id && !this.animalId) {
    this.animalId = this.tag_id;
  }
});

export default mongoose.models.DailyFeeding || mongoose.model('DailyFeeding', DailyFeedingSchema);
