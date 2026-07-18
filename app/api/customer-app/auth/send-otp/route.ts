import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    let phone = body?.phone?.trim();
    if (!phone) {
      return errorResponse('Phone number is required', 400);
    }

    await dbConnect();

    const universalOtp = '1234';
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    let customer = await Customer.findOne({ phone });
    if (!customer || customer.isDeleted) {
      return successResponse(
        { phone, otp: universalOtp, isRegistered: false },
        'Mobile number is not registered'
      );
    }

    if (customer.status === false) {
      return errorResponse('Account is disabled', 403);
    }

    customer.otp = universalOtp;
    customer.otpExpiry = otpExpiry;
    await customer.save();

    return successResponse(
      { phone: customer.phone, otp: universalOtp, isRegistered: true },
      'OTP sent successfully (universal testing OTP is 1234)'
    );
  } catch (error: any) {
    console.error('[POST /api/customer-app/auth/send-otp] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
