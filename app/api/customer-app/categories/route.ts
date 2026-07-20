import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Category from '../models/Category';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Return only active categories for the client app
    const categories = await Category.find({ status: 'active' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('[GET /api/customer-app/categories] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
