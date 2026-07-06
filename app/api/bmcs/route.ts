import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import BMC from '@/src/models/BMC';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createBmcSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BMC'], async (user) => {
    try {
      await dbConnect();
      const query: any = { isDeleted: false };
      if (user.role !== 'SUPER_ADMIN' && user.farmId) {
        query.farmId = user.farmId;
      }
      const bmcs = await BMC.find(query).populate('farmId').sort({ createdAt: -1 });
      return successResponse(bmcs, 'BMCs fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'BMC'], async (user) => {
    try {
      const parsedBody = createBmcSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { farmId, name, code, capacity, location, description } = parsedBody.data;

      // Access control for non-super admins
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(farmId) !== String(user.farmId)) {
        return errorResponse('You can only create Bulk Milk Coolers for your own farm', 403);
      }

      await dbConnect();

      // Check if a BMC with the same farmId and code already exists (even if deleted)
      const existingBmc = await BMC.findOne({ farmId, code });
      
      let bmc;
      if (existingBmc) {
        if (!existingBmc.isDeleted) {
          return errorResponse('A Bulk Milk Cooler with this code already exists for this farm.', 400);
        }
        // Revive the soft-deleted BMC
        bmc = await BMC.findByIdAndUpdate(
          existingBmc._id,
          { 
            name, capacity, location, description, isDeleted: false, status: 'ACTIVE', currentVolume: 0, temperature: null
          },
          { new: true }
        );
      } else {
        bmc = await BMC.create({
          farmId,
          name,
          code,
          capacity,
          location,
          description,
          currentVolume: 0,
          status: 'ACTIVE'
        });
      }

      return createdResponse(bmc, 'Bulk Milk Cooler defined successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
