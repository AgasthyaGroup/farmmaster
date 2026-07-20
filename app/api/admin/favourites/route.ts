import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Favourite from '@/app/api/customer-app/models/Favourite';
import Customer from '@/app/api/customer-app/models/Customer';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const favourites = await Favourite.find({})
        .populate({ path: 'customerId', model: Customer })
        .sort({ createdAt: -1 });

      return successResponse(favourites, 'Favourites fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/favourites] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
