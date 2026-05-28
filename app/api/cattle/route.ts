import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';
import Tag from '@/src/models/Tag';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createCattleSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], async () => {
    try {
      let body = await req.json();
      const parsedBody = createCattleSchema.safeParse(body);
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid data', 400);
      }
      body = parsedBody.data;

      await dbConnect();
      
      // Check if a cattle with the same tag and farmId already exists
      const query: any = { tag: body.tag };
      if (body.farmId) query.farmId = body.farmId;
      
      const existingCattle = await Cattle.findOne(query);
      
      let cattle;
      if (existingCattle) {
        if (!existingCattle.isDeleted) {
          return errorResponse('A cattle with this Tag ID already exists.', 400);
        }
        // Revive the soft-deleted cattle
        cattle = await Cattle.findByIdAndUpdate(
          existingCattle._id,
          { ...body, isDeleted: false },
          { new: true }
        );
      } else {
        cattle = await Cattle.create(body);
      }

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
