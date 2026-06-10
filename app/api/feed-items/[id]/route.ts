import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import FeedItem from '@/src/models/FeedItem';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'FEED_ITEMS'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid feed item id', 400);
      }

      const body = await req.json();
      const name = body?.name?.trim();
      const description = body?.description?.trim() || '';
      const status = body?.status !== undefined ? body.status : true;
      const farmId = body?.farmId || null;

      if (!name) {
        return errorResponse('Name is required', 400);
      }

      await dbConnect();

      const existingItem = await FeedItem.findOne({ _id: { $ne: id }, name });
      if (existingItem) {
        return errorResponse('Feed item name already exists', 400);
      }

      const item = await FeedItem.findByIdAndUpdate(
        id,
        { name, description, status, farmId },
        { new: true }
      );
      if (!item) return notFoundResponse('Feed item not found');

      return successResponse(item, 'Feed item updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'FEED_ITEMS'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid feed item id', 400);
      }

      await dbConnect();
      const item = await FeedItem.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!item) return notFoundResponse('Feed item not found');

      return successResponse(null, 'Feed item deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
