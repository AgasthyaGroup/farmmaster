import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DailyFeeding from '@/src/models/DailyFeeding';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      await dbConnect();
      const records = await DailyFeeding.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'DailyFeeding fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await DailyFeeding.create(body);
      return createdResponse(record, 'DailyFeeding created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
