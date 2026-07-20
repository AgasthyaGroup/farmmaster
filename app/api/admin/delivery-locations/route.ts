import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryLocation from '@/app/api/customer-app/models/DeliveryLocation';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const locations = await DeliveryLocation.find({}).sort({ createdAt: -1 });
      return successResponse(locations, 'Delivery locations fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-locations] error:', error);
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

      const { name, pincode, city, state, status } = body;

      if (!name || !pincode || !city || !state) {
        return errorResponse('Missing required fields: name, pincode, city, state', 400);
      }

      await dbConnect();

      // Check duplicate pincode
      const existing = await DeliveryLocation.findOne({ pincode });
      if (existing) {
        return errorResponse('Delivery pincode already exists', 400);
      }

      const newLocation = await DeliveryLocation.create({
        name,
        pincode,
        city,
        state,
        status: status || 'inactive',
      });

      return createdResponse(newLocation, 'Delivery location created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/delivery-locations] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
