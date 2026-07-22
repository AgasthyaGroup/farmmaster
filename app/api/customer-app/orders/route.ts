import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Order from '../models/Order';
import { verifyAccessToken } from '@/src/utils/jwt';
import { unauthorizedResponse, errorResponse } from '@/src/utils/responses';

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

    const ordersList = await Order.find({ customerId: customer._id }).sort({ createdAt: -1 });

    const formattedOrders = ordersList.map((order: any) => {
      const obj = order.toObject();
      const computedTotal = (obj.items || []).reduce(
        (sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)),
        0
      );

      return {
        ...obj,
        totalPrice:
          obj.totalPrice !== undefined && obj.totalPrice !== null && obj.totalPrice > 0
            ? obj.totalPrice
            : computedTotal,
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('[GET /api/customer-app/orders] error:', error);
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

    const { orderNumber, status, items, totalPrice, address } = body;
    if (!orderNumber || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse('Missing required fields or items', 400);
    }

    const calculatedTotal =
      totalPrice !== undefined && totalPrice !== null
        ? Number(totalPrice)
        : items.reduce(
            (sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)),
            0
          );

    const newOrder = await Order.create({
      customerId: customer._id,
      orderNumber,
      status: status || 'pending',
      totalPrice: calculatedTotal,
      items,
      address,
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/customer-app/orders] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
