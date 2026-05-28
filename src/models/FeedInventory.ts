import mongoose, { Schema } from 'mongoose';

const FeedInventorySchema = new Schema(
  {
    feedType: { type: String, required: true },
    oldStock: { type: Number, required: true, default: 0 },
    bought: { type: Number, required: true, default: 0 },
    usage: { type: Number, required: true, default: 0 },
    remainingStock: { type: Number, required: true, default: 0 },
    purchaseDate: { type: Date, required: false },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.FeedInventory || mongoose.model('FeedInventory', FeedInventorySchema);
