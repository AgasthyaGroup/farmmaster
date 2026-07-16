import { NextRequest } from 'next/server';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import { MODULE_GROUPS } from '@/src/config/modules';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'ROLES'], async () => {
    try {
      return successResponse(MODULE_GROUPS, 'Module groups fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
