import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassManagement from '@/src/models/GrassManagement';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await GrassManagement.findById(id).populate('sourcingTo');
      if (!record || record.isDeleted) {
        return errorResponse('Grass Sourcing Farm not found', 404);
      }
      return successResponse(record, 'Grass Sourcing Farm fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const record = await GrassManagement.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('Grass Sourcing Farm not found', 404);
      }
      return successResponse(record, 'Grass Sourcing Farm updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await GrassManagement.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('Grass Sourcing Farm not found', 404);
      }
      return successResponse(null, 'Grass Sourcing Farm deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
