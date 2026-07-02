import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Designation from '@/src/models/Designation';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await Designation.findById(id).lean();
      if (!record || record.isDeleted) {
        return errorResponse('Designation not found', 404);
      }
      return successResponse(record, 'Designation fetched successfully');
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

      const oldRecord = await Designation.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('Designation not found', 404);
      }

      if (body.name && String(body.name).trim()) {
        const trimmedName = String(body.name).trim();
        const existing = await Designation.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
          isDeleted: { $ne: true }
        });
        if (existing) {
          return errorResponse('Designation name already exists', 400);
        }
        body.name = trimmedName;
      }

      const record = await Designation.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return successResponse(record, 'Designation updated successfully');
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

      const oldRecord = await Designation.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('Designation not found', 404);
      }

      const record = await Designation.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      return successResponse(null, 'Designation soft-deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
