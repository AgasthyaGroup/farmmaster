import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const { farmId, code, type } = body;

      if (!farmId || !code || !type) {
        return errorResponse('Missing required fields', 400);
      }

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

      return successResponse(tag, 'Tag created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
