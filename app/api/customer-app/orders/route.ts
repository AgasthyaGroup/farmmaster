import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Order from '../models/Order';
import { verifyAccessToken } from '@/src/utils/jwt';
import { unauthorizedResponse, errorResponse } from '@/src/utils/responses';
import Product from '../models/Product';
import ProductInventory from '../models/ProductInventory';
import DeliveryRoute from '../models/DeliveryRoute';
import DeliveryExecutive from '../models/DeliveryExecutive';

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

import { getOrders } from '@/delivery-application/controllers/orders';

export async function GET(req: NextRequest) {
  return getOrders(req);
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

    await dbConnect();

    // Check stock availability before placing order
    for (const item of items) {
      if (!item.product) {
        return errorResponse('Product ID is required for each item', 400);
      }
      const prodObj = await Product.findById(item.product);
      if (!prodObj) {
        return errorResponse(`Product not found`, 404);
      }
      let inv = await ProductInventory.findOne({ productId: item.product });
      if (!inv) {
        inv = await ProductInventory.create({ productId: item.product, quantity: prodObj.quantity || 0 });
      }
      if (inv.quantity < Number(item.quantity)) {
        return errorResponse(`Insufficient stock for ${prodObj.name}. Available: ${inv.quantity}`, 400);
      }
    }

    // Pincode Auto-Assignment to Delivery Executive
    let assignedTo = null;
    const pincode = address?.pincode || address?.zipCode || address?.postalCode;
    if (pincode) {
      const cleanPincode = String(pincode).trim();
      const matchingRoute = await DeliveryRoute.findOne({
        pincodes: cleanPincode,
        status: 'active',
      });
      if (matchingRoute && matchingRoute.assignedExecutiveId) {
        assignedTo = matchingRoute.assignedExecutiveId;
      } else {
        const matchingExecutive = await DeliveryExecutive.findOne({
          pincodes: cleanPincode,
          status: 'active',
        });
        if (matchingExecutive) {
          assignedTo = matchingExecutive._id;
        }
      }
    }

    const newOrder = await Order.create({
      customerId: customer._id,
      orderNumber,
      status: status || 'pending',
      totalPrice: calculatedTotal,
      items,
      address,
      assignedTo,
    });

    // Reduce product stocks dynamically
    for (const item of items) {
      if (item.product && item.quantity) {
        const prodObj = await Product.findById(item.product);
        let inv = await ProductInventory.findOne({ productId: item.product });
        if (!inv) {
          inv = await ProductInventory.create({ productId: item.product, quantity: prodObj ? prodObj.quantity : 0 });
        }
        const newQty = Math.max(0, inv.quantity - Number(item.quantity));

        await ProductInventory.findOneAndUpdate(
          { productId: item.product },
          { quantity: newQty }
        );
        await Product.findByIdAndUpdate(
          item.product,
          { quantity: newQty }
        );
      }
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/customer-app/orders] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    await dbConnect();
    if (id) {
      const deletedOrder = await Order.findOneAndDelete({ _id: id, customerId: customer._id });
      if (!deletedOrder) {
        return errorResponse('Order not found', 404);
      }
      return NextResponse.json({ success: true, message: 'Order deleted successfully' });
    } else {
      await Order.deleteMany({ customerId: customer._id });
      return NextResponse.json({ success: true, message: 'All orders deleted successfully' });
    }
  } catch (error: any) {
    console.error('[DELETE /api/customer-app/orders] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
