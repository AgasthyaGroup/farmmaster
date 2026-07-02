import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassManagement from '@/src/models/GrassManagement';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const records = await GrassManagement.find({ isDeleted: false })
        .populate('sourcingTo')
        .sort({ createdAt: -1 })
        .lean();
      return successResponse(records, 'Grass Sourcing Farms fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await GrassManagement.create(body);
      return createdResponse(record, 'Grass Sourcing Farm created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
