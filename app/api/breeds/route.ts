import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Breed from '@/src/models/Breed';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE', 'BREED_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const breeds = await Breed.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(breeds, 'Breeds fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BREED_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingBreed = await Breed.findOne({ name });
      if (existingBreed) {
        if (!existingBreed.isDeleted) {
          return errorResponse('Breed name already exists', 400);
        }
        // Restore soft-deleted breed
        const breed = await Breed.findByIdAndUpdate(
          existingBreed._id,
          { description, status, isDeleted: false },
          { new: true }
        );
        return createdResponse(breed, 'Breed created successfully');
      }

      const breed = await Breed.create({
        name,
        description,
        status,
      });

      return createdResponse(breed, 'Breed created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
