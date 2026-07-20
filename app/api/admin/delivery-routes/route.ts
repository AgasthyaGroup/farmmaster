import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryRoute from '@/app/api/customer-app/models/DeliveryRoute';
import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const routes = await DeliveryRoute.find({})
        .populate({ path: 'assignedExecutiveId', model: DeliveryExecutive })
        .sort({ createdAt: -1 });
      return successResponse(routes, 'Delivery routes fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-routes] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400);
      }

      const { routeName, routeCode, startPoint, endPoint, pincodes, assignedExecutiveId, status } = body;

      if (!routeName || !routeCode) {
        return errorResponse('Route Name and Route Code are required fields', 400);
      }

      await dbConnect();

      // Check duplicate routeCode
      const existing = await DeliveryRoute.findOne({ routeCode: routeCode.toUpperCase() });
      if (existing) {
        return errorResponse('Route code already exists', 400);
      }

      const newRoute = await DeliveryRoute.create({
        routeName,
        routeCode: routeCode.toUpperCase(),
        startPoint: startPoint || '',
        endPoint: endPoint || '',
        pincodes: pincodes || [],
        assignedExecutiveId: assignedExecutiveId || null,
        status: status || 'inactive',
      });

      return createdResponse(newRoute, 'Delivery route created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/delivery-routes] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
