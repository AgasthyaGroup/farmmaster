import mongoose, { Schema } from 'mongoose';

const DepartmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
