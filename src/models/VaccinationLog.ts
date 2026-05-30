import mongoose, { Schema } from 'mongoose';

/**
 * VaccinationLog
 *
 * Stores per-animal vaccination events. The canonical livestock tag is stored
 * as both `tagId` (legacy field kept for backward compatibility) and `tag_id`
 * (the unified relational key used across all modules). Both fields are indexed.
 *
 * `animalId` mirrors `tag_id` and is kept for frontend display compatibility.
 */
const VaccinationLogSchema = new Schema(
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
    // Legacy alias kept for backward compatibility with frontend forms
    tagId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    // Animal display identifier (mirrors tag_id)
    animalId: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    vaccinationName: { type: String, required: true },
    batchNo: { type: String, required: true },
    manufactureDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    treatmentOrStatus: { type: String, required: false },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient per-farm, per-animal lookups
VaccinationLogSchema.index({ farmId: 1, tag_id: 1 });
VaccinationLogSchema.index({ farmId: 1, tagId: 1 });

// Pre-save hook: keep tag_id and tagId in sync so both fields are always populated
VaccinationLogSchema.pre('save', function (this: any) {
  if (this.tagId && !this.tag_id) {
    this.tag_id = String(this.tagId).trim().toUpperCase();
  }
  if (this.tag_id && !this.tagId) {
    this.tagId = String(this.tag_id).trim().toUpperCase();
  }
  if (this.tag_id && !this.animalId) {
    this.animalId = this.tag_id;
  }
});

export default mongoose.models.VaccinationLog || mongoose.model('VaccinationLog', VaccinationLogSchema);
