import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import CrossingLog from '@/src/models/CrossingLog';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await CrossingLog.findByIdAndUpdate(params.id, body, { new: true });
      if (!record) return errorResponse('CrossingLog not found', 404);
      return successResponse(record, 'CrossingLog updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const record = await CrossingLog.findByIdAndUpdate(params.id, { isDeleted: true }, { new: true });
      if (!record) return errorResponse('CrossingLog not found', 404);
      return successResponse(null, 'CrossingLog deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
