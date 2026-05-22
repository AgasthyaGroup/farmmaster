import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import TreatmentLog from '@/src/models/TreatmentLog';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await TreatmentLog.find({ isDeleted: false }).populate(['tagId', 'shedId', 'animalId']).sort({ createdAt: -1 });
      return successResponse(records, 'TreatmentLog fetched successfully');
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
      const record = await TreatmentLog.create(body);
      return createdResponse(record, 'TreatmentLog created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
