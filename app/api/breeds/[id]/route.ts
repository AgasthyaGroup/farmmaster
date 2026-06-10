import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Breed from '@/src/models/Breed';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BREED_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid breed id', 400);
      }

      const body = await req.json();
      const name = body?.name?.trim();
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingBreed = await Breed.findOne({ _id: { $ne: id }, name });
      if (existingBreed) {
        return errorResponse('Breed name already exists', 400);
      }

      const breed = await Breed.findByIdAndUpdate(
        id,
        { name, description, status },
        { new: true }
      );
      if (!breed) return notFoundResponse('Breed not found');

      return successResponse(breed, 'Breed updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BREED_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid breed id', 400);
      }

      await dbConnect();
      const breed = await Breed.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!breed) return notFoundResponse('Breed not found');

      return successResponse(null, 'Breed deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
