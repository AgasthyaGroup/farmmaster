import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import ProcurementSource from '@/src/models/ProcurementSource';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'PROCUREMENT_MANAGEMENT', 'MILK'], async () => {
    try {
      await dbConnect();
      const sources = await ProcurementSource.find({ isDeleted: false })
        .populate('farmId', 'name code')
        .sort({ name: 1 });
      return successResponse(sources, 'Procurement sources fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'PROCUREMENT_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      const code = body?.code?.trim() || '';
      const location = body?.location?.trim() || '';
      const phone = body?.phone?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      // Check duplicate name
      const existing = await ProcurementSource.findOne({ name });
      if (existing) {
        if (!existing.isDeleted) {
          return errorResponse('Procurement source name already exists', 400);
        }
        // Restore soft-deleted record
        const restored = await ProcurementSource.findByIdAndUpdate(
          existing._id,
          { code, location, phone, status, farmId, isDeleted: false },
          { new: true }
        );
        return createdResponse(restored, 'Procurement source created successfully');
      }

      const source = await ProcurementSource.create({
        name,
        code,
        location,
        phone,
        status,
        farmId,
      });

      return createdResponse(source, 'Procurement source created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
