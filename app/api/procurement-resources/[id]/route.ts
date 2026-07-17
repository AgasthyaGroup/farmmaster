import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import ProcurementResource from '@/src/models/ProcurementResource';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from '@/src/utils/responses';
import { objectIdSchema, updateProcurementResourceSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'MILK', 'INCHARGE'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid procurement resource ID', 400);
      }
      await dbConnect();
      const resource = await ProcurementResource.findOne({ _id: parsedId.data, isDeleted: false }).populate('farmId');
      if (!resource) {
        return notFoundResponse('Procurement resource not found');
      }

      // Check farm access permissions
      const resourceFarmId = resource.farmId && typeof resource.farmId === 'object' ? (resource.farmId._id || resource.farmId.id) : resource.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(resourceFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      return successResponse(resource, 'Procurement resource fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid procurement resource ID', 400);
      }
      const body = await req.json();
      const parsedBody = updateProcurementResourceSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }

      await dbConnect();
      const existing = await ProcurementResource.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Procurement resource not found');
      }

      // Check farm access permissions
      const resourceFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(resourceFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      const updated = await ProcurementResource.findByIdAndUpdate(
        parsedId.data,
        { $set: parsedBody.data },
        { new: true, runValidators: true }
      ).populate('farmId');

      return successResponse(updated, 'Procurement resource updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async (user) => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid procurement resource ID', 400);
      }
      await dbConnect();
      const existing = await ProcurementResource.findOne({ _id: parsedId.data, isDeleted: false });
      if (!existing) {
        return notFoundResponse('Procurement resource not found');
      }

      // Check farm access permissions
      const resourceFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(resourceFarmId) !== String(user.farmId)) {
        return forbiddenResponse('Access Denied');
      }

      await ProcurementResource.findByIdAndUpdate(parsedId.data, { isDeleted: true });
      return successResponse(null, 'Procurement resource deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
