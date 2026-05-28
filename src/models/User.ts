/**
 * src/models/User.ts
 *
 * GOATED User Schema — Dynamic Role Validation
 * ─────────────────────────────────────────────
 * • Completely removes all hardcoded enum arrays from the `role` field.
 * • Uses an async Mongoose schema validator that hits the Role collection
 *   in real-time so any role created on the Role Management dashboard is
 *   immediately accepted without a backend redeploy.
 * • Applies uppercase + trim normalization at the schema layer, so
 *   "operator", " OPERATOR ", "Operator" are all treated identically.
 * • Password field is excluded from queries by default (select: false).
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  userId: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  password: string;
  role: string;
  farmId: mongoose.Types.ObjectId | null;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never returned in queries unless explicitly selected
    },

    // ─── Dynamic Role Field ──────────────────────────────────────────────────
    // NO static enum array. The validator performs a live DB lookup against
    // the Role collection, so newly created roles are instantly valid.
    role: {
      type: String,
      required: [true, 'Role is required'],
      // Auto-normalize: trim whitespace and convert to UPPERCASE before
      // the value ever reaches a validator or is saved to the database.
      trim: true,
      uppercase: true,
      // Async validator: queries the Role collection in real-time.
      validate: {
        validator: async function (value: string): Promise<boolean> {
          // Guard: if no value provided, let the `required` rule handle it.
          if (!value) return false;

          try {
            // Lazy-require to avoid circular dependency issues at module load time.
            // The Role model MUST be compiled before this validator fires —
            // which is guaranteed since authGuard.ts imports it on every request.
            const RoleModel = mongoose.models['Role'];
            if (!RoleModel) {
              // If the Role model hasn't been compiled yet (edge case during
              // cold start), we skip validation to avoid a false rejection.
              console.warn('[User.role validator] Role model not yet compiled — skipping live validation.');
              return true;
            }

            const existingRole = await RoleModel.findOne({
              name: value.trim().toUpperCase(),
              status: true, // Only accept active, non-disabled roles
            }).lean();

            return !!existingRole;
          } catch (err) {
            // If the DB query itself fails (e.g., connection issue), we log
            // the error and return false to fail-safe (reject the save).
            console.error('[User.role validator] DB lookup failed:', err);
            return false;
          }
        },
        // The error message is dynamic so it shows exactly which value failed.
        message: (props: mongoose.ValidatorProps) =>
          `"${props.value}" is not a valid or active role. Create it in Role Management first.`,
      },
    },

    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound text index for fast search on the User Management dashboard.
UserSchema.index({ name: 'text', userId: 'text', email: 'text' });

// ─── Model Export ─────────────────────────────────────────────────────────────
// The `mongoose.models.User ||` pattern prevents "Cannot overwrite model once
// compiled" errors which occur on Next.js hot reloads in development.
const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
