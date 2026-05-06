import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Role from '@/src/models/Role';
import { withAuth } from '@/src/utils/authGuard';
import { createdResponse, errorResponse, successResponse } from '@/src/utils/responses';

const DEFAULT_ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full access to all modules and settings',
    permissions: ['ALL'],
    isSystem: true,
    status: true,
  },
  {
    name: 'FARM_ADMIN',
    description: 'Access to all modules except user management',
    permissions: ['DASHBOARD', 'FARMS', 'SHEDS', 'TAGS', 'CATTLE', 'ROLE_MANAGEMENT'],
    isSystem: true,
    status: true,
  },
];

async function ensureDefaultRoles() {
  for (const role of DEFAULT_ROLES) {
    await Role.updateOne(
      { name: role.name },
      {
        $setOnInsert: role,
        $set: {
          description: role.description,
          permissions: role.permissions,
          isSystem: role.isSystem,
          status: role.status,
        },
      },
      { upsert: true }
    );
  }
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      await dbConnect();
      await ensureDefaultRoles();
      const roles = await Role.find().sort({ createdAt: -1 });
      return successResponse(roles, 'Roles fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim()?.toUpperCase();
      const description = body?.description?.trim() || '';
      const permissions = Array.isArray(body?.permissions)
        ? body.permissions.map((value: string) => String(value).trim().toUpperCase()).filter(Boolean)
        : [];

      if (!name) {
        return errorResponse('Role name is required', 400);
      }

      await dbConnect();
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return errorResponse('Role already exists', 400);
      }

      const role = await Role.create({
        name,
        description,
        permissions,
        isSystem: false,
        status: true,
      });
      return createdResponse(role, 'Role created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
