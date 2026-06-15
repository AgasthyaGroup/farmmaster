import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Vaccine from '@/src/models/Vaccine';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      await dbConnect();
      const records = await Vaccine.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'Vaccines fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async (user) => {
    try {
      const body = await req.json();
      await dbConnect();
      
      if (!body.farmId && user.farmId) {
        body.farmId = user.farmId.toString();
      }
      
      const record = await Vaccine.create(body);
      return createdResponse(record, 'Vaccine created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
