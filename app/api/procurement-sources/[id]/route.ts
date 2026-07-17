import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import ProcurementSource from '@/src/models/ProcurementSource';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'PROCUREMENT_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid procurement source id', 400);
      }

      const body = await req.json();
      const name = body?.name?.trim();
      const code = body?.code?.trim() || '';
      const location = body?.location?.trim() || '';
      const phone = body?.phone?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      // Check duplicate name excluding self
      const existing = await ProcurementSource.findOne({ _id: { $ne: id }, name });
      if (existing) {
        return errorResponse('Procurement source name already exists', 400);
      }

      const source = await ProcurementSource.findByIdAndUpdate(
        id,
        { name, code, location, phone, status, farmId },
        { new: true }
      );
      if (!source) return notFoundResponse('Procurement source not found');

      return successResponse(source, 'Procurement source updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'PROCUREMENT_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid procurement source id', 400);
      }

      await dbConnect();
      const source = await ProcurementSource.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!source) return notFoundResponse('Procurement source not found');

      return successResponse(null, 'Procurement source deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
