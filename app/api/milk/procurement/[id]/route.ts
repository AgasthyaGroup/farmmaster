import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkProcurement from '@/src/models/MilkProcurement';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MilkProcurement.findById(id).populate('farmId', 'name code');
      if (!record || record.isDeleted) {
        return errorResponse('Milk procurement record not found', 404);
      }
      return successResponse(record, 'Milk procurement record fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      const record = await MilkProcurement.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('Milk procurement record not found', 404);
      }
      return successResponse(record, 'Milk procurement record updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'MILK'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MilkProcurement.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('Milk procurement record not found', 404);
      }
      return successResponse(null, 'Milk procurement record deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
