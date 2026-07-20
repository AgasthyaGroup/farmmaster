import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Category from '@/app/api/customer-app/models/Category';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const categories = await Category.find({}).sort({ createdAt: -1 });
      return successResponse(categories, 'Categories fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/categories] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400);
      }

      const { name, code, image, volume, price, description, benefits, status } = body;

      if (!name || !code) {
        return errorResponse('Name and Code are required fields', 400);
      }

      await dbConnect();

      // Check duplicate code
      const existingCategory = await Category.findOne({ code: code.toUpperCase() });
      if (existingCategory) {
        return errorResponse('Category Code already exists', 400);
      }

      const newCategory = await Category.create({
        name,
        code: code.toUpperCase(),
        image: image || '',
        volume: volume || '',
        price: price || 0,
        description: description || '',
        benefits: benefits || [],
        status: status || 'inactive',
      });

      return createdResponse(newCategory, 'Category created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/categories] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
