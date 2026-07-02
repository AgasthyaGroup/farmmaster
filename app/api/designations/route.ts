import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Designation from '@/src/models/Designation';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const records = await Designation.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).lean();
      return successResponse(records, 'Designations fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'LABOR_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      await dbConnect();

      if (!body.name || !String(body.name).trim()) {
        return errorResponse('Designation name is required', 400);
      }

      const trimmedName = String(body.name).trim();

      // Check duplicate designation
      const existing = await Designation.findOne({ 
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        isDeleted: { $ne: true }
      });
      
      if (existing) {
        return errorResponse('Designation already exists', 400);
      }

      const record = await Designation.create({
        name: trimmedName,
        description: body.description ? String(body.description).trim() : '',
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });

      return createdResponse(record, 'Designation registered successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
