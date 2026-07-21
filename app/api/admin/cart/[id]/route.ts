import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cart from '@/app/api/customer-app/models/Cart';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();
      const { id } = await params;

      // Can delete by cart ID or customerId
      const cart = await Cart.findOneAndDelete({
        $or: [{ _id: id }, { customerId: id }]
      });

      if (!cart) {
        return errorResponse('Cart not found', 404);
      }

      return successResponse(null, 'Cart deleted successfully');
    } catch (error: any) {
      console.error('[DELETE /api/admin/cart/[id]] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
