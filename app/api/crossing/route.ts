import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import CrossingLog from '@/src/models/CrossingLog';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { objectIdSchema } from '@/src/utils/validation';
import { z } from 'zod';


export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await CrossingLog.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'CrossingLogs fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

const crossingSchema = z.object({
  farmId: objectIdSchema
}).passthrough();

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      let body = await req.json();
      const parsedBody = crossingSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid farmId', 400);
      }
      body = parsedBody.data;

      await dbConnect();
      const record = await CrossingLog.create(body);
      return createdResponse(record, 'CrossingLog created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
