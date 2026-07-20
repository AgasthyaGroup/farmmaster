import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryLocation from '@/app/api/customer-app/models/DeliveryLocation';
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
      const location = await DeliveryLocation.findById(id);
      if (!location) {
        return errorResponse('Delivery location not found', 404);
      }
      return successResponse(location, 'Delivery location fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-locations/[id]] error:', error);
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

      // Check duplicate pincode
      if (body.pincode) {
        const existing = await DeliveryLocation.findOne({ pincode: body.pincode, _id: { $ne: id } });
        if (existing) {
          return errorResponse('Delivery pincode already exists', 400);
        }
      }

      const updatedLocation = await DeliveryLocation.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updatedLocation) {
        return errorResponse('Delivery location not found', 404);
      }

      return successResponse(updatedLocation, 'Delivery location updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/delivery-locations/[id]] error:', error);
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
      const deletedLocation = await DeliveryLocation.findByIdAndDelete(id);
      if (!deletedLocation) {
        return errorResponse('Delivery location not found', 404);
      }
      return successResponse(null, 'Delivery location deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/delivery-locations/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
