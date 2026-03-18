import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      await dbConnect();
      const cattle = await Cattle.find({ isDeleted: false })
        .populate('farmId')
        .populate('tagId')
        .populate('shedId')
        .sort({ createdAt: -1 });
      return successResponse(cattle, 'Cattle fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const { farmId, name, code, tagId, type, shedId } = body;

      if (!farmId || !name || !code || !tagId || !shedId) {
        return errorResponse('Missing required fields', 400);
      }

      await dbConnect();

      // Ensure tag is available
      const tag = await Tag.findById(tagId);
      if (!tag || tag.status === 'ASSIGNED') {
        return errorResponse('Tag is not available or does not exist', 400);
      }

      const cattle = await Cattle.create({
        farmId,
        name,
        code,
        tagId,
        type,
        shedId,
      });

      // Update tag status
      await Tag.findByIdAndUpdate(tagId, { status: 'ASSIGNED' });

      return successResponse(cattle, 'Cattle registered successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
