import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import Shed from '@/src/models/Shed';
import Tag from '@/src/models/Tag';
import Cattle from '@/src/models/Cattle';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async (user) => {
    try {
      await dbConnect();
      
      const filter: any = { isDeleted: false };
      if (user.role === 'FARM_ADMIN' && user.farmId) {
        filter.farmId = user.farmId;
      }

      const [totalFarms, totalSheds, totalCattle, totalTags] = await Promise.all([
        user.role === 'SUPER_ADMIN' ? Farm.countDocuments({ isDeleted: false }) : Promise.resolve(1),
        Shed.countDocuments(filter),
        Cattle.countDocuments(filter),
        Tag.countDocuments(filter),
      ]);

      const activeTags = await Tag.countDocuments({ ...filter, status: 'ASSIGNED' });
      const availableTags = await Tag.countDocuments({ ...filter, status: 'AVAILABLE' });

      return successResponse({
        totalFarms,
        totalSheds,
        totalCattle,
        totalTags,
        activeTags,
        availableTags,
      }, 'Dashboard stats fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
