import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';
import Farm from '@/src/models/Farm';

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

      const oldWeight = oldRecord.weight || 0;
      const newWeight = record.weight || 0;
      const diff = newWeight - oldWeight;

      if (diff !== 0) {
        const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
        const latestFeed = await FeedInventory.findOne({
          feedType: { $regex: /^green\s*grass$/i },
          farmId: record.farmId,
          isDeleted: false
        }).sort({ createdAt: -1 });

        const oldStock = latestFeed ? latestFeed.remainingStock : 0;
        const remainingStock = oldStock + diff;

        await FeedInventory.create({
          feedType: 'Green Grass',
          oldStock,
          bought: diff,
          usage: 0,
          remainingStock,
          purchaseDate: record.date || new Date(),
          farmId: record.farmId,
          isDeleted: false
        });
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

      const oldWeight = oldRecord.weight || 0;
      if (oldWeight > 0) {
        const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
        const latestFeed = await FeedInventory.findOne({
          feedType: { $regex: /^green\s*grass$/i },
          farmId: record.farmId,
          isDeleted: false
        }).sort({ createdAt: -1 });

        const oldStock = latestFeed ? latestFeed.remainingStock : 0;
        const diff = -oldWeight;
        const remainingStock = oldStock + diff;

        await FeedInventory.create({
          feedType: 'Green Grass',
          oldStock,
          bought: diff,
          usage: 0,
          remainingStock,
          purchaseDate: new Date(),
          farmId: record.farmId,
          isDeleted: false
        });
      }

      return successResponse(null, 'GrassCollection deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

