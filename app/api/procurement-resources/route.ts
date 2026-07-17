import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import ProcurementResource from '@/src/models/ProcurementResource';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createProcurementResourceSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'MILK', 'INCHARGE'], async (user) => {
    try {
      await dbConnect();
      const query: any = { isDeleted: false };
      if (user.role !== 'SUPER_ADMIN' && user.farmId) {
        query.farmId = user.farmId;
      }
      const resources = await ProcurementResource.find(query).populate('farmId').sort({ createdAt: -1 }).lean();
      return successResponse(resources, 'Procurement resources fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async (user) => {
    try {
      const parsedBody = createProcurementResourceSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { farmId, name, code, type, phone, address, description } = parsedBody.data;

      // Access control for non-super admins
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(farmId) !== String(user.farmId)) {
        return errorResponse('You can only create procurement resources for your own farm', 403);
      }

      await dbConnect();

      // Check if a resource with the same farmId and code already exists (even if deleted)
      const existingResource = await ProcurementResource.findOne({ farmId, code });
      
      let resource;
      if (existingResource) {
        if (!existingResource.isDeleted) {
          return errorResponse('A procurement resource with this code already exists for this farm.', 400);
        }
        // Revive the soft-deleted resource
        resource = await ProcurementResource.findByIdAndUpdate(
          existingResource._id,
          { 
            name, type, phone, address, description, isDeleted: false, status: 'ACTIVE'
          },
          { new: true }
        );
      } else {
        resource = await ProcurementResource.create({
          farmId,
          name,
          code,
          type,
          phone,
          address,
          description,
          status: 'ACTIVE'
        });
      }

      return createdResponse(resource, 'Procurement resource defined successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
