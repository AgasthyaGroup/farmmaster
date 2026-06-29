import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import FeedInventory from '@/src/models/FeedInventory';
import Farm from '@/src/models/Farm';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      await dbConnect();
      const records = await FeedInventory.find({ isDeleted: false }).populate(['farmId']).sort({ createdAt: -1 });
      return successResponse(records, 'FeedInventory fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      // Sanitize numeric fields dynamically to prevent DB crash
      const numericFields = ['oldStock', 'bought', 'usage', 'remainingStock'];
      for (const field of numericFields) {
        const val = Number(body[field]);
        body[field] = isNaN(val) ? 0 : val;
      }

      const totalAvailable = body.oldStock + body.bought;
      if (body.usage > totalAvailable) {
        return errorResponse(`Usage (${body.usage}) cannot exceed total available stock (${totalAvailable} = Old Stock + Bought)`, 400);
      }
      body.remainingStock = totalAvailable - body.usage;

      // Sanitize date fields dynamically to prevent DB crash
      if (body.purchaseDate) {
        const parsed = new Date(body.purchaseDate);
        body.purchaseDate = isNaN(parsed.getTime()) ? null : parsed;
      } else {
        body.purchaseDate = null;
      }

      const record = await FeedInventory.create(body);
      return createdResponse(record, 'FeedInventory created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
