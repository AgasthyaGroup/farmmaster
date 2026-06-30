import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MedicineInventory from '@/src/models/MedicineInventory';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MedicineInventory.findById(id).populate([]);
      if (!record || record.isDeleted) {
        return errorResponse('MedicineInventory not found', 404);
      }
      return successResponse(record, 'MedicineInventory fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const existing = await MedicineInventory.findById(id);
      if (!existing || existing.isDeleted) {
        return errorResponse('MedicineInventory not found', 404);
      }

      // Merge and validate numeric bounds
      const oldStock = body.oldStock !== undefined ? Number(body.oldStock) : existing.oldStock;
      const bought = body.bought !== undefined ? Number(body.bought) : existing.bought;
      const used = body.used !== undefined ? Number(body.used) : existing.used;

      const totalAvailable = (isNaN(oldStock) ? 0 : oldStock) + (isNaN(bought) ? 0 : bought);
      const usedVal = isNaN(used) ? 0 : used;

      if (usedVal > totalAvailable) {
        return errorResponse(`Used quantity (${usedVal}) cannot exceed total available stock (${totalAvailable} = Old Stock + Bought)`, 400);
      }

      body.presentStock = totalAvailable - usedVal;

      const record = await MedicineInventory.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      return successResponse(record, 'MedicineInventory updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INVENTORY', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await MedicineInventory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('MedicineInventory not found', 404);
      }
      return successResponse(null, 'MedicineInventory deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
