import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Category from '@/app/api/customer-app/models/Category';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const category = await Category.findById(id);
      if (!category) {
        return errorResponse('Category not found', 404);
      }
      return successResponse(category, 'Category fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/categories/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      let body: any;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400);
      }

      await dbConnect();

      // Check duplicate code
      if (body.code) {
        const existing = await Category.findOne({ code: body.code.toUpperCase(), _id: { $ne: id } });
        if (existing) {
          return errorResponse('Category Code already exists', 400);
        }
        body.code = body.code.toUpperCase();
      }

      const updatedCategory = await Category.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updatedCategory) {
        return errorResponse('Category not found', 404);
      }

      return successResponse(updatedCategory, 'Category updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/categories/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const deletedCategory = await Category.findByIdAndDelete(id);
      if (!deletedCategory) {
        return errorResponse('Category not found', 404);
      }
      return successResponse(null, 'Category deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/categories/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
