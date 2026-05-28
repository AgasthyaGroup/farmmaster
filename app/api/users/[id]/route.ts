/**
 * app/api/users/[id]/route.ts
 *
 * GOATED User [id] Route — GET | PUT | DELETE
 * ─────────────────────────────────────────────
 * • PUT performs strict payload sanitization — only known, safe fields are
 *   allowed through. All other keys are stripped before the DB update.
 * • Role validation is delegated to the User schema's async validator
 *   (live Role collection lookup) which fires via `runValidators: true`.
 * • Fail-safe try/catch on every handler returns clean JSON on any error.
 * • Password is hashed before saving; excluded from all read responses.
 * • Soft-delete (status: false) via DELETE — no hard deletes.
 */

import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import Department from '@/src/models/Department';
import Role from '@/src/models/Role';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';
import { objectIdSchema, updateUserSchema } from '@/src/utils/validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips the password field and any Mongoose internal fields from the
 * user document before sending it to the client.
 */
const sanitizeUser = (user: any) => {
  if (!user) return user;
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  const { password, __v, ...safeUser } = plain;
  return safeUser;
};

/**
 * The exhaustive whitelist of fields that are safe to receive in a PUT body.
 * Any key arriving from the client that is NOT in this list will be silently
 * stripped before the update reaches Mongoose — preventing mass-assignment.
 */
const ALLOWED_UPDATE_KEYS: ReadonlySet<string> = new Set([
  'userId',
  'name',
  'email',
  'department',
  'phone',
  'password',
  'role',
  'farmId',
  'status',
]);

// ─── GET /api/users/[id] ──────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;

      // Validate the incoming ObjectId before touching the DB
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id — must be a 24-character hex string', 400);
      }

      await dbConnect();

      const user = await User.findById(parsedId.data).populate('farmId').lean();
      if (!user) return notFoundResponse('User not found');

      return successResponse(sanitizeUser(user), 'User fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/users/[id]] Unhandled error:', error);
      return errorResponse(
        error?.message || 'An unexpected error occurred while fetching the user',
        500
      );
    }
  });
}

