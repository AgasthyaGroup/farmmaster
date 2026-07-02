import mongoose, { Schema } from 'mongoose';

const GrassManagementSchema = new Schema(
  {
    name: { type: String, required: true },
    sourcingTo: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    location: { type: String, required: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: true },
    notes: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.GrassManagement || mongoose.model('GrassManagement', GrassManagementSchema);
