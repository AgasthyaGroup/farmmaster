import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Shed from '@/src/models/Shed';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      await dbConnect();
      const sheds = await Shed.find({ isDeleted: false }).populate('farmId').sort({ createdAt: -1 });
      return successResponse(sheds, 'Sheds fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      const body = await req.json();
      const { farmId, name, code, lines, capacity, remarks } = body;

      if (!farmId || !name || !code) {
        return errorResponse('Farm, Name and code are required', 400);
      }

      await dbConnect();
      const shed = await Shed.create({
        farmId,
        name,
        code,
        lines,
        capacity,
        remarks,
      });

      return successResponse(shed, 'Shed created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
