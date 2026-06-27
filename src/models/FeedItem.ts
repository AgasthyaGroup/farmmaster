import mongoose, { Schema } from 'mongoose';

const FeedItemSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    status: { type: Boolean, default: true },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

if (mongoose.models.FeedItem) {
  delete mongoose.models.FeedItem;
}

export default mongoose.model('FeedItem', FeedItemSchema);
