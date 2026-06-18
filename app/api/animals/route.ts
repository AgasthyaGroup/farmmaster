import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Animal from '@/src/models/Animal';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE', 'ANIMAL_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const animals = await Animal.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(animals, 'Animals fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'ANIMAL_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      const code = body?.code?.trim()?.toUpperCase();
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;

      if (!name) {
        return errorResponse('Name is required', 400);
      }
      if (!code) {
        return errorResponse('Code is required', 400);
      }

      await dbConnect();

      // Check name or code uniqueness
      const existingAnimal = await Animal.findOne({ $or: [{ name }, { code }] });
      if (existingAnimal) {
        if (!existingAnimal.isDeleted) {
          return errorResponse('Animal name or code already exists', 400);
        }
        // Restore soft-deleted animal
        const animal = await Animal.findByIdAndUpdate(
          existingAnimal._id,
          { name, code, description, status, isDeleted: false },
          { new: true }
        );
        return createdResponse(animal, 'Animal created successfully');
      }

      const animal = await Animal.create({
        name,
        code,
        description,
        status,
      });

      return createdResponse(animal, 'Animal created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
