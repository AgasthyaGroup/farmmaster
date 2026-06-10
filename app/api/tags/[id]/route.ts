import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid tag id', 400);
      }

      const body = await req.json();
      const { farmId, code, type, status } = body;

      if (!farmId || !code || !type) {
        return errorResponse('farmId, code, and type are required', 400);
      }

      await dbConnect();
      
      const existingTag = await Tag.findOne({ _id: { $ne: id }, code });
      if (existingTag) {
        return errorResponse('Tag code already exists', 400);
      }

      const tag = await Tag.findByIdAndUpdate(
        id,
        { farmId, code, type, status },
        { new: true }
      );
      
      if (!tag) return notFoundResponse('Tag not found');

      return successResponse(tag, 'Tag updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid tag id', 400);
      }

      await dbConnect();
      const tag = await Tag.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!tag) return notFoundResponse('Tag not found');

      return successResponse(null, 'Tag deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
