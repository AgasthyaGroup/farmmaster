import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Shared Utility ───────────────────────────────────────────────────────────

export function safeDateParse(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '-') return null;
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'number' && isFinite(value)) {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

// ─── Asynchronous tag_id Foreign-Key Validator ──────────────────────────────────

async function validateLiveStockTag(this: any, value: string): Promise<boolean> {
  if (!value) return false;
  try {
    const cleanTag = String(value).trim().toUpperCase();
    const LiveStock = mongoose.model('LiveStock');
    const animal = await LiveStock.findOne({ tag_id: cleanTag, status: 'ACTIVE', isDeleted: false });
    return !!animal;
  } catch (error) {
    console.error('validateLiveStockTag validation error:', error);
    return false;
  }
}

// ─── CROSSING LOG ─────────────────────────────────────────────────────────────

export interface ICrossingLog extends Document {
  tag_id: string;
  tag?: string;
  maleTag?: string;
  crossingDate?: Date;
  crossingAttemptNumber?: number;
  pdDate?: Date;
  pregnancyStatus?: string;
  pregnancyConfirmedDate?: Date;
  estimatedCalvingDate?: Date;
  pregnantAge?: string;
  actualCalvingDate?: Date;
  calfTag?: string;
  breedType?: string;
  heatMonitoring1stNotification?: Date;
  heatMonitoring2ndNotification?: Date;
  remarks?: string;
  farmId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const CrossingLogSchema = new Schema<ICrossingLog>(
  {
    tag_id: {
      type: String,
      required: [true, 'tag_id is required — every crossing log must reference an active livestock tag'],
      trim: true,
      uppercase: true,
      index: true,
      validate: {
        validator: validateLiveStockTag,
        message: 'Validation failed: Animal with Tag ID {VALUE} does not exist in active Live Stock.',
      },
    },
    tag: { type: String, trim: true, default: '' },
    maleTag: { type: String, trim: true, default: null },
    crossingDate: { type: Date, default: null, set: safeDateParse },
    crossingAttemptNumber: { type: Number, default: null, min: 0 },
    pdDate: { type: Date, default: null, set: safeDateParse },
    pregnancyStatus: {
      type: String,
      trim: true,
      enum: {
        values: ['Positive', 'Negative', 'Pending', '', null],
        message: 'pregnancyStatus must be Positive, Negative, or Pending',
      },
      default: null,
    },
    pregnancyConfirmedDate: { type: Date, default: null, set: safeDateParse },
    estimatedCalvingDate: { type: Date, default: null, set: safeDateParse },
    pregnantAge: { type: String, trim: true, default: null },
    actualCalvingDate: { type: Date, default: null, set: safeDateParse },
    calfTag: { type: String, trim: true, default: null },
    breedType: { type: String, trim: true, default: null },
    heatMonitoring1stNotification: { type: Date, default: null, set: safeDateParse },
    heatMonitoring2ndNotification: { type: Date, default: null, set: safeDateParse },
    remarks: { type: String, trim: true, default: '' },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', index: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, strict: false }
);

CrossingLogSchema.index({ farmId: 1, tag_id: 1 });

// ─── SALE LOG ─────────────────────────────────────────────────────────────────

export interface ISaleLog extends Document {
  tag_id: string;
  buyerName?: string;
  buyerPhone?: string;
  salePrice?: number;
  remarks?: string;
  date?: Date;
  farmId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const SaleLogSchema = new Schema<ISaleLog>(
  {
    tag_id: {
      type: String,
      required: [true, 'tag_id is required — every sale log must reference an active livestock tag'],
      trim: true,
      uppercase: true,
      index: true,
      validate: {
        validator: validateLiveStockTag,
        message: 'Validation failed: Animal with Tag ID {VALUE} does not exist in active Live Stock.',
      },
    },
    buyerName: { type: String, trim: true, default: '' },
    buyerPhone: { type: String, trim: true, default: '' },
    salePrice: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now, set: safeDateParse },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', index: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

SaleLogSchema.index({ farmId: 1, tag_id: 1 });

// ─── TREATMENT LOG ────────────────────────────────────────────────────────────

export interface ITreatmentLog extends Document {
  tag_id: string;
  tagId?: string;
  diagnosis?: string;
  treatmentDetails?: string;
  medicinesUsed?: string;
  startDate?: Date;
  endDate?: Date;
  administeredBy?: string;
  status?: string;
  cost?: number;
  remarks?: string;
  farmId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
}

const TreatmentLogSchema = new Schema<ITreatmentLog>(
  {
    tag_id: {
      type: String,
      required: [true, 'tag_id is required — every treatment log must reference an active livestock tag'],
      trim: true,
      uppercase: true,
      index: true,
      validate: {
        validator: validateLiveStockTag,
        message: 'Validation failed: Animal with Tag ID {VALUE} does not exist in active Live Stock.',
      },
    },
    tagId: { type: String, trim: true, default: '' },
    diagnosis: { type: String, trim: true, default: '' },
    treatmentDetails: { type: String, trim: true, default: '' },
    medicinesUsed: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null, set: safeDateParse },
    endDate: { type: Date, default: null, set: safeDateParse },
    administeredBy: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: '' },
    cost: { type: Number, default: 0, min: 0 },
    remarks: { type: String, trim: true, default: '' },
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', index: true, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

TreatmentLogSchema.index({ farmId: 1, tag_id: 1 });

TreatmentLogSchema.pre('validate', function (this: any) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
      this.invalidate('endDate', 'Treatment validation failed: endDate cannot be chronologically before startDate.');
    }
  }
});

// ─── Export Compiled Models ─────────────────────────────────────────────────────

export const CrossingLog: Model<ICrossingLog> =
  mongoose.models.CrossingLog || mongoose.model<ICrossingLog>('CrossingLog', CrossingLogSchema);

export const SaleLog: Model<ISaleLog> =
  mongoose.models.SaleLog || mongoose.model<ISaleLog>('SaleLog', SaleLogSchema);

export const TreatmentLog: Model<ITreatmentLog> =
  mongoose.models.TreatmentLog || mongoose.model<ITreatmentLog>('TreatmentLog', TreatmentLogSchema);
