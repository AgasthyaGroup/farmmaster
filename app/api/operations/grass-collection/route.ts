import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassCollection from '@/src/models/GrassCollection';
import Farm from '@/src/models/Farm';
import Land from '@/src/models/Land';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async () => {
    try {
      await dbConnect();
      const records = await GrassCollection.find({ isDeleted: false })
        .populate({
          path: 'sourcingFarmId',
          populate: { path: 'sourcingTo' }
        })
        .populate('laborId')
        .sort({ createdAt: -1 })
        .lean();

      // Gather distinct valid ObjectIds and string codes for farmId
      const validFarmIds: mongoose.Types.ObjectId[] = [];
      const farmCodes: string[] = [];

      records.forEach(r => {
        if (r.farmId) {
          const valStr = String(r.farmId).trim();
          if (mongoose.Types.ObjectId.isValid(valStr)) {
            validFarmIds.push(new mongoose.Types.ObjectId(valStr));
          } else {
            farmCodes.push(valStr);
          }
        }
      });

      // Query Farm collection for matches by either ObjectId or Code
      const farms = await Farm.find({
        $or: [
          { _id: { $in: validFarmIds } },
          { code: { $in: farmCodes } }
        ]
      }).lean();

      // Index farms for O(1) lookup
      const farmByIdMap = new Map(farms.map(f => [f._id.toString(), f]));
      const farmByCodeMap = new Map(farms.map(f => [f.code.toUpperCase(), f]));

      // Populate records
      const populated = records.map(r => {
        let farmObj = null;
        if (r.farmId) {
          const valStr = String(r.farmId).trim();
          if (mongoose.Types.ObjectId.isValid(valStr)) {
            farmObj = farmByIdMap.get(valStr);
          } else {
            farmObj = farmByCodeMap.get(valStr.toUpperCase());
          }
        }
        const yieldVal = r.weight && r.harvestedArea ? Number((r.weight / r.harvestedArea).toFixed(2)) : null;
        return {
          ...r,
          yield: yieldVal,
          farmId: farmObj || (r.farmId ? { name: String(r.farmId) } : null)
        };
      });

      return successResponse(populated, 'GrassCollection fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async (user) => {
    try {
      const body = await req.json();
      if (body.noOfLoads !== undefined && Number(body.noOfLoads) <= 0) {
        return errorResponse('Number of Loads must be greater than zero', 400);
      }
      if (body.weight !== undefined && Number(body.weight) <= 0) {
        return errorResponse('Weight must be greater than zero', 400);
      }
      if (body.noOfWorkers !== undefined && Number(body.noOfWorkers) <= 0) {
        return errorResponse('Number of Workers must be greater than zero', 400);
      }
      if (body.harvestedArea !== undefined && body.harvestedArea !== '' && body.harvestedArea !== null) {
        if (Number(body.harvestedArea) <= 0) {
          return errorResponse('Harvested Area must be greater than zero', 400);
        }
      }
      if (body.laborId === '') {
        body.laborId = null;
      }
      if (body.sourcingFarmId === '') {
        body.sourcingFarmId = null;
      }
      await dbConnect();

      if (body.grassAge !== undefined && body.grassAge !== '' && body.grassAge !== null) {
        if (Number(body.grassAge) < 0) {
          return errorResponse('Grass Age cannot be negative', 400);
        }
      }

      if (body.sourcingFarmId && body.harvestedArea !== undefined && body.harvestedArea !== '' && body.harvestedArea !== null) {
        const land = await Land.findById(body.sourcingFarmId).lean();
        if (land && land.totalArea) {
          let totalAreaAcres = land.totalArea;
          if (land.unit === 'Hectares') totalAreaAcres = totalAreaAcres * 2.47105;
          if (land.unit === 'Sq Meters') totalAreaAcres = totalAreaAcres * 0.000247105;

          const query: any = {
            sourcingFarmId: body.sourcingFarmId,
            isDeleted: false
          };
          if (land.lastRegrownAt) {
            query.date = { $gt: new Date(land.lastRegrownAt) };
          }
          const collections = await GrassCollection.find(query).lean();
          const utilized = collections.reduce((sum, col) => sum + (col.harvestedArea || 0), 0);
          const available = Math.max(0, totalAreaAcres - utilized);
          if (Number(body.harvestedArea) > available) {
            return errorResponse(`Harvested Area (${body.harvestedArea} Acres) exceeds available area (${available.toFixed(2)} Acres) for this land.`, 400);
          }
        }
      }

      // ── Resolve farmId Dynamically ──────────────────────────────────────
      let resolvedFarmId: string | null = null;

      // Primary check: Resolve from sourcingFarmId's destination (farmId)
      if (body.sourcingFarmId) {
        const land = await Land.findById(body.sourcingFarmId).lean();
        if (land && land.farmId) {
          resolvedFarmId = land.farmId.toString();
        }
      }

      // Secondary check: user submitted farmId
      if (!resolvedFarmId) {
        const rawFarmId = body.farmId ? String(body.farmId).trim() : '';
        if (rawFarmId && /^[0-9a-fA-F]{24}$/.test(rawFarmId)) {
          resolvedFarmId = rawFarmId;
        } else if (rawFarmId && rawFarmId !== 'UNKNOWN_FARM') {
          const farm = await Farm.findOne({ code: rawFarmId });
          if (farm) {
            resolvedFarmId = farm._id.toString();
          }
        }
      }

      // Fallback 1: Authenticated user's farmId from session token
      if (!resolvedFarmId && user.farmId) {
        resolvedFarmId = user.farmId.toString();
      }

      // Fallback 2: System default (first active farm found)
      if (!resolvedFarmId) {
        const defaultFarm = await Farm.findOne({ isDeleted: { $ne: true } });
        if (defaultFarm) {
          resolvedFarmId = defaultFarm._id.toString();
        }
      }

      if (resolvedFarmId) {
        body.farmId = new mongoose.Types.ObjectId(resolvedFarmId);
      } else {
        delete body.farmId;
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

      const record = await GrassCollection.create(body);

      // Automatically add/update FeedInventory for 'Green Grass' (unified daily entry)
      if (record.farmId && record.date) {
        await reconcileGreenGrassFeedInventory(record.farmId, record.date);
      }

      return createdResponse(record, 'GrassCollection created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

/**
 * Reconciles the Green Grass Feed Inventory for a farm on a given day to ensure
 * there is only at most one consolidated FeedInventory entry for that day.
 */
export async function reconcileGreenGrassFeedInventory(farmId: mongoose.Types.ObjectId, date: Date) {
  try {
    const FeedInventory = mongoose.models.FeedInventory || mongoose.model('FeedInventory');
    const GrassCollection = mongoose.models.GrassCollection || mongoose.model('GrassCollection');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Sum all non-deleted grass collections for this farm on this day
    const dailyCollections = await GrassCollection.find({
      farmId,
      isDeleted: false,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalWeight = dailyCollections.reduce((sum, gc) => sum + (gc.weight || 0), 0);

    // Find if there is already a FeedInventory entry for 'Green Grass' on this day
    let feedEntry = await FeedInventory.findOne({
      feedType: { $regex: /^green\s*grass$/i },
      farmId,
      isDeleted: false,
      purchaseDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (totalWeight === 0) {
      if (feedEntry) {
        feedEntry.isDeleted = true;
        await feedEntry.save();
      }
    } else if (feedEntry) {
      // Update existing feed entry
      feedEntry.bought = totalWeight;
      feedEntry.remainingStock = (feedEntry.oldStock || 0) + totalWeight - (feedEntry.usage || 0);
      await feedEntry.save();
    } else {
      // Create new feed entry. Get oldStock from the latest previous record
      const latestFeed = await FeedInventory.findOne({
        feedType: { $regex: /^green\s*grass$/i },
        farmId,
        isDeleted: false,
        purchaseDate: { $lt: startOfDay }
      }).sort({ purchaseDate: -1, createdAt: -1 });

      const oldStock = latestFeed ? latestFeed.remainingStock : 0;
      const remainingStock = oldStock + totalWeight;

      feedEntry = await FeedInventory.create({
        feedType: 'Green Grass',
        oldStock,
        bought: totalWeight,
        usage: 0,
        remainingStock,
        purchaseDate: startOfDay,
        farmId,
        isDeleted: false
      });
    }

    // Cascade update subsequent FeedInventory entries for 'Green Grass' to keep remainingStock correct
    let subsequentEntries = await FeedInventory.find({
      feedType: { $regex: /^green\s*grass$/i },
      farmId,
      isDeleted: false,
      purchaseDate: { $gt: endOfDay }
    }).sort({ purchaseDate: 1, createdAt: 1 });

    let currentRemaining = feedEntry && !feedEntry.isDeleted ? feedEntry.remainingStock : (
      await FeedInventory.findOne({
        feedType: { $regex: /^green\s*grass$/i },
        farmId,
        isDeleted: false,
        purchaseDate: { $lt: startOfDay }
      }).sort({ purchaseDate: -1, createdAt: -1 })
    )?.remainingStock || 0;

    for (const entry of subsequentEntries) {
      entry.oldStock = currentRemaining;
      entry.remainingStock = currentRemaining + (entry.bought || 0) - (entry.usage || 0);
      await entry.save();
      currentRemaining = entry.remainingStock;
    }
  } catch (error) {
    console.error('[reconcileGreenGrassFeedInventory] Error:', error);
  }
}
