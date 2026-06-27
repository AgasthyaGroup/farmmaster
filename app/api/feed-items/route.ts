import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import FeedItem from '@/src/models/FeedItem';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'FEEDING', 'INVENTORY', 'FEED_ITEMS'], async () => {
    try {
      await dbConnect();
      const feedItems = await FeedItem.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(feedItems, 'Feed items fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'FEED_ITEMS'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      const type = body?.type?.trim() || '';
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingItem = await FeedItem.findOne({ name });
      if (existingItem) {
        if (!existingItem.isDeleted) {
          return errorResponse('Feed item name already exists', 400);
        }
        // If deleted, restore and update
        const item = await FeedItem.findByIdAndUpdate(
          existingItem._id,
          { description, status, farmId, type, isDeleted: false },
          { new: true }
        );
        return createdResponse(item, 'Feed item created successfully');
      }

      const item = await FeedItem.create({
        name,
        description,
        status,
        farmId,
        type,
      });

      return createdResponse(item, 'Feed item created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
