import mongoose, { Schema } from 'mongoose';

const CattleSchema = new Schema(
  {
    farmId: { type: Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    tagId: { type: Schema.Types.ObjectId, ref: 'Tag', required: true },
    type: { type: String, enum: ['COW', 'BUFFALO', 'CALF'], required: true },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    breed: { type: String, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE'], required: true },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    color: { type: String, required: true },
    production: { type: Number, required: true },
    milkCollection: { type: Number, required: true },
    weight: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true },
    purchaseFrom: { type: String, required: true },
    purchaseBy: { type: String, required: true },
    purchaseRemarks: { type: String, required: true },
    remarks: { type: String, required: true },
  },
  { timestamps: true }
);

CattleSchema.index({ farmId: 1, code: 1 }, { unique: true });
CattleSchema.index({ tagId: 1 }, { unique: true });

export default mongoose.models.Cattle || mongoose.model('Cattle', CattleSchema);
