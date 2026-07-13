import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkProcurement from '@/src/models/MilkProcurement';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK'], async () => {
    try {
      await dbConnect();
      const records = await MilkProcurement.find({ isDeleted: false }).sort({ date: -1, createdAt: -1 });
      return successResponse(records, 'Milk procurement records fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      // Safe date parsing/fallback
      if (body.date) {
        const parsedDate = new Date(body.date);
        body.date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      } else {
        body.date = new Date();
      }

      if (!body.procuredFrom) {
        return errorResponse('procuredFrom is required', 400);
      }

      if (body.liters === undefined || body.liters === null) {
        return errorResponse('liters is required', 400);
      }

      const record = await MilkProcurement.create(body);
      return createdResponse(record, 'Milk procurement record created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
