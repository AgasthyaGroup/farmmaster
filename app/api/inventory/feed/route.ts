import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import FeedInventory from '@/src/models/FeedInventory';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      await dbConnect();
      const records = await FeedInventory.find({ isDeleted: false }).populate([]).sort({ createdAt: -1 });
      return successResponse(records, 'FeedInventory fetched successfully');
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
      const record = await FeedInventory.create(body);
      return createdResponse(record, 'FeedInventory created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
