import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Labor from '@/src/models/Labor';
import Designation from '@/src/models/Designation'; // registers Designation schema for populate
import Farm from '@/src/models/Farm'; // registers Farm schema for populate
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const records = await Labor.find({ isDeleted: { $ne: true } })
        .populate({ path: 'designationId', select: 'name status' })
        .populate({ path: 'farmId', select: 'name code' })
        .sort({ createdAt: -1 })
        .lean();
      return successResponse(records, 'Labors fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      if (!body.name || !String(body.name).trim()) {
        return errorResponse('Labor employee name is required', 400);
      }
      if (!body.designationId) {
        return errorResponse('Designation ID is required', 400);
      }
      if (!body.farmId) {
        return errorResponse('Farm ID is required', 400);
      }

      const record = await Labor.create({
        name: String(body.name).trim(),
        designationId: body.designationId,
        farmId: body.farmId,
        phone: body.phone ? String(body.phone).trim() : '',
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });

      const populated = await Labor.findById(record._id)
        .populate({ path: 'designationId', select: 'name status' })
        .populate({ path: 'farmId', select: 'name code' })
        .lean();

      return createdResponse(populated, 'Labor employee registered successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
