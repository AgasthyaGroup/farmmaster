import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import BMC from '@/src/models/BMC';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '@/src/utils/responses';
import { objectIdSchema, updateBmcSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BMC'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid Bulk Milk Cooler ID', 400);
      }
      await dbConnect();
      const bmc = await BMC.findOne({ _id: parsedId.data, isDeleted: false }).populate('farmId');
      if (!bmc) {
        return notFoundResponse('Bulk Milk Cooler not found');
      }

      // Check farm access permissions
      const bmcFarmId = bmc.farmId && typeof bmc.farmId === 'object' ? (bmc.farmId._id || bmc.farmId.id) : bmc.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(bmcFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      return successResponse(bmc, 'Bulk Milk Cooler fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BMC'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid Bulk Milk Cooler ID', 400);
      }
      const body = await req.json();
      const parsedBody = updateBmcSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }

      await dbConnect();
      const existing = await BMC.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Bulk Milk Cooler not found');
      }

      // Check farm access permissions
      const bmcFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(bmcFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      const updated = await BMC.findByIdAndUpdate(
        parsedId.data,
        { $set: parsedBody.data },
        { new: true, runValidators: true }
      ).populate('farmId');

      return successResponse(updated, 'Bulk Milk Cooler updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BMC'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid Bulk Milk Cooler ID', 400);
      }
      await dbConnect();
      const existing = await BMC.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Bulk Milk Cooler not found');
      }

      // Check farm access permissions
      const bmcFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(bmcFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      await BMC.findByIdAndUpdate(parsedId.data, { isDeleted: true });
      return successResponse(null, 'Bulk Milk Cooler deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
