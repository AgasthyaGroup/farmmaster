import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import LiveStock from '@/src/models/LiveStock';
import Cattle from '@/src/models/Cattle';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import { deepSanitizeCattleInput, mapLiveStockToCattle } from '../route';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async (user) => {
    try {
      const { id } = await params;
      const body = await req.json();

      // Deep sanitize all input dates, numbers, and references to prevent DB crash
      deepSanitizeCattleInput(body, user.farmId);

      await dbConnect();

      // Find the existing record first in LiveStock registry
      let record = await LiveStock.findById(id);
      let matchingTag = record ? record.tag_id : null;

      if (!record && body.tag_id) {
        // Fallback search by tag_id
        record = await LiveStock.findOne({ tag_id: body.tag_id });
        matchingTag = record ? record.tag_id : body.tag_id;
      }

      if (!record) {
        return errorResponse('Livestock record not found in registry', 404);
      }

      // 1. Update in the primary LiveStock collection
      const updatedLiveStock = await LiveStock.findByIdAndUpdate(record._id, body, {
        new: true,
        runValidators: true,
      });

      // 2. Synchronously update in legacy Cattle collection to keep collections aligned
      try {
        const query = matchingTag ? { tag: matchingTag } : { _id: id };
        await Cattle.findOneAndUpdate(query, body, { new: true });
      } catch (legacyErr) {
        console.error('Non-blocking legacy sync error during update:', legacyErr);
      }

      return successResponse(mapLiveStockToCattle(updatedLiveStock), 'Cattle record updated successfully in unified registry');
    } catch (error: any) {
      console.error('[PUT /api/cattle/[id]] Controller crash prevented:', error);
      return errorResponse(error.message || 'Failed to update cattle due to database mismatch.', 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      const { id } = await params;
      await dbConnect();

      const record = await LiveStock.findById(id);
      let matchingTag = record ? record.tag_id : null;

      const deletedLiveStock = await LiveStock.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
      if (!deletedLiveStock) {
        return errorResponse('Livestock record not found', 404);
      }

      try {
        const query = matchingTag ? { tag: matchingTag } : { _id: id };
        await Cattle.findOneAndUpdate(query, { isDeleted: true });
      } catch (legacyErr) {
        console.error('Non-blocking legacy sync error during delete:', legacyErr);
      }

      return successResponse(deletedLiveStock, 'Cattle record soft-deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
