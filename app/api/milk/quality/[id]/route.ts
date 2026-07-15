import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkQuality from '@/src/models/MilkQuality';
import BMC from '@/src/models/BMC';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MilkQuality.findById(id).populate([]);
      if (!record || record.isDeleted) {
        return errorResponse('MilkQuality not found', 404);
      }
      return successResponse(record, 'MilkQuality fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION'], async () => {
    try {
      const { id } = await params;
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
      }

      const record = await MilkQuality.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('MilkQuality not found', 404);
      }

      // Update BMC current volume: liters - indentLiters
      if (body.bmcs && body.bmcs.length > 0) {
        const bmcId = body.bmcs[0].bmcId;
        const liters = body.bmcs[0].liters || 0;
        const indentLiters = body.indentLiters || 0;
        const netVolume = Math.max(0, liters - indentLiters);
        await BMC.findByIdAndUpdate(bmcId, { currentVolume: netVolume });
      }

      return successResponse(record, 'MilkQuality updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MilkQuality.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('MilkQuality not found', 404);
      }

      // Reset BMC current volume to 0
      if (record.bmcs && record.bmcs.length > 0) {
        const bmcId = record.bmcs[0].bmcId;
        await BMC.findByIdAndUpdate(bmcId, { currentVolume: 0 });
      }

      return successResponse(null, 'MilkQuality deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
