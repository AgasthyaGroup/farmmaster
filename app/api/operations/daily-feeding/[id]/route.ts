import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DailyFeeding from '@/src/models/DailyFeeding';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'FEEDING'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await DailyFeeding.findById(id);
      if (!record || record.isDeleted) {
        return errorResponse('DailyFeeding not found', 404);
      }
      return successResponse(record, 'DailyFeeding fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'FEEDING'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      // Sanitize optional feeding attributes to numeric default 0
      const feedingFields = [
        'greenGrass',
        'dryGrass',
        'cottonCake',
        'chunni',
        'maize',
        'wheatBran',
        'salt',
        'oralCalcium',
        'mineralMixture'
      ];
      feedingFields.forEach(f => {
        if (body[f] === "" || body[f] === undefined || body[f] === null) {
          body[f] = 0;
        } else {
          const val = Number(body[f]);
          body[f] = isNaN(val) ? 0 : val;
        }
      });

      const record = await DailyFeeding.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('DailyFeeding not found', 404);
      }
      return successResponse(record, 'DailyFeeding updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INVENTORY', 'FEEDING'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await DailyFeeding.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('DailyFeeding not found', 404);
      }
      return successResponse(null, 'DailyFeeding deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
