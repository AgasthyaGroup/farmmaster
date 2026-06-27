import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DailyFeeding from '@/src/models/DailyFeeding';
import FeedItem from '@/src/models/FeedItem';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import { resolveTagString } from '@/src/models/Logs';
import mongoose from 'mongoose';

// Helper to determine camelCase field key from feed item name, matching legacy fields precisely
function getFeedFieldKey(name: string) {
  const clean = name.trim().toLowerCase();
  if (clean === 'green grass') return 'greenGrass';
  if (clean === 'dry grass') return 'dryGrass';
  if (clean === 'cotton cake' || clean === 'c.cake' || clean === 'c. cake') return 'cottonCake';
  if (clean === 'chunni') return 'chunni';
  if (clean === 'maize') return 'maize';
  if (clean === 'wheat bran') return 'wheatBran';
  if (clean === 'salt') return 'salt';
  if (clean === 'oral calcium') return 'oralCalcium';
  if (clean === 'mineral mixture') return 'mineralMixture';
  
  // Dynamic camelCase fallback for new custom items
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '') // remove special characters
    .split(/\s+/)
    .map((word, idx) => idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
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
      const { date, session, farmId, shedId, collections } = body;

      if (!collections || !Array.isArray(collections)) {
        return errorResponse('Collections array is required', 400);
      }

      await dbConnect();
      const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
      const savedRecords = [];

      const baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) {
        return errorResponse('Invalid date provided', 400);
      }

      // Fetch all active feed items globally
      const activeFeedItems = await FeedItem.find({ isDeleted: false });
      
      // Build dynamic mapping: key -> name
      const mapping: Record<string, string> = {};
      activeFeedItems.forEach(item => {
        const key = getFeedFieldKey(item.name);
        mapping[key] = item.name;
      });

      const feedFields = Object.keys(mapping);

      // 1. First Pass: Validate animals and sum feed consumption for stock checks
      const feedTotals: Record<string, number> = {};
      feedFields.forEach(f => { feedTotals[f] = 0; });

      const verifiedAnimals = [];

      for (const item of collections) {
        let tagId = item.tag_id || item.tagId || item.tag || '';
        if (!tagId) continue;

        const cleanTag = String(tagId).trim().toUpperCase();
        const resolvedTag = await resolveTagString(cleanTag);
        
        const isRowLog = resolvedTag.startsWith('ROW ');
        const animalExists = isRowLog ? true : await LiveStock.findOne({ tag_id: resolvedTag, isDeleted: false });
        
        if (!animalExists) {
          return errorResponse(
            `Data Validation Error: Cannot log transaction. The targeted Tag ID "${resolvedTag}" does not exist in the Live Stock registry.`,
            400
          );
        }

        // Sanitize numbers
        const sanitizedItem: Record<string, any> = { tag_id: resolvedTag, animalId: resolvedTag };
        feedFields.forEach(f => {
          let val = 0;
          if (item[f] !== "" && item[f] !== undefined && item[f] !== null) {
            const num = Number(item[f]);
            val = isNaN(num) ? 0 : num;
          }
          sanitizedItem[f] = val;
          feedTotals[f] += val;
        });

        verifiedAnimals.push(sanitizedItem);
      }

      // 2. Stock Checks
      const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
      for (const [key, feedName] of Object.entries(mapping)) {
        const totalNeeded = feedTotals[key];
        if (totalNeeded > 0) {
          const latestFeed = await FeedInventory.findOne({
            feedType: { $regex: new RegExp(`^${feedName}$`, 'i') },
            farmId,
            isDeleted: false
          }).sort({ createdAt: -1 });

          const available = latestFeed ? latestFeed.remainingStock : 0;
          if (available < totalNeeded) {
            return errorResponse(
              `Insufficient stock for ${feedName}. Available: ${available} units, requested for this shed: ${totalNeeded} units.`,
              400
            );
          }
        }
      }

      // 3. Second Pass: Upsert records and deduct inventory
      for (const animalData of verifiedAnimals) {
        // Upsert entry for this animal, date, session
        const filter = {
          tag_id: animalData.tag_id,
          date: baseDate,
          session,
          shedId,
          farmId,
        };

        const update = {
          ...animalData,
          session,
          isDeleted: false,
        };

        const doc = await DailyFeeding.findOneAndUpdate(filter, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        });
        savedRecords.push(doc);
      }

      // Deduct inventory
      for (const [key, feedName] of Object.entries(mapping)) {
        const totalNeeded = feedTotals[key];
        if (totalNeeded > 0) {
          await deductFeedInventory(feedName, totalNeeded, farmId, baseDate);
        }
      }

      return successResponse(savedRecords, 'Bulk daily feeding recorded successfully');
    } catch (error: any) {
      console.error('[POST /api/operations/daily-feeding/bulk] Error:', error);
      return errorResponse(error.message, 500);
    }
  });
}
