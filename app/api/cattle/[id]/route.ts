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

      // Prevent Mongoose/MongoDB from trying to update immutable _id/id fields
      delete body._id;
      delete body.id;

      // Prevent stale status overwrite from PUT requests
      const isStaleStatusOverwrite = ['ACTIVE', 'EMPTY', 'PENDING'].includes(String(body.status).toUpperCase());
      if (isStaleStatusOverwrite) {
        const { CrossingLog } = await import('@/src/models/Logs');
        const latestCrossing = await CrossingLog.findOne({ tag_id: record.tag_id, isDeleted: false })
          .sort({ createdAt: -1 })
          .lean();
        if (latestCrossing) {
          if (latestCrossing.actualCalvingDate) {
            body.status = 'ACTIVE';
          } else if (latestCrossing.pregnancyStatus === 'Positive') {
            body.status = 'PREGNANT';
          } else if (latestCrossing.pregnancyStatus === 'Pending') {
            body.status = 'PENDING';
          } else if (latestCrossing.pregnancyStatus === 'Negative') {
            body.status = 'EMPTY';
          }
        }
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

      // 3. Cascade tag updates to all other collections if tag_id has changed
      const oldTag = matchingTag;
      const newTag = updatedLiveStock.tag_id;
      if (oldTag && newTag && oldTag !== newTag) {
        try {
          const MilkCollection = (await import('@/src/models/MilkCollection')).default;
          const DailyFeeding = (await import('@/src/models/DailyFeeding')).default;
          const VaccinationLog = (await import('@/src/models/VaccinationLog')).default;
          const { CrossingLog, SaleLog, TreatmentLog, ShedLog, PurchaseLog } = await import('@/src/models/Logs');

          await Promise.all([
            // Logs.ts collections
            CrossingLog.updateMany({ tag_id: oldTag }, { tag_id: newTag, tag: newTag }),
            SaleLog.updateMany({ tag_id: oldTag }, { tag_id: newTag }),
            TreatmentLog.updateMany({ tag_id: oldTag }, { tag_id: newTag, tagId: newTag }),
            ShedLog.updateMany({ tag_id: oldTag }, { tag_id: newTag }),
            PurchaseLog.updateMany({ tag_id: oldTag }, { tag_id: newTag }),

            // Specialized modules
            MilkCollection.updateMany({ tag_id: oldTag }, { tag_id: newTag, tagId: newTag }),
            MilkCollection.updateMany({ tagId: oldTag }, { tag_id: newTag, tagId: newTag }),
            DailyFeeding.updateMany({ tag_id: oldTag }, { tag_id: newTag, animalId: newTag }),
            VaccinationLog.updateMany({ tag_id: oldTag }, { tag_id: newTag, tagId: newTag, animalId: newTag }),
            VaccinationLog.updateMany({ tagId: oldTag }, { tag_id: newTag, tagId: newTag, animalId: newTag }),

            // Child-Parent relationships (Dame / Sire)
            LiveStock.updateMany({ dameId: oldTag }, { dameId: newTag }),
            LiveStock.updateMany({ sireId: oldTag }, { sireId: newTag }),
            Cattle.updateMany({ dame: oldTag }, { dame: newTag }),
            Cattle.updateMany({ sire: oldTag }, { sire: newTag }),
          ]);
          console.log(`Successfully cascaded tag update from ${oldTag} to ${newTag} across all logs.`);
        } catch (cascadeErr) {
          console.error('Non-blocking tag update cascade error:', cascadeErr);
        }
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
      const matchingTag = record ? record.tag_id : null;

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
