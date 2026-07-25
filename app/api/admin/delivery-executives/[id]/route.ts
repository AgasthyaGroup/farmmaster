import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
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

      const updateData = { ...body };
      if (updateData.password && String(updateData.password).trim() !== '') {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        delete updateData.password;
      }

      if (updateData.pincodes !== undefined) {
        updateData.pincodes = Array.isArray(updateData.pincodes)
          ? updateData.pincodes.map((p: any) => String(p).trim()).filter(Boolean)
          : (typeof updateData.pincodes === 'string' ? updateData.pincodes.split(',').map((p: string) => p.trim()).filter(Boolean) : []);
      }

      // If assignedRouteId was provided and pincodes was empty, sync from route
      if (updateData.assignedRouteId && (!updateData.pincodes || updateData.pincodes.length === 0)) {
        const routeObj = await DeliveryRoute.findById(updateData.assignedRouteId);
        if (routeObj && routeObj.pincodes) {
          updateData.pincodes = routeObj.pincodes;
        }
      }

      const updated = await DeliveryExecutive.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!updated) {
        return errorResponse('Delivery executive not found', 404);
      }

      // Sync route assignedExecutiveId
      if (updateData.assignedRouteId !== undefined) {
        // Clear previous routes assigned to this executive
        await DeliveryRoute.updateMany(
          { assignedExecutiveId: id },
          { $set: { assignedExecutiveId: null } }
        );
        if (updateData.assignedRouteId) {
          await DeliveryRoute.findByIdAndUpdate(updateData.assignedRouteId, { assignedExecutiveId: id });
        }
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
