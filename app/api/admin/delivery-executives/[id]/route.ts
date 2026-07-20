import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
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
      const executive = await DeliveryExecutive.findById(id);
      if (!executive) {
        return errorResponse('Delivery executive not found', 404);
      }
      return successResponse(executive, 'Delivery executive fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/delivery-executives/[id]] error:', error);
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

      // Check duplicate phone
      if (body.phone) {
        const existing = await DeliveryExecutive.findOne({ phone: body.phone, _id: { $ne: id } });
        if (existing) {
          return errorResponse('Phone number already in use by another executive', 400);
        }
      }

      const updated = await DeliveryExecutive.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updated) {
        return errorResponse('Delivery executive not found', 404);
      }

      return successResponse(updated, 'Delivery executive updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/delivery-executives/[id]] error:', error);
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
      const deleted = await DeliveryExecutive.findByIdAndDelete(id);
      if (!deleted) {
        return errorResponse('Delivery executive not found', 404);
      }
      return successResponse(null, 'Delivery executive deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/delivery-executives/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
