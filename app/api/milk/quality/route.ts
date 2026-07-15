import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkQuality from '@/src/models/MilkQuality';
import BMC from '@/src/models/BMC';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      // Safe date fallback to prevent DB validation crash
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (isNaN(parsedDate.getTime())) {
          body.date = new Date();
        } else {
          body.date = parsedDate;
        }
      } else {
        body.date = new Date();
      }

      const record = await MilkQuality.create(body);

      // Update BMC current volume: liters - indentLiters
      if (body.bmcs && body.bmcs.length > 0) {
        const bmcId = body.bmcs[0].bmcId;
        const liters = body.bmcs[0].liters || 0;
        const indentLiters = body.indentLiters || 0;
        const netVolume = Math.max(0, liters - indentLiters);
        await BMC.findByIdAndUpdate(bmcId, { currentVolume: netVolume });
      }

      return createdResponse(record, 'MilkQuality created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
