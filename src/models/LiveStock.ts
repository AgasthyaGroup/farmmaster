import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILiveStock extends Document {
  tag_id: string;
  animalType: string;
  breed?: string;
  age?: string;
  shedId?: any; // Loose type to support both ObjectId and raw string formats
  status: string;
  farmId?: any; // Loose type to support both ObjectId and raw string formats
  name?: string;
  code?: string;
  date?: Date;
  gender?: string;
  dateOfBirth?: Date;
  dameId?: string;
  dameBreed?: string;
  sireId?: string;
  sireBreed?: string;
  calvings?: number;
  farmBorn?: string;
  color?: string;
  production?: number;
  milkCollection?: number;
  weight?: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  purchaseFrom?: string;
  purchaseBy?: string;
  purchaseRemarks?: string;
  remarks?: string;
  isPendingDetails?: boolean;
  onboardingType?: string;
  isDeleted: boolean;
  lineNo?: number;
  position?: number;
}

const LiveStockSchema = new Schema<ILiveStock>(
  {
    tag_id: {
      type: String,
      required: [true, 'Tag ID is required — every animal must have a unique identifier'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    animalType: {
      type: String,
      required: [true, 'Animal Type (e.g., COW, BUFFALO) is required'],
      trim: true,
      uppercase: true,
    },
    breed: { type: String, trim: true, default: '' },
    age: { type: String, trim: true, default: '' },

    // Loose Mixed reference fields to gracefully handle both ObjectIds and legacy string/name formats
    shedId: { type: Schema.Types.Mixed, index: true, default: null },
    farmId: { type: Schema.Types.Mixed, index: true, default: null },
    lineNo: { type: Number, default: 0 },
    position: { type: Number, default: 0 },

    status: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: {
        values: ['ACTIVE', 'PREGNANT', 'EMPTY', 'PENDING', 'SOLD', 'DECEASED'],
        message: 'Status must be ACTIVE, PREGNANT, EMPTY, PENDING, SOLD, or DECEASED',
      },
      default: 'ACTIVE',
    },
    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    date: { type: Date, default: null },
    gender: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    dameId: { type: String, trim: true, default: '' },
    dameBreed: { type: String, trim: true, default: '' },
    sireId: { type: String, trim: true, default: '' },
    sireBreed: { type: String, trim: true, default: '' },
    calvings: { type: Number, default: 0 },
    farmBorn: { type: String, default: 'No' },
    color: { type: String, trim: true, default: '' },
    production: { type: Number, default: 0 },
    milkCollection: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    purchaseDate: { type: Date, default: null },
    purchasePrice: { type: Number, default: 0 },
    purchaseFrom: { type: String, trim: true, default: '' },
    purchaseBy: { type: String, trim: true, default: '' },
    purchaseRemarks: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    isPendingDetails: { type: Boolean, default: false, index: true },
    onboardingType: { type: String, default: 'PURCHASE', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

LiveStockSchema.index({ farmId: 1, tag_id: 1 }, { unique: true });

export default mongoose.models.LiveStock || mongoose.model<ILiveStock>('LiveStock', LiveStockSchema);
