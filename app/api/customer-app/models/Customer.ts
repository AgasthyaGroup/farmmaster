import mongoose, { Schema } from 'mongoose';

const CustomerSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    address1: { type: String, default: '', trim: true },
    address2: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CustomerSchema.index({ phone: 1 });

if (mongoose.models.Customer) {
  delete mongoose.models.Customer;
}

export default mongoose.model('Customer', CustomerSchema);
