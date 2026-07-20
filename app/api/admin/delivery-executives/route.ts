import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const executives = await DeliveryExecutive.find({}).sort({ createdAt: -1 });
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

      const { name, phone, email, vehicleType, vehicleNumber, status } = body;

      if (!name || !phone) {
        return errorResponse('Name and Phone are required fields', 400);
      }

      await dbConnect();

      // Check duplicate phone
      const existing = await DeliveryExecutive.findOne({ phone });
      if (existing) {
        return errorResponse('Delivery executive phone number already registered', 400);
      }

      const newExecutive = await DeliveryExecutive.create({
        name,
        phone,
        email: email || '',
        vehicleType: vehicleType || 'Bike',
        vehicleNumber: vehicleNumber || '',
        status: status || 'inactive',
      });

      return createdResponse(newExecutive, 'Delivery executive created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/delivery-executives] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
