import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Product from '../../models/Product';
import ProductInventory from '../../models/ProductInventory';
import { errorResponse } from '@/src/utils/responses';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const product = await Product.findOne({ _id: id, status: 'active' });
    if (!product) {
      return errorResponse('Product not found or inactive', 404);
    }
    
    const obj = typeof product.toObject === 'function' ? product.toObject() : product;
    let inv = await ProductInventory.findOne({ productId: product._id });
    if (!inv) {
      inv = await ProductInventory.create({ productId: product._id, quantity: product.quantity || 0 });
    }
    obj.quantity = inv.quantity;

    return NextResponse.json({ success: true, data: obj });
  } catch (error: any) {
    console.error('[GET /api/customer-app/products/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
