import mongoose, { Schema } from 'mongoose';

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, default: '', trim: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Role || mongoose.model('Role', RoleSchema);
