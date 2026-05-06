import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const farm = await Farm.findOne({ _id: id, isDeleted: false });
      if (!farm) return notFoundResponse('Farm not found');
      return successResponse(farm);
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      
      const farm = await Farm.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { ...body },
        { new: true }
      );

      if (!farm) return notFoundResponse('Farm not found');
      return successResponse(farm, 'Farm updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      
      const farm = await Farm.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
      );

      if (!farm) return notFoundResponse('Farm not found');
      return successResponse(null, 'Farm deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
