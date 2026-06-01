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

      const record = await LogModel.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('Log record not found', 404);
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
      return successResponse(null, 'Log record deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
