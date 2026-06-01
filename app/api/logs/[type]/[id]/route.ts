import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import { CrossingLog, SaleLog, TreatmentLog, ShedLog, PurchaseLog, resolveTagString } from '@/src/models/Logs';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

function getLogModel(type: string): any {
  const normalized = String(type).trim().toLowerCase();
  if (normalized === 'crossing') return CrossingLog;
  if (normalized === 'sale') return SaleLog;
  if (normalized === 'treatment') return TreatmentLog;
  if (normalized === 'shed') return ShedLog;
  if (normalized === 'purchase') return PurchaseLog;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { type, id } = await params;
      const LogModel = getLogModel(type);
      if (!LogModel) return errorResponse(`Invalid log type: ${type}`, 400);

      await dbConnect();
      const record = await LogModel.findById(id);
      if (!record || record.isDeleted) {
        return errorResponse('Log record not found', 404);
      }
      return successResponse(record, 'Log record fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { type, id } = await params;
      const LogModel = getLogModel(type);
      if (!LogModel) return errorResponse(`Invalid log type: ${type}`, 400);

      const body = await req.json();
      await dbConnect();

      // Normalize tag / tag_id / tagId if present in update body
      const tagInput = body.tag_id || body.tagId || body.tag || '';
      const logTypeNormalized = String(type).trim().toLowerCase();
      if (tagInput) {
        body.tag_id = String(tagInput).trim().toUpperCase();
        body.tag_id = (await resolveTagString(body.tag_id)).toUpperCase();

        const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
        
        if (logTypeNormalized === 'purchase') {
          // If the tag_id has changed, verify the new tag_id is not already in use by ANOTHER active animal
          const existingLog = await PurchaseLog.findById(id);
          const oldTag = existingLog ? existingLog.tag_id : '';
          
          if (body.tag_id !== oldTag) {
            const animalExists = await LiveStock.findOne({ tag_id: body.tag_id, isDeleted: false });
            if (animalExists) {
              return errorResponse(
                `Data Validation Error: Cannot update log. Tag ID [${body.tag_id}] is already registered in Live Stock registry.`,
                400
              );
            }
          }
        } else {
          // Standard check for existing animals for operational logs
          const animalExists = await LiveStock.findOne({ tag_id: body.tag_id, isDeleted: false });
          if (!animalExists) {
            return errorResponse(
              'Data Validation Error: Cannot update log. The targeted Tag ID does not exist in the Live Stock registry.',
              400
            );
          }
        }

        body.tagId = body.tag_id;
        body.tag = body.tag_id;
      }

      const oldRecord = await LogModel.findById(id);
      if (!oldRecord || oldRecord.isDeleted) {
        return errorResponse('Log record not found', 404);
      }

      const record = await LogModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('Log record not found', 404);
      }

      // ── If this is a Purchase Log update, synchronize the pending animal record
      if (logTypeNormalized === 'purchase') {
        try {
          const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
          const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
          
          const cleanTag = String(record.tag_id).trim().toUpperCase();
          const oldTag = body.tag_id && body.tag_id !== cleanTag ? body.tag_id : cleanTag;
          
          const pendingAnimal = await LiveStock.findOne({ 
            tag_id: { $in: [cleanTag, oldTag] }, 
            isPendingDetails: true, 
            isDeleted: false 
          });

          if (pendingAnimal) {
            pendingAnimal.tag_id = cleanTag;
            pendingAnimal.farmId = record.farmId || pendingAnimal.farmId;
            pendingAnimal.purchaseDate = record.purchaseDate || pendingAnimal.purchaseDate;
            pendingAnimal.purchasePrice = record.price || pendingAnimal.purchasePrice;
            pendingAnimal.purchaseFrom = record.sellerName || pendingAnimal.purchaseFrom;
            pendingAnimal.purchaseRemarks = record.sellerContact ? `Seller Contact: ${record.sellerContact}` : pendingAnimal.purchaseRemarks;
            await pendingAnimal.save();

            const pendingCattle = await CattleModel.findOne({
              tag: { $in: [cleanTag, oldTag] },
              isPendingDetails: true,
              isDeleted: false
            });
            if (pendingCattle) {
              pendingCattle.tag = cleanTag;
              pendingCattle.farmId = record.farmId || pendingCattle.farmId;
              pendingCattle.purchaseDate = record.purchaseDate || pendingCattle.purchaseDate;
              pendingCattle.purchasePrice = record.price || pendingCattle.purchasePrice;
              pendingCattle.purchaseFrom = record.sellerName || pendingCattle.purchaseFrom;
              pendingCattle.purchaseRemarks = record.sellerContact ? `Seller Contact: ${record.sellerContact}` : pendingCattle.purchaseRemarks;
              await pendingCattle.save();
            }
          }
        } catch (syncErr) {
          console.error('Non-blocking livestock purchase sync error during update:', syncErr);
        }
      }

      // ── If this is a Shed Shifting Log, update the animal's current shed assignment
      if (logTypeNormalized === 'shed' && record.newShed) {
        try {
          const cleanTag = String(record.tag_id).trim().toUpperCase();
          const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
          await LiveStock.findOneAndUpdate(
            { tag_id: cleanTag, isDeleted: false },
            { shedId: record.newShed }
          );
          const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
          await CattleModel.findOneAndUpdate(
            { tag: cleanTag, isDeleted: false },
            { shed: record.newShed }
          );
        } catch (syncErr) {
          console.error('Non-blocking livestock shed sync error during update:', syncErr);
        }
      }

      // ── If this is a Sale Log, update animal status to SOLD (and revert old animal to ACTIVE if tag changed)
      if (logTypeNormalized === 'sale') {
        try {
          const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
          const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
          
          const cleanNewTag = String(record.tag_id).trim().toUpperCase();
          const cleanOldTag = oldRecord ? String(oldRecord.tag_id).trim().toUpperCase() : '';
          
          if (cleanOldTag && cleanNewTag !== cleanOldTag) {
            // Revert old animal back to ACTIVE
            await LiveStock.findOneAndUpdate(
              { tag_id: cleanOldTag, isDeleted: false },
              { status: 'ACTIVE' }
            );
            await CattleModel.findOneAndUpdate(
              { tag: cleanOldTag, isDeleted: false },
              { status: 'ACTIVE' }
            );
          }
          
          // Mark new animal as SOLD
          await LiveStock.findOneAndUpdate(
            { tag_id: cleanNewTag, isDeleted: false },
            { status: 'SOLD' }
          );
          await CattleModel.findOneAndUpdate(
            { tag: cleanNewTag, isDeleted: false },
            { status: 'SOLD' }
          );
        } catch (syncErr) {
          console.error('Non-blocking livestock sale sync error during update:', syncErr);
        }
      }

      return successResponse(record, 'Log record updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/logs/[type]/[id]] Unhandled error:', error);
      
      if (error.name === 'ValidationError') {
        const errorMsg = error.errors?.tag_id?.message || Object.values(error.errors)[0]?.toString() || error.message;
        return errorResponse(errorMsg, 400);
      }
      
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'HEALTH'], async () => {
    try {
      const { type, id } = await params;
      const LogModel = getLogModel(type);
      if (!LogModel) return errorResponse(`Invalid log type: ${type}`, 400);

      await dbConnect();
      const record = await LogModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('Log record not found', 404);
      }

      // ── If this is a Purchase Log deletion, also soft-delete the associated pending animal
      if (String(type).trim().toLowerCase() === 'purchase') {
        try {
          const cleanTag = String(record.tag_id).trim().toUpperCase();
          const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
          const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
          
          await LiveStock.findOneAndUpdate(
            { tag_id: cleanTag, isPendingDetails: true, isDeleted: false },
            { isDeleted: true }
          );
          await CattleModel.findOneAndUpdate(
            { tag: cleanTag, isPendingDetails: true, isDeleted: false },
            { isDeleted: true }
          );
        } catch (syncErr) {
          console.error('Non-blocking livestock sync error during purchase log deletion:', syncErr);
        }
      }

      // ── If this is a Sale Log deletion, revert the animal status back to ACTIVE
      if (String(type).trim().toLowerCase() === 'sale') {
        try {
          const cleanTag = String(record.tag_id).trim().toUpperCase();
          const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
          const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
          
          await LiveStock.findOneAndUpdate(
            { tag_id: cleanTag, isDeleted: false },
            { status: 'ACTIVE' }
          );
          await CattleModel.findOneAndUpdate(
            { tag: cleanTag, isDeleted: false },
            { status: 'ACTIVE' }
          );
        } catch (syncErr) {
          console.error('Non-blocking livestock sync error during sale log deletion:', syncErr);
        }
      }

      return successResponse(null, 'Log record deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
