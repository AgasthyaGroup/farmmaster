import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      // Fetch active customers
      const customers = await Customer.find({ isDeleted: false }).sort({ createdAt: -1 });
      // Fetch all non-deleted addresses
      const addresses = await Address.find({ isDeleted: false });

      // Group addresses by customer ID
      const addressMap: Record<string, any[]> = {};
      addresses.forEach((addr) => {
        const cId = addr.customerId.toString();
        if (!addressMap[cId]) {
          addressMap[cId] = [];
        }
        addressMap[cId].push(addr);
      });

      // Combine customers with their addresses
      const result = customers.map((c) => {
        const plainCustomer = c.toObject();
        return {
          ...plainCustomer,
          addresses: addressMap[c._id.toString()] || [],
        };
      });

      return successResponse(result, 'Customers and their addresses fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/customers] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
