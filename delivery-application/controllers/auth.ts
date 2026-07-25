import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import DeliveryExecutive from '../models/DeliveryExecutive';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function login(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const username = body?.username ? String(body.username).trim() : '';
    const password = body?.password ? String(body.password) : '';

    if (!username || !password) {
      return errorResponse('Username (phone/email) and password are required', 400);
    }

    await dbConnect();

    // Find Delivery Executive by phone or email
    const executive = await DeliveryExecutive.findOne({
      $or: [
        { phone: username },
        { email: username.toLowerCase() }
      ]
    });

    if (!executive) {
      return errorResponse('Invalid credentials', 401);
    }

    if (executive.status === 'inactive') {
      return errorResponse('Account is disabled', 403);
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, executive.password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    // Generate Tokens
    const payload = {
      userId: executive._id.toString(),
      email: executive.email || executive.phone,
      role: 'DELIVERY_EXECUTIVE',
      permissions: ['DELIVERY_EXECUTIVE'],
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return successResponse({
      token: accessToken,
      refreshToken,
      user: {
        id: executive._id,
        name: executive.name,
        phone: executive.phone,
        mobile: executive.phone,
        email: executive.email,
        vehicleType: executive.vehicleType,
        vehicleNumber: executive.vehicleNumber,
        role: 'DELIVERY_EXECUTIVE',
      },
    }, 'Login successful');
  } catch (error: any) {
    console.error('[Delivery Auth Login] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function register(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { name, phone, email, password, vehicleType, vehicleNumber } = body;

    if (!name || !phone || !password) {
      return errorResponse('Name, phone, and password are required', 400);
    }

    await dbConnect();

    const existing = await DeliveryExecutive.findOne({ phone });
    if (existing) {
      return errorResponse('Phone number already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const executive = await DeliveryExecutive.create({
      name,
      phone,
      email: email || '',
      password: hashedPassword,
      vehicleType: vehicleType || 'Bike',
      vehicleNumber: vehicleNumber || '',
      status: 'active',
    });

    const payload = {
      userId: executive._id.toString(),
      email: executive.email || executive.phone,
      role: 'DELIVERY_EXECUTIVE',
      permissions: ['DELIVERY_EXECUTIVE'],
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return createdResponse({
      token: accessToken,
      refreshToken,
      user: {
        id: executive._id,
        name: executive.name,
        phone: executive.phone,
        mobile: executive.phone,
        email: executive.email,
        vehicleType: executive.vehicleType,
        vehicleNumber: executive.vehicleNumber,
        role: 'DELIVERY_EXECUTIVE',
      },
    }, 'Delivery Executive registered successfully');
  } catch (error: any) {
    console.error('[Delivery Auth Register] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
