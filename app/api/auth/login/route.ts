import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import { successResponse, errorResponse } from '@/src/utils/responses';
import { loginSchema } from '@/src/utils/validation';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Request body must be valid JSON', 400);
  }

  const parsedBody = loginSchema.safeParse(body);
  if (!parsedBody.success) {
    return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
  }
  const { identifier, password } = parsedBody.data;

  try {
    await dbConnect();

    const normalizedIdentifier = identifier.trim();
    const user = await User.findOne({
      $or: [
        { email: normalizedIdentifier.toLowerCase() },
        { userId: normalizedIdentifier },
      ],
    }).select('+password');
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
        userId: user.userId,
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
  } catch (error) {
    console.error('[POST /api/auth/login] unexpected error:', error);
    return errorResponse('Something went wrong. Please try again later.', 500);
  }
}
