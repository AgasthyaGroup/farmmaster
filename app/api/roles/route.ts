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
    permissions: ['DASHBOARD', 'FARMS', 'SHEDS', 'TAGS', 'CATTLE', 'LAND', 'LAND_MANAGEMENT', 'BMC'],
    isSystem: true,
    status: true,
  },
  {
    name: 'INCHARGE',
    description: 'Access to operations and data entry for a specific farm',
    permissions: ['DASHBOARD', 'CATTLE', 'SHED_LOG', 'CROSSING_LOG', 'HEALTH', 'MILK_PRODUCTION', 'BMC'],
    isSystem: true,
    status: true,
  },
];

async function ensureDefaultRoles() {
  for (const role of DEFAULT_ROLES) {
    await Role.updateOne(
      { name: role.name },
      {
        $setOnInsert: {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
        },
        $set: {
          isSystem: role.isSystem,
          status: role.status,
        },
      },
      { upsert: true }
    );
  }
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'ROLES'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN', 'ROLES'], async () => {
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
        if (existingRole.status !== false) {
          return errorResponse('Role already exists', 400);
        }
        const role = await Role.findByIdAndUpdate(
          existingRole._id,
          { description, permissions, isSystem: false, status: true },
          { new: true }
        );
        return createdResponse(role, 'Role created successfully');
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
