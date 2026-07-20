import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryRoute from '@/app/api/customer-app/models/DeliveryRoute';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const route = await DeliveryRoute.findById(id);
      if (!route) {
        return errorResponse('Delivery route not found', 404);
      }
      return successResponse(route, 'Delivery route fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-routes/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

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

      await dbConnect();

      // Check duplicate routeCode
      if (body.routeCode) {
        const existing = await DeliveryRoute.findOne({ routeCode: body.routeCode.toUpperCase(), _id: { $ne: id } });
        if (existing) {
          return errorResponse('Route code already exists', 400);
        }
        body.routeCode = body.routeCode.toUpperCase();
      }

      const updated = await DeliveryRoute.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updated) {
        return errorResponse('Delivery route not found', 404);
      }

      return successResponse(updated, 'Delivery route updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/delivery-routes/[id]] error:', error);
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
      const deleted = await DeliveryRoute.findByIdAndDelete(id);
      if (!deleted) {
        return errorResponse('Delivery route not found', 404);
      }
      return successResponse(null, 'Delivery route deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/delivery-routes/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
