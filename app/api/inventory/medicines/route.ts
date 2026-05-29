import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MedicineInventory from '@/src/models/MedicineInventory';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await MedicineInventory.find({ isDeleted: false }).populate([]).sort({ createdAt: -1 });
      return successResponse(records, 'MedicineInventory fetched successfully');
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

      // Sanitize numeric fields dynamically to prevent DB crash
      const numericFields = ['oldStock', 'bought', 'used', 'presentStock'];
      for (const field of numericFields) {
        const val = Number(body[field]);
        body[field] = isNaN(val) ? 0 : val;
      }

      // Sanitize date fields dynamically to prevent DB crash
      const dateFields = ['purchaseDate', 'expiryDate'];
      for (const field of dateFields) {
        if (body[field]) {
          const parsed = new Date(body[field]);
          body[field] = isNaN(parsed.getTime()) ? null : parsed;
        } else {
          body[field] = null;
        }
      }

      const record = await MedicineInventory.create(body);
      return createdResponse(record, 'MedicineInventory created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
