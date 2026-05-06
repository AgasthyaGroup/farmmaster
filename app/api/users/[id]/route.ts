import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';
import { objectIdSchema, updateUserSchema } from '@/src/utils/validation';

const sanitizeUser = (user: any) => {
  if (!user) return user;
  const plainUser = typeof user.toObject === 'function' ? user.toObject() : user;
  const { password, ...safeUser } = plainUser;
  return safeUser;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id', 400);
      }
      await dbConnect();
      const user = await User.findById(parsedId.data).populate('farmId');
      if (!user) return notFoundResponse('User not found');
      return successResponse(sanitizeUser(user));
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id', 400);
      }
      const parsedBody = updateUserSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }

      await dbConnect();

      const user = await User.findByIdAndUpdate(
        parsedId.data,
        parsedBody.data,
        { new: true }
      );

      if (!user) return notFoundResponse('User not found');
      return successResponse(sanitizeUser(user), 'User updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const parsedId = objectIdSchema.safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid user id', 400);
      }
      await dbConnect();
      
      const user = await User.findByIdAndUpdate(parsedId.data, { status: false }, { new: true });
      if (!user) return notFoundResponse('User not found');
      
      return successResponse(null, 'User disabled successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
