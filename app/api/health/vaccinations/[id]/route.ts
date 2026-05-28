import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import VaccinationLog from '@/src/models/VaccinationLog';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await VaccinationLog.findById(id);
      if (!record || record.isDeleted) {
        return errorResponse('VaccinationLog not found', 404);
      }
      return successResponse(record, 'VaccinationLog fetched successfully');
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
      const record = await VaccinationLog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('VaccinationLog not found', 404);
      }
      return successResponse(record, 'VaccinationLog updated successfully');
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
      const record = await VaccinationLog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('VaccinationLog not found', 404);
      }
      return successResponse(null, 'VaccinationLog deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
