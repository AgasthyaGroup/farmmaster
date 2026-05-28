import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION'], async () => {
    try {
      await dbConnect();
      const records = await GrassCollection.find({ isDeleted: false }).populate(['farmId']).sort({ createdAt: -1 });
      return successResponse(records, 'GrassCollection fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await GrassCollection.create(body);
      return createdResponse(record, 'GrassCollection created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
