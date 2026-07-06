import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import SemenStraw from '@/src/models/SemenStraw';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '@/src/utils/responses';
import { objectIdSchema, updateSemenStrawSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid semen straw ID', 400);
      }
      await dbConnect();
      const straw = await SemenStraw.findOne({ _id: parsedId.data, isDeleted: false }).populate('farmId');
      if (!straw) {
        return notFoundResponse('Semen straw batch not found');
      }

      // Check farm access permissions
      const strawFarmId = straw.farmId && typeof straw.farmId === 'object' ? (straw.farmId._id || straw.farmId.id) : straw.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(strawFarmId) !== String(user.farmId)) {
        return forbiddenResponse('You do not have access to this farm\'s semen straws');
      }

      return successResponse(straw, 'Semen straw batch fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid semen straw ID', 400);
      }
      const body = await req.json();
      const parsedBody = updateSemenStrawSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }

      await dbConnect();
      const existing = await SemenStraw.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Semen straw batch not found');
      }

      // Check farm access permissions
      const strawFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(strawFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      const updated = await SemenStraw.findByIdAndUpdate(
        parsedId.data,
        { $set: parsedBody.data },
        { new: true, runValidators: true }
      ).populate('farmId');

      return successResponse(updated, 'Semen straw batch updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid semen straw ID', 400);
      }
      await dbConnect();
      const existing = await SemenStraw.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Semen straw batch not found');
      }

      // Check farm access permissions
      const strawFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(strawFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      await SemenStraw.findByIdAndUpdate(parsedId.data, { isDeleted: true });
      return successResponse(null, 'Semen straw batch deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
