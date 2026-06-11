import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Medicine from '@/src/models/Medicine';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH', 'INVENTORY'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid medicine id', 400);
      }

      const body = await req.json();
      const name = body?.name?.trim();
      const type = body?.type?.trim() || undefined;
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingItem = await Medicine.findOne({ _id: { $ne: id }, name });
      if (existingItem) {
        return errorResponse('Medicine name already exists', 400);
      }

      const item = await Medicine.findByIdAndUpdate(
        id,
        { name, type, description, status, farmId },
        { new: true }
      );
      if (!item) return notFoundResponse('Medicine not found');

      return successResponse(item, 'Medicine updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH', 'INVENTORY'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid medicine id', 400);
      }

      await dbConnect();
      const item = await Medicine.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!item) return notFoundResponse('Medicine not found');

      return successResponse(null, 'Medicine deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
