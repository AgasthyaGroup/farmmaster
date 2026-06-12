import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';
import Farm from '@/src/models/Farm';
import { reconcileGreenGrassFeedInventory } from '../route';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await GrassCollection.findById(id).lean();
      if (!record || record.isDeleted) {
        return errorResponse('GrassCollection not found', 404);
      }

      // Manually populate farmId
      let farmObj = null;
      if (record.farmId) {
        const valStr = String(record.farmId).trim();
        if (mongoose.Types.ObjectId.isValid(valStr)) {
          farmObj = await Farm.findById(valStr).lean();
        } else {
          farmObj = await Farm.findOne({ code: valStr }).lean();
        }
      }

      const populated = {
        ...record,
        farmId: farmObj || (record.farmId ? { name: String(record.farmId) } : null)
      };

      return successResponse(populated, 'GrassCollection fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const oldRecord = await GrassCollection.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('GrassCollection not found', 404);
      }

      const record = await GrassCollection.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record) {
        return errorResponse('GrassCollection not found', 404);
      }

      if (record.farmId && record.date) {
        await reconcileGreenGrassFeedInventory(record.farmId, record.date);
        if (oldRecord.date && (new Date(record.date).toDateString() !== new Date(oldRecord.date).toDateString() || String(record.farmId) !== String(oldRecord.farmId))) {
          await reconcileGreenGrassFeedInventory(oldRecord.farmId, oldRecord.date);
        }
      }

      return successResponse(record, 'GrassCollection updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();

      const oldRecord = await GrassCollection.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('GrassCollection not found', 404);
      }

      const record = await GrassCollection.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('GrassCollection not found', 404);
      }

      if (oldRecord.farmId && oldRecord.date) {
        await reconcileGreenGrassFeedInventory(oldRecord.farmId, oldRecord.date);
      }

      return successResponse(null, 'GrassCollection deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

