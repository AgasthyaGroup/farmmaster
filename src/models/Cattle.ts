import mongoose, { Schema } from 'mongoose';

const CattleSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: false },
    name: { type: String, required: false },
    code: { type: String, required: false },
    date: { type: Date, required: false },
    tag: { type: String, required: true },
    cattleType: { type: String, required: true },
    shed: { type: String, required: true },
    lineNo: { type: Number, required: false },
    status: { type: String, default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    breed: { type: String, required: false },
    gender: { type: String, required: false },
    dateOfBirth: { type: Date, required: false },
    age: { type: String, required: false },
    dameId: { type: String, required: false },
    dameBreed: { type: String, required: false },
    sireId: { type: String, required: false },
    sireBreed: { type: String, required: false },
    calvings: { type: Number, required: false, default: 0 },
    farmBorn: { type: String, default: 'No' },
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

CattleSchema.index({ farmId: 1, tag: 1 }, { unique: true });

export default mongoose.models.Cattle || mongoose.model('Cattle', CattleSchema);
