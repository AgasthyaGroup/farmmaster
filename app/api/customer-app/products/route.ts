import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Product from '../models/Product';
import ProductInventory from '../models/ProductInventory';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Return only active products for the client app catalog
    const products = await Product.find({ status: 'active' }).sort({ createdAt: -1 });
    
    const formattedProducts = await Promise.all(products.map(async (prod: any) => {
      const obj = typeof prod.toObject === 'function' ? prod.toObject() : prod;
      let inv = await ProductInventory.findOne({ productId: prod._id });
      if (!inv) {
        inv = await ProductInventory.create({ productId: prod._id, quantity: prod.quantity || 0 });
      }
      obj.quantity = inv.quantity;
      return obj;
    }));

    return NextResponse.json({ success: true, data: formattedProducts });
  } catch (error: any) {
    console.error('[GET /api/customer-app/products] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
