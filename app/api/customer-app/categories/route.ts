import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Category from '../models/Category';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Return active categories for client app (fallback to all categories if status isn't 'active')
    let categories = await Category.find({ status: { $regex: /^active$/i } }).sort({ createdAt: -1 });
    if (!categories || categories.length === 0) {
      categories = await Category.find({}).sort({ createdAt: -1 });
    }
    return NextResponse.json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
      categories: categories,
    });
  } catch (error: any) {
    console.error('[GET /api/customer-app/categories] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
