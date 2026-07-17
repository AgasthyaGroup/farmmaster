import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
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
    const otp = body?.otp?.trim();

    if (!phone) {
      return errorResponse('Phone number is required', 400);
    }
    if (!otp) {
      return errorResponse('OTP code is required', 400);
    }

    await dbConnect();

    const customer = await Customer.findOne({ phone });
    if (!customer || customer.isDeleted) {
      return errorResponse('Customer record not found. Please request OTP first.', 404);
    }

    if (customer.status === false) {
      return errorResponse('Account is disabled', 403);
    }

    // Verify OTP code and expiry
    if (customer.otp !== otp) {
      return errorResponse('Invalid OTP code', 400);
    }

    if (!customer.otpExpiry || customer.otpExpiry < new Date()) {
      return errorResponse('OTP code has expired', 400);
    }

    // Clear OTP fields
    customer.otp = null;
    customer.otpExpiry = null;
    await customer.save();

    // Sign JWT tokens
    const payload = {
      userId: customer._id.toString(),
      email: customer.phone, // fall back email parameter to phone number
      role: 'CUSTOMER',
      permissions: ['CUSTOMER'],
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return successResponse({
      token: accessToken,
      refreshToken,
      user: {
        id: customer._id,
        phone: customer.phone,
        name: customer.name,
        role: 'CUSTOMER',
      },
    }, 'Login successful');
  } catch (error: any) {
    console.error('[POST /api/customer-app/auth/verify-otp] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
