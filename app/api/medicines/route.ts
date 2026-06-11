import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Medicine from '@/src/models/Medicine';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH', 'INVENTORY'], async () => {
    try {
      await dbConnect();
      const medicines = await Medicine.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(medicines, 'Medicines fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH', 'INVENTORY'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      const type = body?.type?.trim() || undefined;
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingItem = await Medicine.findOne({ name });
      if (existingItem) {
        if (!existingItem.isDeleted) {
          return errorResponse('Medicine name already exists', 400);
        }
        // If deleted, restore and update
        const item = await Medicine.findByIdAndUpdate(
          existingItem._id,
          { type, description, status, farmId, isDeleted: false },
          { new: true }
        );
        return createdResponse(item, 'Medicine created successfully');
      }

      const item = await Medicine.create({
        name,
        type,
        description,
        status,
        farmId,
      });

      return createdResponse(item, 'Medicine created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
