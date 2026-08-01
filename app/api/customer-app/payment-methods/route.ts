import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import PaymentMethod from '../models/PaymentMethod';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const paymentMethods = await PaymentMethod.find({ enabled: true }).sort({ displayOrder: 1, createdAt: 1 });
    return NextResponse.json({ success: true, data: paymentMethods });
  } catch (error: any) {
    console.error('[GET /api/customer-app/payment-methods] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
