import mongoose, { Schema } from 'mongoose';

const FeedItemSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: Boolean, default: true },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.FeedItem || mongoose.model('FeedItem', FeedItemSchema);
