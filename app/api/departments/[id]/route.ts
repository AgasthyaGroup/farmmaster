import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Department from '@/src/models/Department';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid department id', 400);
      }

      const body = await req.json();
      const name = body?.name?.trim();
      if (!name) {
        return errorResponse('Department name is required', 400);
      }

      await dbConnect();
      const existingDepartment = await Department.findOne({ _id: { $ne: id }, name });
      if (existingDepartment) {
        return errorResponse('Department already exists', 400);
      }

      const department = await Department.findByIdAndUpdate(id, { name }, { new: true });
      if (!department) return notFoundResponse('Department not found');

      return successResponse(department, 'Department updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid department id', 400);
      }

      await dbConnect();
      const department = await Department.findByIdAndDelete(id);
      if (!department) return notFoundResponse('Department not found');

      return successResponse(null, 'Department deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
