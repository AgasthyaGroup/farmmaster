import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createCattleSchema } from '@/src/utils/validation';

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
      const parsedBody = createCattleSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { farmId, name, code, tagId, type, shedId } = parsedBody.data;

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

      return createdResponse(cattle, 'Cattle registered successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
