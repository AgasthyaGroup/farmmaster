import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Order from '../models/Order';
import DeliveryExecutive from '../models/DeliveryExecutive';
import DeliveryRoute from '@/app/api/customer-app/models/DeliveryRoute';
import { verifyAccessToken } from '@/src/utils/jwt';
import { unauthorizedResponse, errorResponse, successResponse } from '@/src/utils/responses';

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyAccessToken(token);
}

export async function getOrders(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();

    let ordersList;
    if (user.role === 'DELIVERY_EXECUTIVE') {
      // Find all routes assigned to this delivery executive
      const executiveRoutes = await DeliveryRoute.find({ assignedExecutiveId: user.userId });
      const assignedPincodes = executiveRoutes.flatMap((r: any) => r.pincodes || []);

      console.log(`[GetOrders] Executive: ${user.userId}`);
      console.log(`[GetOrders] Route pincodes:`, assignedPincodes);

      const queryConditions: any[] = [
        { assignedTo: user.userId },
      ];

      if (assignedPincodes.length > 0) {
        queryConditions.push(
          { 'address.pincode': { $in: assignedPincodes } },
          { 'address.zipCode': { $in: assignedPincodes } },
          { 'address.postalCode': { $in: assignedPincodes } }
        );
      }

      // Fallback: if no routes configured, show unassigned orders too
      if (executiveRoutes.length === 0) {
        queryConditions.push(
          { assignedTo: null },
          { assignedTo: { $exists: false } }
        );
      }

      console.log(`[GetOrders] Query conditions:`, JSON.stringify(queryConditions));

      ordersList = await Order.find({ $or: queryConditions })
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name');

      console.log(`[GetOrders] Found ${ordersList.length} orders`);
    } else {
      ordersList = await Order.find({ customerId: user.userId })
        .sort({ createdAt: -1 })
        .populate('assignedTo', 'name');
    }

    const formattedOrders = ordersList.map((order: any) => {
      const obj = typeof order.toObject === 'function' ? order.toObject() : order;
      
      const computedTotal = (obj.items || []).reduce(
        (sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)),
        0
      );

      // Structure deliveryAddress to match what Flutter app expects
      const rawAddr = obj.address || {};
      const deliveryAddress = {
        fullName: rawAddr.fullName || rawAddr.name || '',
        mobile: rawAddr.mobile || rawAddr.phone || '',
        addressLine1: rawAddr.addressLine1 || rawAddr.address1 || '',
        addressLine2: rawAddr.addressLine2 || rawAddr.address2 || '',
        city: rawAddr.city || '',
        state: rawAddr.state || '',
        pincode: rawAddr.pincode || '',
      };

      return {
        ...obj,
        totalPrice: obj.totalPrice > 0 ? obj.totalPrice : computedTotal,
        deliveryAddress,
        createdAt: obj.createdAt ? obj.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('[Delivery Get Orders] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function updateOrderStatus(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const orderId = params.id;
    if (!orderId) {
      return errorResponse('Order ID is required', 400);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { status, comment, reason } = body;
    if (!status) {
      return errorResponse('Status is required', 400);
    }

    await dbConnect();

    // Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Update status and feedback
    order.status = status;
    if (comment !== undefined) order.comment = comment;
    if (reason !== undefined) order.reason = reason;
    await order.save();

    return successResponse(order, 'Order status updated successfully');
  } catch (error: any) {
    console.error('[Delivery Update Order Status] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
