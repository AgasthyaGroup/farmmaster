import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import CrossingLog from '@/src/models/CrossingLog';
import { resolveTagString } from '@/src/models/Logs';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const { id } = await params;
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

      const record = await CrossingLog.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) return errorResponse('CrossingLog not found', 404);
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
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await CrossingLog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) return errorResponse('CrossingLog not found', 404);
      return successResponse(null, 'CrossingLog deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
