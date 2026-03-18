import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      await dbConnect();
      const users = await User.find().populate('farmId').sort({ createdAt: -1 });
      return successResponse(users, 'Users fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const { name, email, phone, password, role, farmId } = body;

      if (!name || !email || !password || !role) {
        return errorResponse('Missing required fields', 400);
      }

      await dbConnect();
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse('Email already registered', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        farmId: role === 'SUPER_ADMIN' ? null : farmId,
      });

      return successResponse(user, 'User created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
