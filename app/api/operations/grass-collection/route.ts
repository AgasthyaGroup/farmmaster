import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      await dbConnect();
      const records = await GrassCollection.find({ isDeleted: false }).populate(['farmId']).sort({ createdAt: -1 });
      return successResponse(records, 'GrassCollection fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async (user) => {
    try {
      const body = await req.json();
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

      // Fallback 1: Authenticated user's farmId from session token
      if (!resolvedFarmId && user.farmId) {
        resolvedFarmId = user.farmId.toString();
      }

      // Fallback 2: System default (first active farm found)
      if (!resolvedFarmId) {
        const defaultFarm = await Farm.findOne({ isDeleted: { $ne: true } });
        if (defaultFarm) {
          resolvedFarmId = defaultFarm._id.toString();
        }
      }

      if (resolvedFarmId) {
        body.farmId = new mongoose.Types.ObjectId(resolvedFarmId);
      } else {
        delete body.farmId;
      }

      // Safe date fallback to prevent DB validation crash
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (isNaN(parsedDate.getTime())) {
          body.date = new Date();
        } else {
          body.date = parsedDate;
        }
      } else {
        body.date = new Date();
      }

      const record = await GrassCollection.create(body);
      return createdResponse(record, 'GrassCollection created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
