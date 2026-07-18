import mongoose, { Schema } from 'mongoose';

const FavouriteSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    productId: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate entries
FavouriteSchema.index({ customerId: 1, productId: 1 }, { unique: true });

if (mongoose.models.Favourite) {
  delete mongoose.models.Favourite;
}

export default mongoose.model('Favourite', FavouriteSchema);
