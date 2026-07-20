import mongoose, { Schema } from 'mongoose';

const DeliveryExecutiveSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    vehicleType: { type: String, default: 'Bike', trim: true },
    vehicleNumber: { type: String, default: '', trim: true },
    status: { type: String, default: 'inactive' },
  },
  { timestamps: true }
);

if (mongoose.models.DeliveryExecutive) {
  delete mongoose.models.DeliveryExecutive;
}

export default mongoose.model('DeliveryExecutive', DeliveryExecutiveSchema);
