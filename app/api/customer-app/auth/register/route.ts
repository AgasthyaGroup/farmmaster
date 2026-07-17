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

    const phone = body?.phone?.trim();
    const name = body?.name?.trim();
    const email = body?.email?.trim() || '';
    const address1 = body?.address1?.trim() || '';
    const address2 = body?.address2?.trim() || '';
    const city = body?.city?.trim() || '';
    const state = body?.state?.trim() || '';
    const pincode = body?.pincode?.trim() || '';

    if (!phone) {
      return errorResponse('Mobile number (phone) is required', 400);
    }

    if (!name) {
      return errorResponse('Full name (name) is required', 400);
    }

    await dbConnect();

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      if (!existingCustomer.isDeleted) {
        return errorResponse('Mobile number is already registered', 400);
      }
      
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
