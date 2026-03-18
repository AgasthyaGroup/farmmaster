import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    await dbConnect();

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.status) {
      return errorResponse('Invalid credentials or account disabled', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse('Invalid credentials', 401);
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      farmId: user.farmId ? user.farmId.toString() : null,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return successResponse({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmId: user.farmId,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    }, 'Login successful');
  } catch (error: any) {
    return errorResponse(error.message || 'Something went wrong', 500);
  }
}
