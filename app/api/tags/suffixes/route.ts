import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import TagSuffix from '@/src/models/TagSuffix';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      await dbConnect();
      const suffixes = await TagSuffix.find({}).sort({ createdAt: -1 });
      return successResponse(suffixes, 'Tag suffixes fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const body = await req.json();
      const { suffix, animalType } = body;
      if (!suffix || !animalType) {
        return errorResponse('Suffix and Animal Type are required', 400);
      }

      await dbConnect();

      const existing = await TagSuffix.findOne({ suffix: suffix.trim().toUpperCase() });
      if (existing) {
        existing.animalType = animalType.trim().toUpperCase();
        await existing.save();
        return successResponse(existing, 'Tag suffix updated successfully');
      }

      const newSuffix = await TagSuffix.create({
        suffix: suffix.trim().toUpperCase(),
        animalType: animalType.trim().toUpperCase(),
      });

      return createdResponse(newSuffix, 'Tag suffix created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
