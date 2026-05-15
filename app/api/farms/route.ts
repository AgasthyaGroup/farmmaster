import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createFarmSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      await dbConnect();
      const farms = await Farm.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(farms, 'Farms fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const parsedBody = createFarmSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { name, code, address, location } = parsedBody.data;

      await dbConnect();
      
      const existingFarm = await Farm.findOne({ code });
      if (existingFarm) {
        return errorResponse('Farm code already exists', 400);
      }

      const farm = await Farm.create({
        name,
        code,
        address,
        location,
      });

      return createdResponse(farm, 'Farm created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
