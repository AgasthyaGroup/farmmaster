import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const user = await User.findById(id).populate('farmId');
      if (!user) return notFoundResponse('User not found');
      return successResponse(user);
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      
      const user = await User.findByIdAndUpdate(
        id,
        { ...body },
        { new: true }
      );

      if (!user) return notFoundResponse('User not found');
      return successResponse(user, 'User updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      
      const user = await User.findByIdAndUpdate(id, { status: false }, { new: true });
      if (!user) return notFoundResponse('User not found');
      
      return successResponse(null, 'User disabled successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
