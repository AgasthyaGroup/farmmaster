import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const data = body?.registerUser || body;

    const phoneVal = data?.phone !== undefined ? data.phone : data?.mobile;
    const phone = phoneVal !== undefined ? String(phoneVal).trim() : '';
    const name = data?.name ? String(data.name).trim() : '';
    const email = data?.email ? String(data.email).trim() : '';
    const address1 = data?.address1 ? String(data.address1).trim() : '';
    const address2 = data?.address2 ? String(data.address2).trim() : '';
    const city = data?.city ? String(data.city).trim() : '';
    const state = data?.state ? String(data.state).trim() : '';
    const pincode = data?.pincode ? String(data.pincode).trim() : '';

    if (!phone) {
      return errorResponse('Mobile number (phone) is required', 400);
    }

    await dbConnect();

    // Check if customer already exists and is active
    const existingCustomer = await Customer.findOne({ phone });
    const isRegistered = !!(existingCustomer && !existingCustomer.isDeleted);

    if (isRegistered) {
      return successResponse({
        isRegistered: true,
        user: {
          id: existingCustomer!._id,
          phone: existingCustomer!.phone,
          name: existingCustomer!.name,
          email: existingCustomer!.email,
          role: 'CUSTOMER',
        },
      }, 'Mobile number is already registered');
    }

    // If not registered and name is not provided, return isRegistered: false (check-only mode)
    if (!name) {
      return successResponse({
        isRegistered: false,
      }, 'Mobile number is not registered');
    }

    // Proceed with registration since name is provided
    if (existingCustomer) {
      // If soft-deleted, restore and update
      const restored = await Customer.findByIdAndUpdate(
        existingCustomer._id,
        {
          name,
          email,
          address1,
          address2,
          city,
          state,
          pincode,
          status: true,
          isDeleted: false,
          otp: null,
          otpExpiry: null,
        },
        { new: true }
      );

      if (!restored) {
        return errorResponse('Failed to restore customer profile', 500);
      }

      const payload = {
        userId: restored._id.toString(),
        email: restored.phone,
        role: 'CUSTOMER',
        permissions: ['CUSTOMER'],
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return createdResponse({
        isRegistered: true,
        token: accessToken,
        refreshToken,
        user: {
          id: restored._id,
          phone: restored.phone,
          name: restored.name,
          email: restored.email,
          role: 'CUSTOMER',
        },
      }, 'Customer registered successfully');
    }

    // Create new Customer
    const customer = await Customer.create({
      phone,
      name,
      email,
      address1,
      address2,
      city,
      state,
      pincode,
      status: true,
      isDeleted: false,
    });

    const payload = {
      userId: customer._id.toString(),
      email: customer.phone,
      role: 'CUSTOMER',
      permissions: ['CUSTOMER'],
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return createdResponse({
      isRegistered: true,
      token: accessToken,
      refreshToken,
      user: {
        id: customer._id,
        phone: customer.phone,
        name: customer.name,
        email: customer.email,
        role: 'CUSTOMER',
      },
    }, 'Customer registered successfully');
  } catch (error: any) {
    console.error('[POST /api/customer-app/auth/register] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
