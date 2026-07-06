import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import CrossingLog from '@/src/models/CrossingLog';
import { resolveTagString } from '@/src/models/Logs';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';
import { syncCalfRecord, updateAnimalStatusFromCrossing } from '../route';
import SemenStraw from '@/src/models/SemenStraw';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'CROSSING_LOG', 'CROSSING'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();

      const oldRecord = await CrossingLog.findById(id);
      if (!oldRecord || oldRecord.isDeleted) return errorResponse('CrossingLog not found', 404);

      // ── Semen Straw Reconciliation logic ─────────────────────────────────
      const oldCrossingType = oldRecord.crossingType;
      const oldBatchNumber = oldRecord.batchNumber ? String(oldRecord.batchNumber).trim().toUpperCase() : null;
      const newCrossingType = body.crossingType !== undefined ? body.crossingType : oldCrossingType;
      const newBatchNumber = body.batchNumber !== undefined ? (body.batchNumber ? String(body.batchNumber).trim().toUpperCase() : null) : oldBatchNumber;

      if (oldCrossingType === 'Artificial' && oldBatchNumber && (newCrossingType !== 'Artificial' || newBatchNumber !== oldBatchNumber)) {
        await SemenStraw.findOneAndUpdate(
          { batchNo: oldBatchNumber, isDeleted: false },
          { $inc: { usedStraws: -1 } }
        );
      }

      if (newCrossingType === 'Artificial' && newBatchNumber && (oldCrossingType !== 'Artificial' || newBatchNumber !== oldBatchNumber)) {
        const batch = await SemenStraw.findOne({ batchNo: newBatchNumber, isDeleted: false });
        if (!batch) {
          // Revert old batch update if we modified it
          if (oldCrossingType === 'Artificial' && oldBatchNumber && (newCrossingType !== 'Artificial' || newBatchNumber !== oldBatchNumber)) {
            await SemenStraw.findOneAndUpdate(
              { batchNo: oldBatchNumber, isDeleted: false },
              { $inc: { usedStraws: 1 } }
            );
          }
          return errorResponse(`Semen straw batch number ${newBatchNumber} does not exist.`, 400);
        }
        if (batch.noOfStraws - batch.usedStraws <= 0) {
          // Revert old batch update if we modified it
          if (oldCrossingType === 'Artificial' && oldBatchNumber && (newCrossingType !== 'Artificial' || newBatchNumber !== oldBatchNumber)) {
            await SemenStraw.findOneAndUpdate(
              { batchNo: oldBatchNumber, isDeleted: false },
              { $inc: { usedStraws: 1 } }
            );
          }
          return errorResponse(`No straws available in batch ${newBatchNumber} (Available: 0).`, 400);
        }
        batch.usedStraws += 1;
        await batch.save();
      }

      // Normalize tag / tag_id / tagId if present in update body
      const tagInput = body.tag_id || body.tagId || body.tag || '';
      if (tagInput) {
        body.tag_id = String(tagInput).trim().toUpperCase();
        body.tag_id = (await resolveTagString(body.tag_id)).toUpperCase();

        // Validation check for the tag_id to ensure it exists in the registry
        const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
        const animalExists = await LiveStock.findOne({ tag_id: body.tag_id, isDeleted: false });
        if (!animalExists) {
          return errorResponse(
            'Data Validation Error: Cannot update log. The targeted Tag ID does not exist in the Live Stock registry.',
            400
          );
        }

        body.tagId = body.tag_id;
        body.tag = body.tag_id;
      }

      const record = await CrossingLog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) return errorResponse('CrossingLog not found', 404);

      // Sync the born calf record on update
      if (record.calfTag || oldRecord.calfTag) {
        await syncCalfRecord(record, oldRecord.calfTag);
      }

      // If calving occurred (actualCalvingDate transitioned from unset to set), increment calvings
      if (record.actualCalvingDate && !oldRecord.actualCalvingDate) {
        const LiveStockModel = mongoose.models.LiveStock || mongoose.model('LiveStock');
        const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
        const motherTag = record.tag_id || oldRecord.tag_id;
        await LiveStockModel.findOneAndUpdate({ tag_id: motherTag }, { $inc: { calvings: 1 } });
        await CattleModel.findOneAndUpdate({ tag: motherTag }, { $inc: { calvings: 1 } });
        console.log(`[PUT /api/crossing/[id]] Incremented calving count for mother: ${motherTag}`);
      }

      // If calving was reverted (actualCalvingDate transitioned from set to unset), decrement calvings
      if (!record.actualCalvingDate && oldRecord.actualCalvingDate) {
        const LiveStockModel = mongoose.models.LiveStock || mongoose.model('LiveStock');
        const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
        const motherTag = record.tag_id || oldRecord.tag_id;
        await LiveStockModel.findOneAndUpdate({ tag_id: motherTag }, { $inc: { calvings: -1 } });
        await CattleModel.findOneAndUpdate({ tag: motherTag }, { $inc: { calvings: -1 } });
        console.log(`[PUT /api/crossing/[id]] Decremented calving count for mother: ${motherTag}`);
      }

      // Update animal status based on pregnancyStatus/calving
      await updateAnimalStatusFromCrossing(record.tag_id, record.pregnancyStatus, record.actualCalvingDate);

      return successResponse(record, 'CrossingLog updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/crossing/[id]] Unhandled error:', error);
      if (error.name === 'ValidationError') {
        const errorMsg = error.errors?.tag_id?.message || Object.values(error.errors)[0]?.toString() || error.message;
        return errorResponse(errorMsg, 400);
      }
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      
      const oldRecord = await CrossingLog.findById(id);
      if (!oldRecord) return errorResponse('CrossingLog not found', 404);

      // ── Semen Straw Reconciliation logic ─────────────────────────────────
      if (oldRecord.crossingType === 'Artificial' && oldRecord.batchNumber) {
        await SemenStraw.findOneAndUpdate(
          { batchNo: String(oldRecord.batchNumber).trim().toUpperCase(), isDeleted: false },
          { $inc: { usedStraws: -1 } }
        );
      }

      const record = await CrossingLog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) return errorResponse('CrossingLog not found', 404);

      // If the deleted record had actualCalvingDate, decrement calvings
      if (oldRecord.actualCalvingDate) {
        const LiveStockModel = mongoose.models.LiveStock || mongoose.model('LiveStock');
        const CattleModel = mongoose.models.Cattle || mongoose.model('Cattle');
        const motherTag = oldRecord.tag_id;
        await LiveStockModel.findOneAndUpdate({ tag_id: motherTag }, { $inc: { calvings: -1 } });
        await CattleModel.findOneAndUpdate({ tag: motherTag }, { $inc: { calvings: -1 } });
        console.log(`[DELETE /api/crossing/[id]] Decremented calving count for mother: ${motherTag}`);
      }

      // Clean up the pending calf record if it was pending details
      if (oldRecord.calfTag) {
        await syncCalfRecord({ calfTag: '', tag_id: oldRecord.tag_id }, oldRecord.calfTag);
      }

      return successResponse(null, 'CrossingLog deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
