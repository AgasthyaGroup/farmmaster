import mongoose, { Schema } from 'mongoose';

const DeliveryRouteSchema = new Schema(
  {
    routeName: { type: String, required: true, trim: true },
    routeCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    startPoint: { type: String, default: '', trim: true },
    endPoint: { type: String, default: '', trim: true },
    pincodes: { type: [String], default: [] },
    assignedExecutiveId: { type: Schema.Types.ObjectId, ref: 'DeliveryExecutive', default: null },
    status: { type: String, default: 'inactive' },
  },
  { timestamps: true }
);

if (mongoose.models.DeliveryRoute) {
  delete mongoose.models.DeliveryRoute;
}

export default mongoose.model('DeliveryRoute', DeliveryRouteSchema);
