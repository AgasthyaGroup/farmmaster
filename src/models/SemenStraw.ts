import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISemenStraw extends Document {
  batchNo: string;
  breed: string;
  noOfStraws: number;
  usedStraws: number;
  purchaseDate: Date;
  expiryDate?: Date | null;
  price: number;
  farmId: mongoose.Types.ObjectId | null;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SemenStrawSchema = new Schema<ISemenStraw>(
  {
    batchNo: {
      type: String,
      required: [true, 'Batch number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
      trim: true,
    },
    noOfStraws: {
      type: Number,
      required: [true, 'Number of straws is required'],
      min: [0, 'Number of straws cannot be negative'],
    },
    usedStraws: {
      type: Number,
      default: 0,
      min: [0, 'Used straws cannot be negative'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

SemenStrawSchema.index({ farmId: 1, batchNo: 1 }, { unique: true });

const SemenStraw: Model<ISemenStraw> =
  mongoose.models.SemenStraw || mongoose.model<ISemenStraw>('SemenStraw', SemenStrawSchema);

export default SemenStraw;
