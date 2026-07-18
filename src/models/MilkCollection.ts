import mongoose, { Schema } from 'mongoose';

/**
 * MilkCollection
 *
 * Records per-session (MORNING / EVENING) milk yields per animal.
 * The unified relational key `tag_id` is added alongside the legacy `tagId`
 * field. Both are indexed. A pre-save hook keeps them in sync.
 */
const MilkCollectionSchema = new Schema(
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
    date: { type: Date, required: true },
    shedId: { type: String, required: true },
    session: { type: String, enum: ['MORNING', 'EVENING'], required: true },
    quantity: { type: Number, required: true, default: 0 },
    selfConsumption: { type: Number, required: true, default: 0 },
    dayTotal: { type: Number, required: true, default: 0 },
    lineNo: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound indexes for efficient farm + animal queries
MilkCollectionSchema.index({ farmId: 1, tag_id: 1 });
MilkCollectionSchema.index({ farmId: 1, tagId: 1 });
MilkCollectionSchema.index({ farmId: 1, date: -1 });

// Pre-save hook: sync tag_id ↔ tagId so both are always populated
MilkCollectionSchema.pre('save', function (this: any) {
  if (this.tagId && !this.tag_id) {
    this.tag_id = String(this.tagId).trim().toUpperCase();
  }
  if (this.tag_id && !this.tagId) {
    this.tagId = String(this.tag_id).trim().toUpperCase();
  }
});

export default mongoose.models.MilkCollection || mongoose.model('MilkCollection', MilkCollectionSchema);
