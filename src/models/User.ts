import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'],
      required: true,
      default: 'SUPER_ADMIN', // Usually for the first user
    },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', default: null },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
