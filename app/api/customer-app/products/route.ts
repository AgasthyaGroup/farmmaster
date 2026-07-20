import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Product from '../models/Product';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Return only active products for the client app catalog
    const products = await Product.find({ status: 'active' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('[GET /api/customer-app/products] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
