import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Role from '@/src/models/Role';
import { withAuth } from '@/src/utils/authGuard';
import { errorResponse, notFoundResponse, successResponse } from '@/src/utils/responses';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid role id', 400);
      }

      const body = await req.json();
      const name = body?.name ? String(body.name).trim().toUpperCase() : undefined;
      const description = body?.description !== undefined ? String(body.description).trim() : undefined;
      const permissions = Array.isArray(body?.permissions)
        ? body.permissions.map((value: string) => String(value).trim().toUpperCase()).filter(Boolean)
        : undefined;

      await dbConnect();
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return notFoundResponse('Role not found');
      }

      if (name && name !== existingRole.name) {
        const duplicate = await Role.findOne({ _id: { $ne: id }, name });
        if (duplicate) {
          return errorResponse('Role already exists', 400);
        }
      }

      const updatePayload: Record<string, any> = {};
      if (name) updatePayload.name = name;
      if (description !== undefined) updatePayload.description = description;
      if (permissions !== undefined) updatePayload.permissions = permissions;

      const updatedRole = await Role.findByIdAndUpdate(id, updatePayload, { new: true });
      return successResponse(updatedRole, 'Role updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid role id', 400);
      }

      await dbConnect();
      const role = await Role.findById(id);
      if (!role) {
        return notFoundResponse('Role not found');
      }
      if (role.isSystem) {
        return errorResponse('System roles cannot be deleted', 400);
      }

      await Role.findByIdAndDelete(id);
      return successResponse(null, 'Role deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
