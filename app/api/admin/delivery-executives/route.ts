import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
import DeliveryRoute from '@/app/api/customer-app/models/DeliveryRoute';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const executives = await DeliveryExecutive.find({})
        .populate({ path: 'assignedRouteId', model: DeliveryRoute })
        .sort({ createdAt: -1 });
      return successResponse(executives, 'Delivery executives fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-executives] error:', error);
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

      const { name, phone, email, password, vehicleType, vehicleNumber, status, pincodes, assignedRouteId } = body;

      if (!name || !phone) {
        return errorResponse('Name and Phone are required fields', 400);
      }

      await dbConnect();

      // Check duplicate phone
      const existing = await DeliveryExecutive.findOne({ phone });
      if (existing) {
        return errorResponse('Delivery executive phone number already registered', 400);
      }

      const hashedPassword = await bcrypt.hash(password || '123456', 10);

      let parsedPincodes = Array.isArray(pincodes)
        ? pincodes.map(p => String(p).trim()).filter(Boolean)
        : (typeof pincodes === 'string' ? pincodes.split(',').map(p => p.trim()).filter(Boolean) : []);

      // If assignedRouteId is passed, automatically sync route pincodes if pincodes not manually entered
      if (assignedRouteId && parsedPincodes.length === 0) {
        const routeObj = await DeliveryRoute.findById(assignedRouteId);
        if (routeObj && routeObj.pincodes) {
          parsedPincodes = routeObj.pincodes;
        }
      }

      const newExecutive = await DeliveryExecutive.create({
        name,
        phone,
        email: email || '',
        password: hashedPassword,
        vehicleType: vehicleType || 'Bike',
        vehicleNumber: vehicleNumber || '',
        pincodes: parsedPincodes,
        assignedRouteId: assignedRouteId || null,
        status: status || 'inactive',
      });

      if (assignedRouteId) {
        await DeliveryRoute.findByIdAndUpdate(assignedRouteId, { assignedExecutiveId: newExecutive._id });
      }

      return createdResponse(newExecutive, 'Delivery executive created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/delivery-executives] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  })
}

