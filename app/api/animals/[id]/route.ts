import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Animal from '@/src/models/Animal';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'ANIMAL_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid animal id', 400);
      }

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

      const existingAnimal = await Animal.findOne({ _id: { $ne: id }, $or: [{ name }, { code }] });
      if (existingAnimal) {
        return errorResponse('Animal name or code already exists', 400);
      }

      const animal = await Animal.findByIdAndUpdate(
        id,
        { name, code, description, status },
        { new: true }
      );
      if (!animal) return notFoundResponse('Animal not found');

      return successResponse(animal, 'Animal updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'ANIMAL_MANAGEMENT'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid animal id', 400);
      }

      await dbConnect();
      const animal = await Animal.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!animal) return notFoundResponse('Animal not found');

      return successResponse(null, 'Animal deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
