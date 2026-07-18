import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Favourite from '../models/Favourite';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse, createdResponse } from '@/src/utils/responses';

async function getCustomerFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== 'CUSTOMER') {
    return null;
  }
  
  await dbConnect();
  const customer = await Customer.findOne({ _id: payload.userId, isDeleted: false });
  if (!customer || customer.status === false) {
    return null;
  }
  
  return customer;
}

export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const list = await Favourite.find({ customerId: customer._id });
    const favourites = list.map(item => ({ _id: item.productId }));

    return NextResponse.json({
      success: true,
      message: 'Favourites retrieved successfully',
      data: favourites,
      favourites: favourites,
    });
  } catch (error: any) {
    console.error('[GET /api/customer-app/favourites] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { productId } = body;
    if (!productId) {
      return errorResponse('productId is required', 400);
    }

    let fav = await Favourite.findOne({ customerId: customer._id, productId });
    if (!fav) {
      fav = await Favourite.create({ customerId: customer._id, productId });
    }

    return createdResponse(fav, 'Favourite added successfully');
  } catch (error: any) {
    console.error('[POST /api/customer-app/favourites] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
