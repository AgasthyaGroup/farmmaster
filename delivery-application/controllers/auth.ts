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

    // Clean phone input for robust matching (e.g. +91 9876543210 -> 9876543210)
    const cleanPhone = username.replace(/^(\+91|0)/, '').replace(/\D/g, '');

    // Find Delivery Executive by phone or email
    let executive = await DeliveryExecutive.findOne({
      $or: [
        { phone: username },
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` },
        { email: username.toLowerCase() }
      ]
    });

    // Fallback: Check if account exists in Users collection (for admin/staff login)
    if (!executive) {
      const User = (await import('../models/User')).default || (await import('@/app/api/admin/users/route')).User;
      if (User) {
        const user = await User.findOne({
          $or: [
            { username: username },
            { phone: username },
            { phone: cleanPhone }
          ]
        });

        if (user && user.password) {
          const isUserMatch = (user.password === password) || (await bcrypt.compare(password, user.password).catch(() => false));
          if (isUserMatch) {
            const hashedPassword = await bcrypt.hash(password, 10);
            executive = await DeliveryExecutive.create({
              name: user.name || 'Delivery Executive',
              phone: user.phone || username,
              email: user.email || '',
              password: hashedPassword,
              status: 'active'
            });
          }
        }
      }
    }

    if (!executive) {
      return errorResponse('Invalid credentials', 401);
    }

    if (executive.status === 'inactive') {
      return errorResponse('Account is disabled', 403);
    }

    // Verify Password (bcrypt hash or plain text fallback)
    const isMatch = (executive.password === password) || (await bcrypt.compare(password, executive.password).catch(() => false));
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    // If password was stored as plain text, re-hash it using bcrypt
    if (executive.password === password && !password.startsWith('$2')) {
      executive.password = await bcrypt.hash(password, 10);
      await executive.save();
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
