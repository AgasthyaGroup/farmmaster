import mongoose, { Schema, Document } from 'mongoose';

export interface IDesignation extends Document {
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>(
  {
    name: {
      type: String,
      required: [true, 'Designation name is required'],
      unique: true,
      trim: true,
    },
    description: {
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

export default mongoose.models.Designation || mongoose.model<IDesignation>('Designation', DesignationSchema);
