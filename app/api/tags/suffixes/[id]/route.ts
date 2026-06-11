import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import TagSuffix from '@/src/models/TagSuffix';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid suffix id', 400);
      }

      await dbConnect();
      const suffix = await TagSuffix.findByIdAndDelete(id);
      if (!suffix) return notFoundResponse('Suffix not found');

      return successResponse(null, 'Tag suffix deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
