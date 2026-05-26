import mongoose, { Schema } from 'mongoose';

const MedicineInventorySchema = new Schema(
  {
    medicineName: { type: String, required: true },
    type: { type: String, required: true },
    oldStock: { type: Number, required: true, default: 0 },
    bought: { type: Number, required: true, default: 0 },
    used: { type: Number, required: true, default: 0 },
    presentStock: { type: Number, required: true, default: 0 },
    purchaseDate: { type: Date, required: false },
    expiryDate: { type: Date, required: false },
    farmId: { type: String, required: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.MedicineInventory || mongoose.model('MedicineInventory', MedicineInventorySchema);
