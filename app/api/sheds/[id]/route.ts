import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Shed from '@/src/models/Shed';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'SHEDS'], async (user) => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await Shed.findById(id).populate('farmId');
      if (!record || record.isDeleted) {
        return errorResponse('Shed not found', 404);
      }
      const recordFarmId = record.farmId && typeof record.farmId === 'object' ? (record.farmId._id || record.farmId.id) : record.farmId;
      if (user.farmId && recordFarmId && recordFarmId.toString() !== user.farmId) {
        return errorResponse('You do not have access to this farm\'s data', 403);
      }
      return successResponse(record, 'Shed fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'SHEDS'], async (user) => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      
      const existing = await Shed.findById(id);
      if (!existing || existing.isDeleted) {
        return errorResponse('Shed not found', 404);
      }
      const existingFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.farmId && existingFarmId && existingFarmId.toString() !== user.farmId) {
        return errorResponse('Access Denied', 403);
      }

      const record = await Shed.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return successResponse(record, 'Shed updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'SHEDS'], async (user) => {
    try {
      const { id } = await params;
      await dbConnect();
      
      const existing = await Shed.findById(id);
      if (!existing || existing.isDeleted) {
        return errorResponse('Shed not found', 404);
      }
      const existingFarmId = existing.farmId && typeof existing.farmId === 'object' ? (existing.farmId._id || existing.farmId.id) : existing.farmId;
      if (user.farmId && existingFarmId && existingFarmId.toString() !== user.farmId) {
        return errorResponse('Access Denied', 403);
      }

      const record = await Shed.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      return successResponse(null, 'Shed deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
