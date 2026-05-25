import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createCattleSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      await dbConnect();
      const cattle = await Cattle.find({ isDeleted: false })
        .sort({ createdAt: -1 });
      return successResponse(cattle, 'Cattle fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      
      const cattle = await Cattle.create(body);

      // Optionally update Tag if tag field is present and exists
      if (body.tag) {
        const tag = await Tag.findOne({ tagId: body.tag });
        if (tag) {
          tag.status = 'ASSIGNED';
          await tag.save();
        }
      }

      return createdResponse(cattle, 'Cattle registered successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
