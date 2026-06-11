import mongoose, { Schema } from 'mongoose';

const TagSuffixSchema = new Schema(
  {
    suffix: {
      type: String,
      required: [true, 'Suffix is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    animalType: {
      type: String,
      required: [true, 'Animal Type is required'],
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.TagSuffix || mongoose.model('TagSuffix', TagSuffixSchema);