// ─── PUT /api/users/[id] ──────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'USERS'], async () => {
    try {
      // ── 1. Validate path param ───────────────────────────────────────────
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id — must be a 24-character hex string', 400);
      }

      // ── 2. Parse & validate request body with Zod ───────────────────────
      let rawBody: unknown;
      try {
        rawBody = await req.json();
      } catch {
        return errorResponse('Request body is not valid JSON', 400);
      }

      const parsedBody = updateUserSchema.safeParse(rawBody);
      if (!parsedBody.success) {
        const firstError =
          parsedBody.error.issues[0]?.message || 'Invalid request body';
        return errorResponse(firstError, 400);
      }

      // ── 3. Strict payload sanitization ──────────────────────────────────
      // Build a clean updatePayload that ONLY contains whitelisted keys.
      // This is the mass-assignment protection layer — nothing unexpected
      // can ever reach the Mongoose update call.
      const updatePayload: Record<string, any> = {};
      for (const [key, value] of Object.entries(parsedBody.data)) {
        if (ALLOWED_UPDATE_KEYS.has(key) && value !== undefined) {
          updatePayload[key] = value;
        }
      }

      // If the client somehow sent an empty body (all keys stripped), reject early.
      if (Object.keys(updatePayload).length === 0) {
        return errorResponse('No valid fields provided for update', 400);
      }

      await dbConnect();

      // ── 4. Hash password if provided ────────────────────────────────────
      if (updatePayload.password) {
        const bcrypt = require('bcryptjs');
        updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
      }

      // ── 5. Uniqueness check for email / userId (excluding self) ─────────
      if (updatePayload.email || updatePayload.userId) {
        const orClauses: any[] = [];
        if (updatePayload.email) orClauses.push({ email: updatePayload.email });
        if (updatePayload.userId) orClauses.push({ userId: updatePayload.userId });

        const conflict = await User.findOne({
          _id: { $ne: parsedId.data },
          $or: orClauses,
        }).lean();

        if (conflict) {
          return errorResponse('Email or User ID is already registered to another account', 400);
        }
      }

      // ── 6. Validate department against the Department collection ────────
      if (updatePayload.department) {
        const dept = await Department.findOne({
          name: new RegExp(`^${updatePayload.department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        }).lean();

        if (!dept) {
          return errorResponse(
            `Department "${updatePayload.department}" does not exist. Create it in Department Management first.`,
            400
          );
        }
        // Normalize to the exact casing stored in the DB
        updatePayload.department = (dept as any).name;
      }

      // ── 7. Validate role against the Role collection (live lookup) ──────
      // NOTE: Even though the User schema's async validator does this same
      // check via `runValidators: true` below, we do it here first so we
      // can return a clean, user-facing error message instead of a raw
      // Mongoose ValidationError stack trace.
      if (updatePayload.role) {
        const normalizedRole = String(updatePayload.role).trim().toUpperCase();
        const existingRole = await Role.findOne({
          name: normalizedRole,
          status: true, // Reject disabled/deleted roles
        }).lean();

        if (!existingRole) {
          return errorResponse(
            `Role "${updatePayload.role}" does not exist or is inactive. Create/enable it in Role Management first.`,
            400
          );
        }
        // Normalize to exact uppercase stored value
        updatePayload.role = normalizedRole;
      }

      // ── 8. Handle farmId for SUPER_ADMIN role ───────────────────────────
      // Super Admins are not scoped to a single farm.
      if (updatePayload.role === 'SUPER_ADMIN') {
        updatePayload.farmId = null;
      }

      // ── 9. Execute the update with full schema validation ────────────────
      // `runValidators: true` triggers the async role validator in User.ts,
      // providing a second, schema-level safety net.
      // `new: true` returns the post-update document so we can return it.
      const updatedUser = await User.findByIdAndUpdate(
        parsedId.data,
        { $set: updatePayload },
        {
          new: true,
          runValidators: true,
          // Required for async validators to fire inside findByIdAndUpdate
          context: 'query',
        }
      ).populate('farmId');

      if (!updatedUser) {
        return notFoundResponse('User not found — it may have been deleted');
      }

      return successResponse(sanitizeUser(updatedUser), 'User updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/users/[id]] Unhandled error:', error);

      // Catch Mongoose ValidationError explicitly and return the first
      // human-readable message rather than the full validation stack.
      if (error?.name === 'ValidationError') {
        const firstValidationMessage = Object.values(error.errors ?? {})[0] as any;
        return errorResponse(
          firstValidationMessage?.message || error.message || 'Validation failed',
          422
        );
      }

      // Catch MongoDB duplicate key error (E11000)
      if (error?.code === 11000) {
        const field = Object.keys(error?.keyPattern || {})[0] || 'field';
        return errorResponse(
          `Duplicate value: a user with this ${field} already exists`,
          409
        );
      }

      return errorResponse(
        error?.message || 'An unexpected error occurred while updating the user',
        500
      );
    }
  });
}

// ─── DELETE /api/users/[id] ───────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id — must be a 24-character hex string', 400);
      }

      await dbConnect();

      // Soft-delete: set status to false rather than removing the document.
      // This preserves historical audit trails (who created what logs, etc.)
      const user = await User.findByIdAndUpdate(
        parsedId.data,
        { $set: { status: false } },
        { new: true }
      ).lean();

      if (!user) return notFoundResponse('User not found');

      return successResponse(null, 'User disabled successfully');
    } catch (error: any) {
      console.error('[DELETE /api/users/[id]] Unhandled error:', error);
      return errorResponse(
        error?.message || 'An unexpected error occurred while disabling the user',
        500
      );
    }
  });
}
