import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Department from '@/src/models/Department';
import { withAuth } from '@/src/utils/authGuard';
import { createdResponse, errorResponse, successResponse } from '@/src/utils/responses';

const DEFAULT_DEPARTMENTS = [
  'Global',
  'Accounts',
  'Admin',
  'Management',
  'Veternary',
  'Farming',
  'BMC',
  'Milking',
  'Others',
];

async function ensureDefaultDepartments() {
  for (const name of DEFAULT_DEPARTMENTS) {
    await Department.updateOne(
      { name },
      {
        $setOnInsert: { name },
        $set: { status: true },
      },
      { upsert: true }
    );
  }
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      await dbConnect();
      await ensureDefaultDepartments();
      const departments = await Department.find().sort({ name: 1 });
      return successResponse(departments, 'Departments fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const body = await req.json();
      const name = body?.name?.trim();
      if (!name) {
        return errorResponse('Department name is required', 400);
      }

      await dbConnect();
      const existingDepartment = await Department.findOne({ name });
      if (existingDepartment) {
        return errorResponse('Department already exists', 400);
      }

      const department = await Department.create({ name, status: true });
      return createdResponse(department, 'Department created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
