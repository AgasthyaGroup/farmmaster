import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
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

      const name = body?.name ? String(body.name).trim() : '';
      const phone = body?.phone ? String(body.phone).trim() : '';
      const email = body?.email ? String(body.email).trim() : '';

      if (!name || !phone) {
        return errorResponse('Name and Phone are required', 400);
      }

      await dbConnect();
      
      // Check if phone is already used by another customer
      const duplicate = await Customer.findOne({ phone, _id: { $ne: id }, isDeleted: false });
      if (duplicate) {
        return errorResponse('Phone number already in use by another customer', 400);
      }

      const updatedCustomer = await Customer.findByIdAndUpdate(
        id,
        { $set: { name, phone, email } },
        { new: true }
      );

      if (!updatedCustomer) {
        return errorResponse('Customer not found', 404);
      }

      return successResponse(updatedCustomer, 'Customer updated successfully');
    } catch (error: any) {
      console.error('[PUT /api/admin/customers/[id]] error:', error);
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

      const deletedCustomer = await Customer.findByIdAndUpdate(
        id,
        { $set: { isDeleted: true } },
        { new: true }
      );

      if (!deletedCustomer) {
        return errorResponse('Customer not found', 404);
      }

      return successResponse(null, 'Customer deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/customers/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
