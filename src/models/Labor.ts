import mongoose, { Schema, Document } from 'mongoose';

export interface ILabor extends Document {
  name: string;
  designationId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LaborSchema = new Schema<ILabor>(
  {
    name: {
      type: String,
      required: [true, 'Labor name is required'],
      trim: true,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation is required'],
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Associated Farm is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Labor || mongoose.model<ILabor>('Labor', LaborSchema);
