import mongoose, { Schema } from 'mongoose';

const DeliveryLocationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, unique: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    status: { type: String, default: 'inactive' },
  },
  { timestamps: true }
);

if (mongoose.models.DeliveryLocation) {
  delete mongoose.models.DeliveryLocation;
}

export default mongoose.model('DeliveryLocation', DeliveryLocationSchema);
