import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import LiveStock from '@/src/models/LiveStock';
import Cattle from '@/src/models/Cattle';
import Tag from '@/src/models/Tag';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createCattleSchema } from '@/src/utils/validation';

// ─── Shared Defensive Deep Sanitization Helper ──────────────────────────────────

export function deepSanitizeCattleInput(body: any, userFarmId?: string | null) {
  if (!body || typeof body !== 'object') return;

  // 1. Defuse strict Mongoose Date casting crash ("-", "dd/mm/yyyy", "")
  const dateFields = ['dateOfBirth', 'purchaseDate', 'date'];
  for (const field of dateFields) {
    const rawVal = body[field];
    if (
      rawVal === '' ||
      rawVal === null ||
      rawVal === undefined ||
      rawVal === '-' ||
      String(rawVal).trim().toLowerCase() === 'dd/mm/yyyy'
    ) {
      body[field] = null;
    } else if (typeof rawVal === 'string') {
      const cleaned = rawVal.trim();
      if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'dd/mm/yyyy') {
        body[field] = null;
      } else {
        const parsed = new Date(cleaned);
        if (isNaN(parsed.getTime())) {
          body[field] = null;
        } else {
          body[field] = parsed;
        }
      }
    }
  }

  // 2. Defuse strict Mongoose Number casting crashes
  const numberFields = ['calvings', 'production', 'milkCollection', 'weight', 'purchasePrice', 'lineNo'];
  for (const field of numberFields) {
    const rawVal = body[field];
    if (
      rawVal === '' ||
      rawVal === null ||
      rawVal === undefined ||
      rawVal === '-' ||
      String(rawVal).trim() === ''
    ) {
      body[field] = 0;
    } else {
      const parsed = Number(String(rawVal).trim());
      if (isNaN(parsed)) {
        body[field] = 0;
      } else {
        body[field] = parsed;
      }
    }
  }

  // 3. Normalizing relational object references (farmId, shedId)
  const refFields = ['farmId', 'shedId'];
  for (const field of refFields) {
    const rawVal = body[field];
    if (!rawVal || rawVal === 'UNKNOWN_FARM' || rawVal === '-') {
      body[field] = null;
    } else if (typeof rawVal === 'string') {
      const cleaned = rawVal.trim();
      if (mongoose.Types.ObjectId.isValid(cleaned)) {
        body[field] = new mongoose.Types.ObjectId(cleaned);
      } else {
        // Leave it as string (since schema has loose type Mixed) or clean it to null
        body[field] = cleaned;
      }
    }
  }

  // 4. Force default fallback for farmId if empty
  if (!body.farmId && userFarmId && mongoose.Types.ObjectId.isValid(userFarmId)) {
    body.farmId = new mongoose.Types.ObjectId(userFarmId);
  }

  // 5. Unify fields between Cattle & LiveStock models for absolute backwards compatibility
  // Normalize Tag ID
  const tagVal = String(body.tag || body.tag_id || body.tagId || '').trim();
  body.tag = tagVal;
  body.tag_id = tagVal.toUpperCase();

  // Normalize Cattle/Animal Type
  const typeVal = String(body.cattleType || body.animalType || 'COW').trim().toUpperCase();
  body.cattleType = typeVal;
  body.animalType = typeVal;

  // Normalize Shed Number / Shed ID
  const shedVal = body.shed || body.shedId || '-';
  body.shed = shedVal;
  body.shedId = shedVal;

  // Normalize Status
  const statusVal = String(body.status || 'ACTIVE').trim().toUpperCase();
  body.status = ['ACTIVE', 'SOLD', 'DECEASED'].includes(statusVal) ? statusVal : 'ACTIVE';
}

// ─── GET API Route ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      await dbConnect();
      const records = await LiveStock.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'LiveStock fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

// ─── POST API Route ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async (user) => {
    try {
      let body = await req.json();

      // Execute Deep Defensive Sanitization before Mongoose validator processes the query
      deepSanitizeCattleInput(body, user.farmId);

      const parsedBody = createCattleSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid Request Body schema structure', 400);
      }
      body = parsedBody.data;

      await dbConnect();

      // Check if tag already exists in active records
      const existingLiveStock = await LiveStock.findOne({ tag_id: body.tag_id, isDeleted: false });
      if (existingLiveStock) {
        return errorResponse(`A livestock record with Tag ID [${body.tag_id}] already exists in active inventory.`, 400);
      }

      // ── Resolve farmId from short codes if it is still a string
      if (body.farmId && !mongoose.Types.ObjectId.isValid(body.farmId.toString())) {
        const farm = await Farm.findOne({ code: String(body.farmId).trim() });
        if (farm) {
          body.farmId = farm._id;
        } else {
          // Attempt to assign authenticated user's farmId
          body.farmId = user.farmId ? new mongoose.Types.ObjectId(user.farmId) : null;
        }
      }

      // If still missing farmId, pull first farm in system
      if (!body.farmId) {
        const defaultFarm = await Farm.findOne({ isDeleted: false });
        if (defaultFarm) {
          body.farmId = defaultFarm._id;
        }
      }

      // Create entries in BOTH collections simultaneously to ensure database relationships are fully unified
      const liveStockRecord = await LiveStock.create(body);
      
      try {
        await Cattle.create({
          ...body,
          farmId: body.farmId,
        });
      } catch (err) {
        console.error('Non-blocking legacy Cattle sync failure:', err);
      }

      // Update associated Tag status
      if (body.tag) {
        const tag = await Tag.findOne({ tagId: body.tag });
        if (tag) {
          tag.status = 'ASSIGNED';
          await tag.save();
        }
      }

      return createdResponse(liveStockRecord, 'Cattle record registered successfully in unified registry');
    } catch (error: any) {
      console.error('[POST /api/cattle] Controller crash prevented:', error);
      return errorResponse(error.message || 'Failed to save cattle record due to database validation mismatch.', 500);
    }
  });
}
