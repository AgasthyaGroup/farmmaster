import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DailyFeeding from '@/src/models/DailyFeeding';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { resolveTagString } from '@/src/models/Logs';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'FEEDING'], async () => {
    try {
      await dbConnect();
      const records = await DailyFeeding.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'DailyFeeding fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

async function deductFeedInventory(feedName: string, quantity: number, farmId: any, date: Date) {
  if (quantity <= 0) return;
  const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
  
  const latestFeed = await FeedInventory.findOne({
    feedType: { $regex: new RegExp(`^${feedName}$`, 'i') },
    farmId,
    isDeleted: false
  }).sort({ createdAt: -1 });

  const oldStock = latestFeed ? latestFeed.remainingStock : 0;
  const usage = quantity;
  const remainingStock = oldStock - usage;

  await FeedInventory.create({
    feedType: feedName,
    oldStock,
    bought: 0,
    usage,
    remainingStock,
    purchaseDate: date,
    farmId,
    isDeleted: false
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'INVENTORY', 'FEEDING'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      // Normalize fields to tag_id / animalId
      if (!body.tag_id) {
        body.tag_id = String(body.animalId || body.tagId || body.tag || '').trim();
      }
      if (!body.animalId) {
        body.animalId = body.tag_id;
      }

      if (!body.tag_id) {
        return errorResponse('animalId (animal tag) is required for daily feeding logs', 400);
      }

      // Resolve dynamic ObjectId to human-readable tag string if submitted by frontend selector
      body.tag_id = await resolveTagString(body.tag_id);
      body.animalId = body.tag_id;

      // ── Validation Interceptor Check ──────────────────────────────────────
      const cleanTag = String(body.tag_id).trim().toUpperCase();
      const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
      const isRowLog = cleanTag.startsWith('ROW ');
      const animalExists = isRowLog ? true : await LiveStock.findOne({ tag_id: cleanTag, isDeleted: false });
      if (!animalExists) {
        return errorResponse(
          'Data Validation Error: Cannot log transaction. The targeted Tag ID does not exist in the Live Stock registry.',
          400
        );
      }

      // Safe date fallback to prevent DB validation crash
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (isNaN(parsedDate.getTime())) {
          body.date = new Date();
        } else {
          body.date = parsedDate;
        }
      } else {
        body.date = new Date();
      }

      // Sanitize optional feeding attributes to numeric default 0
      const feedingFields = [
        'greenGrass',
        'dryGrass',
        'cottonCake',
        'chunni',
        'maize',
        'wheatBran',
        'salt',
        'oralCalcium',
        'mineralMixture'
      ];
      feedingFields.forEach(f => {
        if (body[f] === "" || body[f] === undefined || body[f] === null) {
          body[f] = 0;
        } else {
          const val = Number(body[f]);
          body[f] = isNaN(val) ? 0 : val;
        }
      });

      // Check stock availability
      const mapping = {
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

      const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
      for (const [key, feedName] of Object.entries(mapping)) {
        const qty = Number(body[key]) || 0;
        if (qty > 0) {
          const latestFeed = await FeedInventory.findOne({
            feedType: { $regex: new RegExp(`^${feedName}$`, 'i') },
            farmId: body.farmId,
            isDeleted: false
          }).sort({ createdAt: -1 });

          const available = latestFeed ? latestFeed.remainingStock : 0;
          if (available < qty) {
            return errorResponse(
              `Insufficient stock for ${feedName}. Available: ${available} units, requested: ${qty} units.`,
              400
            );
          }
        }
      }

      const record = await DailyFeeding.create(body);

      // Deduct inventory for all consumed feeds


      for (const [key, feedName] of Object.entries(mapping)) {
        const qty = Number(record[key]) || 0;
        if (qty > 0) {
          await deductFeedInventory(feedName, qty, record.farmId, record.date);
        }
      }

      return createdResponse(record, 'DailyFeeding created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

