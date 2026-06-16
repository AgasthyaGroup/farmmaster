import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
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

async function adjustFeedInventory(feedName: string, usageDiff: number, farmId: any, date: Date) {
  if (usageDiff === 0) return;
  const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
  
  const latestFeed = await FeedInventory.findOne({
    feedType: { $regex: new RegExp(`^${feedName}$`, 'i') },
    farmId,
    isDeleted: false
  }).sort({ createdAt: -1 });

  const oldStock = latestFeed ? latestFeed.remainingStock : 0;
  // usageDiff > 0 means more was consumed (remainingStock goes down)
  // usageDiff < 0 means less was consumed (remainingStock goes up)
  const remainingStock = oldStock - usageDiff;

  await FeedInventory.create({
    feedType: feedName,
    oldStock,
    bought: 0,
    usage: usageDiff,
    remainingStock,
    purchaseDate: date,
    farmId,
    isDeleted: false
  });
}

const FEEDING_MAPPING = {
  greenGrass: 'Green Grass',
  dryGrass: 'Dry Grass',
  cottonCake: 'Cotton Cake',
  chunni: 'Chunni',
  maize: 'Maize',
  wheatBran: 'Wheat Bran',
  salt: 'Salt',
  oralCalcium: 'Oral Calcium',
  mineralMixture: 'Mineral Mixture'
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'FEEDING'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const oldRecord = await DailyFeeding.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('DailyFeeding not found', 404);
      }

      // Sanitize optional feeding attributes to numeric default 0
      const feedingFields = Object.keys(FEEDING_MAPPING);
      feedingFields.forEach(f => {
        if (body[f] === "" || body[f] === undefined || body[f] === null) {
          body[f] = 0;
        } else {
          const val = Number(body[f]);
          body[f] = isNaN(val) ? 0 : val;
        }
      });

      // Validate stock for any increased feed consumption
      const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
      for (const [key, feedName] of Object.entries(FEEDING_MAPPING)) {
        const oldQty = Number(oldRecord[key]) || 0;
        const newQty = Number(body[key]) || 0;
        const diff = newQty - oldQty;
        if (diff > 0) {
          const latestFeed = await FeedInventory.findOne({
            feedType: { $regex: new RegExp(`^${feedName}$`, 'i') },
            farmId: oldRecord.farmId,
            isDeleted: false
          }).sort({ createdAt: -1 });

          const available = latestFeed ? latestFeed.remainingStock : 0;
          if (available < diff) {
            return errorResponse(
              `Insufficient stock for ${feedName}. Available: ${available} units, requested increase: ${diff} units.`,
              400
            );
          }
        }
      }

      const record = await DailyFeeding.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record) {
        return errorResponse('DailyFeeding not found', 404);
      }

      // Adjust inventory based on differences
      for (const [key, feedName] of Object.entries(FEEDING_MAPPING)) {
        const oldQty = Number(oldRecord[key]) || 0;
        const newQty = Number(record[key]) || 0;
        const diff = newQty - oldQty;
        if (diff !== 0) {
          await adjustFeedInventory(feedName, diff, record.farmId, record.date || new Date());
        }
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

      const oldRecord = await DailyFeeding.findById(id).lean();
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('DailyFeeding not found', 404);
      }

      const record = await DailyFeeding.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('DailyFeeding not found', 404);
      }

      // Restore inventory (negative diff = positive restore)
      for (const [key, feedName] of Object.entries(FEEDING_MAPPING)) {
        const oldQty = Number(oldRecord[key]) || 0;
        if (oldQty > 0) {
          await adjustFeedInventory(feedName, -oldQty, record.farmId, new Date());
        }
      }

      return successResponse(null, 'DailyFeeding deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

