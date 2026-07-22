import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Order from '@/app/api/customer-app/models/Order';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      let body: any;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400);
      }

      const { status } = body;
      if (!status) {
        return errorResponse('Status is required', 400);
      }

      await dbConnect();
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );

      if (!updatedOrder) {
        return errorResponse('Order not found', 404);
      }

      return successResponse(updatedOrder, 'Order status updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/orders/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const deletedOrder = await Order.findByIdAndDelete(id);
      if (!deletedOrder) {
        return errorResponse('Order not found', 404);
      }
      return successResponse(deletedOrder, 'Order deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/orders/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
