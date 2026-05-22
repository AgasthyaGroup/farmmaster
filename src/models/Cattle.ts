import mongoose, { Schema } from 'mongoose';

const CattleSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    date: { type: Date, required: false },
    tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    type: { type: String, enum: ['COW', 'COW_CALF', 'BUFFALO', 'BUFFALO_CALF'], required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    lineNo: { type: Number, required: false },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    breed: { type: String, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    dateOfBirth: { type: Date, required: false },
    age: { type: Number, required: false },
    dameId: { type: Schema.Types.ObjectId, ref: 'Cattle', required: false },
    dameBreed: { type: String, required: false },
    sireId: { type: Schema.Types.ObjectId, ref: 'Cattle', required: false },
    sireBreed: { type: String, required: false },
    noOfCalvings: { type: Number, required: false, default: 0 },
    farmBorn: { type: Boolean, default: false },
    color: { type: String, required: false },
    production: { type: Number, required: false },
    milkCollection: { type: Number, required: false },
    weight: { type: Number, required: false },
    purchaseDate: { type: Date, required: false },
    purchasePrice: { type: Number, required: false },
    purchaseFrom: { type: String, required: false },
    purchaseBy: { type: String, required: false },
    purchaseRemarks: { type: String, required: false },
    remarks: { type: String, required: false },
  },
  { timestamps: true }
);

CattleSchema.index({ farmId: 1, code: 1 }, { unique: true });
CattleSchema.index({ tagId: 1 }, { unique: true });

export default mongoose.models.Cattle || mongoose.model('Cattle', CattleSchema);
