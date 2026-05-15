import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createTagSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      await dbConnect();
      const tags = await Tag.find({ isDeleted: false }).populate('farmId').sort({ createdAt: -1 });
      return successResponse(tags, 'Tags fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const parsedBody = createTagSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { farmId, code, type } = parsedBody.data;

      await dbConnect();
      
      const existingTag = await Tag.findOne({ code });
      if (existingTag) {
        return errorResponse('Tag code already exists', 400);
      }

      const tag = await Tag.create({
        farmId,
        code,
        type,
      });

      return createdResponse(tag, 'Tag created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
