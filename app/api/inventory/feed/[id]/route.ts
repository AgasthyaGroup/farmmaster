import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import FeedInventory from '@/src/models/FeedInventory';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await FeedInventory.findById(id).populate([]);
      if (!record || record.isDeleted) {
        return errorResponse('FeedInventory not found', 404);
      }
      return successResponse(record, 'FeedInventory fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const existing = await FeedInventory.findById(id);
      if (!existing || existing.isDeleted) {
        return errorResponse('FeedInventory not found', 404);
      }

      // Merge and validate numeric bounds
      const oldStock = body.oldStock !== undefined ? Number(body.oldStock) : existing.oldStock;
      const bought = body.bought !== undefined ? Number(body.bought) : existing.bought;
      const usage = body.usage !== undefined ? Number(body.usage) : existing.usage;

      const totalAvailable = (isNaN(oldStock) ? 0 : oldStock) + (isNaN(bought) ? 0 : bought);
      const usageVal = isNaN(usage) ? 0 : usage;

      if (usageVal > totalAvailable) {
        return errorResponse(`Usage (${usageVal}) cannot exceed total available stock (${totalAvailable} = Old Stock + Bought)`, 400);
      }

      body.remainingStock = totalAvailable - usageVal;

      const record = await FeedInventory.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return successResponse(record, 'FeedInventory updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INVENTORY'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await FeedInventory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('FeedInventory not found', 404);
      }
      return successResponse(null, 'FeedInventory deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
