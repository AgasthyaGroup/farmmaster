import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import PaymentMethod from '@/app/api/customer-app/models/PaymentMethod';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, createdResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const paymentMethods = await PaymentMethod.find({}).sort({ displayOrder: 1, createdAt: -1 });
      return successResponse(paymentMethods, 'Payment methods fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/payment-methods] error:', error);
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

      const { name, code, description, enabled, displayOrder } = body;

      if (!name || !code) {
        return errorResponse('Name and Code are required fields', 400);
      }

      await dbConnect();

      // Check duplicate code
      const existing = await PaymentMethod.findOne({ code: code.toUpperCase() });
      if (existing) {
        return errorResponse('Payment method code already exists', 400);
      }

      const newPaymentMethod = await PaymentMethod.create({
        name,
        code: code.toUpperCase(),
        description: description || '',
        enabled: enabled !== undefined ? enabled : true,
        displayOrder: displayOrder || 0,
      });

      return createdResponse(newPaymentMethod, 'Payment method created successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/payment-methods] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
