import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';
import { objectIdSchema, updateFarmSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid farm id', 400);
      }
      await dbConnect();
      const farm = await Farm.findOne({ _id: parsedId.data, isDeleted: false });
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
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid farm id', 400);
      }
      const parsedBody = updateFarmSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      await dbConnect();
      
      const farm = await Farm.findOneAndUpdate(
        { _id: parsedId.data, isDeleted: false },
        parsedBody.data,
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
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid farm id', 400);
      }
      await dbConnect();
      
      const farm = await Farm.findOneAndUpdate(
        { _id: parsedId.data, isDeleted: false },
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
