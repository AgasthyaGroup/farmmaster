import mongoose, { Schema } from 'mongoose';

const TagSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['COW', 'BUFFALO', 'CALF'], required: true },
    status: { type: String, enum: ['AVAILABLE', 'ASSIGNED'], default: 'AVAILABLE' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model('Tag', TagSchema);
