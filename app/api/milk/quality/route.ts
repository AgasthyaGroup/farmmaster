import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkQuality from '@/src/models/MilkQuality';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await MilkQuality.find({ isDeleted: false }).populate([]).sort({ createdAt: -1 });
      return successResponse(records, 'MilkQuality fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await MilkQuality.create(body);
      return createdResponse(record, 'MilkQuality created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
