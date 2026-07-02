import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Labor from '@/src/models/Labor';
import Designation from '@/src/models/Designation';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await Labor.findById(id)
        .populate({ path: 'designationId', select: 'name status' })
        .populate({ path: 'farmId', select: 'name code' })
        .lean();
      if (!record || record.isDeleted) {
        return errorResponse('Labor record not found', 404);
      }
      return successResponse(record, 'Labor fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const oldRecord = await Labor.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('Labor record not found', 404);
      }

      if (body.name && String(body.name).trim()) {
        body.name = String(body.name).trim();
      }

      const record = await Labor.findByIdAndUpdate(id, body, { new: true, runValidators: true })
        .populate({ path: 'designationId', select: 'name status' })
        .populate({ path: 'farmId', select: 'name code' });

      return successResponse(record, 'Labor record updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LABOR_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      await dbConnect();

      const oldRecord = await Labor.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('Labor record not found', 404);
      }

      const record = await Labor.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      return successResponse(null, 'Labor record soft-deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
