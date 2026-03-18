import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const { name, code, address, location } = body;

      if (!name || !code) {
        return errorResponse('Name and code are required', 400);
      }

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

      return successResponse(farm, 'Farm created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
