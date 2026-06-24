import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Shed from '@/src/models/Shed';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createShedSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'SHEDS'], async () => {
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
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'SHEDS'], async () => {
    try {
      const parsedBody = createShedSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { farmId, name, code, lines, capacity, remarks, lineManagement, milking } = parsedBody.data;

      await dbConnect();

      // Check if a shed with the same farmId and code already exists (even if deleted)
      const existingShed = await Shed.findOne({ farmId, code });
      
      let shed;
      if (existingShed) {
        if (!existingShed.isDeleted) {
          return errorResponse('A shed with this code already exists for this farm.', 400);
        }
        // Revive the soft-deleted shed
        shed = await Shed.findByIdAndUpdate(
          existingShed._id,
          { name, lines, capacity, remarks, lineManagement, milking, isDeleted: false },
          { new: true }
        );
      } else {
        shed = await Shed.create({
          farmId,
          name,
          code,
          lines,
          capacity,
          remarks,
          lineManagement,
          milking,
        });
      }

      return createdResponse(shed, 'Shed created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
