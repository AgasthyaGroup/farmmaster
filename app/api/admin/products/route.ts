import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Product from '@/app/api/customer-app/models/Product';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const products = await Product.find({}).sort({ createdAt: -1 });
      return successResponse(products, 'Products fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/products] error:', error);
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

      const { name, sku, price, quantity, size, image, description, benefits, status, categoryId, categoryName, categoryCode } = body;

      if (!name || !sku || price === undefined || quantity === undefined || !categoryId || !categoryName || !categoryCode) {
        return errorResponse('Missing required fields: name, sku, price, quantity, categoryId, categoryName, categoryCode', 400);
      }

      await dbConnect();

      // Check duplicate SKU
      const existingProduct = await Product.findOne({ sku });
      if (existingProduct) {
        return errorResponse('Product SKU already exists', 400);
      }

      const newProduct = await Product.create({
        name,
        sku,
        price,
        quantity,
        size: size || '',
        image: image || '',
        description: description || '',
        benefits: benefits || [],
        status: status || 'inactive',
        categoryId,
        categoryName,
        categoryCode,
      });

      return createdResponse(newProduct, 'Product created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/products] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
