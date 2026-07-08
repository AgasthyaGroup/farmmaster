import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICattle extends Document {
  farmId?: any; // Loose type to support both ObjectId and raw string/code formats
  name?: string;
  code?: string;
  date?: Date;
  tag: string;
  cattleType: string;
  shed: string;
  lineNo?: number;
  position?: number;
  status: string;
  isDeleted: boolean;
  breed?: string;
  gender?: string;
  dateOfBirth?: Date;
  age?: string;
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
}

const CattleSchema = new Schema<ICattle>(
  {
    // Loose reference field to support legacy string codes or raw hex ObjectIds gracefully
    farmId: { type: Schema.Types.Mixed, ref: 'Farm', index: true, default: null },

    name: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    date: { type: Date, default: null },
    tag: { type: String, required: [true, 'Tag ID is required'], trim: true, uppercase: true },
    cattleType: { type: String, required: [true, 'Cattle Type is required'], trim: true, uppercase: true },
    shed: { type: String, required: [true, 'Shed Number/Name is required'], trim: true },
    lineNo: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    status: { type: String, default: 'ACTIVE', trim: true, uppercase: true },
    isDeleted: { type: Boolean, default: false, index: true },
    breed: { type: String, trim: true, default: '' },
    gender: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    age: { type: String, trim: true, default: '' },
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
  },
  { timestamps: true }
);

CattleSchema.index({ farmId: 1, tag: 1 }, { unique: true });

CattleSchema.pre('save', function (next) {
  if (String(this.gender).toUpperCase() === 'MALE') {
    this.calvings = 0;
  }
  next();
});

CattleSchema.pre('findOneAndUpdate', function (next) {
  const update: any = this.getUpdate();
  if (update) {
    if (update.gender && String(update.gender).toUpperCase() === 'MALE') {
      update.calvings = 0;
    } else if (update.$set && update.$set.gender && String(update.$set.gender).toUpperCase() === 'MALE') {
      update.$set.calvings = 0;
    }
  }
  next();
});

export default mongoose.models.Cattle || mongoose.model<ICattle>('Cattle', CattleSchema);
