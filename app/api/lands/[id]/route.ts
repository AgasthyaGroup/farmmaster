import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Land from '@/src/models/Land';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '@/src/utils/responses';
import { objectIdSchema, updateLandSchema } from '@/src/utils/validation';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid land ID', 400);
      }
      await dbConnect();
      const land = await Land.findOne({ _id: parsedId.data, isDeleted: false }).populate('farmId').lean();
      if (!land) {
        return notFoundResponse('Land not found');
      }

      // Check farm access permissions
      const landFarmId = land.farmId && typeof land.farmId === 'object' ? (land.farmId._id || land.farmId.id) : land.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(landFarmId) !== String(user.farmId)) {
        return forbiddenResponse('You do not have access to this farm\'s land');
      }

      // Dynamically calculate utilized area for the land
      const GrassCollection = mongoose.models.GrassCollection || mongoose.model('GrassCollection');
      const gcQuery: any = {
        sourcingFarmId: land._id,
        isDeleted: false
      };
      if (land.lastRegrownAt) {
        gcQuery.date = { $gt: new Date(land.lastRegrownAt) };
      }
      const collections = await GrassCollection.find(gcQuery).lean();
      const utilizedArea = collections.reduce((sum, col) => sum + (col.harvestedArea || 0), 0);

      const enriched = {
        ...land,
        utilizedArea
      };

      return successResponse(enriched, 'Land fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid land ID', 400);
      }
      const body = await req.json();
      const parsedBody = updateLandSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }

      await dbConnect();
      const existing = await Land.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Land not found');
      }

      // Check farm access permissions
      const landFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(landFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      const updated = await Land.findByIdAndUpdate(
        parsedId.data,
        { $set: parsedBody.data },
        { new: true, runValidators: true }
      ).populate('farmId');

      return successResponse(updated, 'Land updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid land ID', 400);
      }
      await dbConnect();
      const existing = await Land.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Land not found');
      }

      // Check farm access permissions
      const landFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(landFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      await Land.findByIdAndUpdate(parsedId.data, { isDeleted: true });
      return successResponse(null, 'Land deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
