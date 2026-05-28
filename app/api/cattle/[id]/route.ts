import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      
      const updatedCattle = await Cattle.findByIdAndUpdate(id, body, { new: true });
      if (!updatedCattle) {
        return errorResponse('Cattle not found', 404);
      }

      return successResponse(updatedCattle, 'Cattle updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      
      const deletedCattle = await Cattle.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!deletedCattle) {
        return errorResponse('Cattle not found', 404);
      }

      return successResponse(deletedCattle, 'Cattle deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
