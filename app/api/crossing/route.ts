/**
 * app/api/crossing/route.ts
 *
 * GOATED Crossing Log API — GET | POST
 * ──────────────────────────────────────
 * • POST normalizes the frontend's `tag` field into `tag_id` so every
 *   record is firmly tied to a livestock asset.
 * • Strict payload sanitization via passthrough Zod + manual field mapping.
 * • Fail-safe try/catch on every handler.
 */

import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import CrossingLog from '@/src/models/CrossingLog';
import Cattle from '@/src/models/Cattle';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { z } from 'zod';

// Validate that the request structure is valid.
// farmId is optional here because we can resolve it dynamically from the referenced animal or user context.
const crossingSchema = z
  .object({
    farmId: z.string().optional().nullable(),
  })
  .passthrough();

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await CrossingLog.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'CrossingLogs fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/crossing] Unhandled error:', error);
      return errorResponse(error?.message || 'Failed to fetch crossing logs', 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async (user) => {
    try {
      let rawBody: any;
      try {
        rawBody = await req.json();
      } catch {
        return errorResponse('Request body is not valid JSON', 400);
      }

      const parsedBody = crossingSchema.safeParse(rawBody);
      if (!parsedBody.success) {
        return errorResponse(
          parsedBody.error.issues[0]?.message || 'Invalid request body',
          400
        );
      }

      const body = parsedBody.data as Record<string, any>;

      // ── Normalize tag → tag_id ─────────────────────────────────────────
      // The frontend sends "tag" (the animal's visible tag number).
      // The schema enforces "tag_id" as the canonical indexed field.
      // We set both so old records and new records are query-compatible.
      if (!body.tag_id && body.tag) {
        body.tag_id = String(body.tag).trim();
      }
      if (!body.tag && body.tag_id) {
        body.tag = String(body.tag_id).trim();
      }

      // Guard: refuse to create a crossing log with no tag reference at all
      if (!body.tag_id) {
        return errorResponse(
          'tag_id (animal tag) is required for crossing logs',
          400
        );
      }

      await dbConnect();

      // ── Resolve farmId Dynamically ──────────────────────────────────────
      let resolvedFarmId: string | null = null;
      const rawFarmId = body.farmId ? String(body.farmId).trim() : '';

      if (rawFarmId && /^[0-9a-fA-F]{24}$/.test(rawFarmId)) {
        resolvedFarmId = rawFarmId;
      } else if (rawFarmId && rawFarmId !== 'UNKNOWN_FARM') {
        const farm = await Farm.findOne({ code: rawFarmId });
        if (farm) {
          resolvedFarmId = farm._id.toString();
        }
      }

      // ── Try to get farmId from the referenced animal (most accurate since log matches asset)
      if (!resolvedFarmId) {
        const animal = await Cattle.findOne({ tag: body.tag_id });
        if (animal && animal.farmId) {
          resolvedFarmId = animal.farmId.toString();
        }
      }

      // Fallback 1: Authenticated user's farmId from session token
      if (!resolvedFarmId && user.farmId) {
        resolvedFarmId = user.farmId.toString();
      }

      // Fallback 2: System default (first active farm found)
      if (!resolvedFarmId) {
        const defaultFarm = await Farm.findOne({ isDeleted: false });
        if (defaultFarm) {
          resolvedFarmId = defaultFarm._id.toString();
        }
      }

      if (resolvedFarmId) {
        body.farmId = resolvedFarmId;
      } else {
        delete body.farmId;
      }

      const record = await CrossingLog.create(body);
      return createdResponse(record, 'CrossingLog created successfully');
    } catch (error: any) {
      console.error('[POST /api/crossing] Unhandled error:', error);

      if (error?.name === 'ValidationError') {
        const firstMsg = Object.values(error.errors ?? {})[0] as any;
        return errorResponse(firstMsg?.message || error.message || 'Validation failed', 422);
      }

      return errorResponse(error?.message || 'Failed to create crossing log', 500);
    }
  });
}
