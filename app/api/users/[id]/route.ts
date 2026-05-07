import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import Department from '@/src/models/Department';
import Role from '@/src/models/Role';
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

      if (parsedBody.data.email || parsedBody.data.userId) {
        const existingUser = await User.findOne({
          _id: { $ne: parsedId.data },
          $or: [
            ...(parsedBody.data.email ? [{ email: parsedBody.data.email }] : []),
            ...(parsedBody.data.userId ? [{ userId: parsedBody.data.userId }] : []),
          ],
        });
        if (existingUser) {
          return errorResponse('Email or User ID already registered', 400);
        }
      }

      if (parsedBody.data.department) {
        const existingDepartment = await Department.findOne({ name: parsedBody.data.department });
        if (!existingDepartment) {
          return errorResponse('Invalid department', 400);
        }
      }

      if (parsedBody.data.role) {
        const existingRole = await Role.findOne({ name: parsedBody.data.role });
        if (!existingRole) {
          return errorResponse('Invalid role', 400);
        }
      }

      const user = await User.findByIdAndUpdate(
        parsedId.data,
        parsedBody.data,
        { new: true, runValidators: true }
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
