import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await GrassCollection.findById(id).populate(['farmId']);
      if (!record || record.isDeleted) {
        return errorResponse('GrassCollection not found', 404);
      }
      return successResponse(record, 'GrassCollection fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      const record = await GrassCollection.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('GrassCollection not found', 404);
      }
      return successResponse(record, 'GrassCollection updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await GrassCollection.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('GrassCollection not found', 404);
      }
      return successResponse(null, 'GrassCollection deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
