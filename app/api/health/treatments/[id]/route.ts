import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import TreatmentLog from '@/src/models/TreatmentLog';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await TreatmentLog.findById(id);
      if (!record || record.isDeleted) {
        return errorResponse('TreatmentLog not found', 404);
      }
      return successResponse(record, 'TreatmentLog fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      const record = await TreatmentLog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('TreatmentLog not found', 404);
      }
      return successResponse(record, 'TreatmentLog updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await TreatmentLog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('TreatmentLog not found', 404);
      }
      return successResponse(null, 'TreatmentLog deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
