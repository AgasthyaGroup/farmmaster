import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import GrassManagement from '@/src/models/GrassManagement';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      await dbConnect();
      const records = await GrassManagement.find({ isDeleted: false })
        .populate('sourcingTo')
        .sort({ createdAt: -1 })
        .lean();

      // Dynamically calculate utilized area for each farm
      const GrassCollection = mongoose.models.GrassCollection || mongoose.model('GrassCollection');
      const enrichedRecords = await Promise.all(records.map(async (record) => {
        const query: any = {
          sourcingFarmId: record._id,
          isDeleted: false
        };
        if (record.lastRegrownAt) {
          query.date = { $gt: new Date(record.lastRegrownAt) };
        }
        const collections = await GrassCollection.find(query).lean();
        const utilizedArea = collections.reduce((sum, col) => sum + (col.harvestedArea || 0), 0);
        return {
          ...record,
          utilizedArea
        };
      }));

      return successResponse(enrichedRecords, 'Grass Sourcing Farms fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'GRASS_MANAGEMENT'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await GrassManagement.create(body);
      return createdResponse(record, 'Grass Sourcing Farm created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
