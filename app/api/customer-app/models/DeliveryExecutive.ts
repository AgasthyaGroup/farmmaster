import mongoose, { Schema } from 'mongoose';

const DeliveryExecutiveSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, default: '', trim: true },
    password: { type: String, required: true },
    vehicleType: { type: String, default: 'Bike', trim: true },
    vehicleNumber: { type: String, default: '', trim: true },
    pincodes: { type: [String], default: [] },
    assignedRouteId: { type: Schema.Types.ObjectId, ref: 'DeliveryRoute', default: null },
    status: { type: String, default: 'active' },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

if (mongoose.models.DeliveryExecutive) {
  delete mongoose.models.DeliveryExecutive;
}

export default mongoose.models.DeliveryExecutive || mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);
