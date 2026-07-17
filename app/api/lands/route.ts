import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Land from '@/src/models/Land';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createLandSchema } from '@/src/utils/validation';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND', 'INCHARGE', 'GRASS_COLLECTION', 'GRASS'], async (user) => {
    try {
      await dbConnect();
      const query: any = { isDeleted: false };
      if (user.role !== 'SUPER_ADMIN' && user.farmId) {
        query.farmId = user.farmId;
      }
      const lands = await Land.find(query).populate('farmId').sort({ createdAt: -1 }).lean();

      // Dynamically calculate utilized area for each land
      const GrassCollection = mongoose.models.GrassCollection || mongoose.model('GrassCollection');
      const enrichedLands = await Promise.all(lands.map(async (land) => {
        const gcQuery: any = {
          sourcingFarmId: land._id,
          isDeleted: false
        };
        if (land.lastRegrownAt) {
          gcQuery.date = { $gt: new Date(land.lastRegrownAt) };
        }
        const collections = await GrassCollection.find(gcQuery).lean();
        const utilizedArea = collections.reduce((sum, col) => sum + (col.harvestedArea || 0), 0);
        return {
          ...land,
          utilizedArea
        };
      }));

      return successResponse(enrichedLands, 'Lands fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND'], async (user) => {
    try {
      const parsedBody = createLandSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { 
        farmId, name, code, totalArea, unit, location, description, 
        ownershipType, landownerName, landownerPhone, leaseStartDate, leaseEndDate, rentAmount, paymentInterval 
      } = parsedBody.data;

      // Access control for non-super admins
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(farmId) !== String(user.farmId)) {
        return errorResponse('You can only create land for your own farm', 403);
      }

      await dbConnect();

      // Check if a land area with the same farmId and code already exists (even if deleted)
      const existingLand = await Land.findOne({ farmId, code });
      
      let land;
      if (existingLand) {
        if (!existingLand.isDeleted) {
          return errorResponse('A land area with this code already exists for this farm.', 400);
        }
        // Revive the soft-deleted land
        land = await Land.findByIdAndUpdate(
          existingLand._id,
          { 
            name, totalArea, unit, location, description, isDeleted: false, status: 'AVAILABLE',
            ownershipType, landownerName, landownerPhone, leaseStartDate, leaseEndDate, rentAmount, paymentInterval
          },
          { new: true }
        );
      } else {
        land = await Land.create({
          farmId,
          name,
          code,
          totalArea,
          unit,
          location,
          description,
          ownershipType,
          landownerName,
          landownerPhone,
          leaseStartDate,
          leaseEndDate,
          rentAmount,
          paymentInterval
        });
      }

      return createdResponse(land, 'Land created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
