import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cart from '@/app/api/customer-app/models/Cart';
import Customer from '@/app/api/customer-app/models/Customer';
import Product from '@/app/api/customer-app/models/Product';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      await dbConnect();

      const carts = await Cart.find({})
        .populate({ path: 'customerId', model: Customer, select: 'name phone email' })
        .sort({ updatedAt: -1 });

      // Collect product details for items across all carts
      const allProductIds = Array.from(
        new Set(
          carts.flatMap((cart: any) => cart.items.map((item: any) => item.productId))
        )
      );

      const products = await Product.find({ _id: { $in: allProductIds } });
      const productMap = new Map(products.map(p => [p._id.toString(), p]));

      const enrichedCarts = carts.map((cart: any) => {
        const items = cart.items.map((item: any) => {
          const prod = productMap.get(item.productId);
          const price = prod ? prod.price : item.price;
          return {
            _id: item._id,
            productId: item.productId,
            quantity: item.quantity,
            price: price,
            addedAt: item.addedAt,
            product: prod ? {
              name: prod.name,
              image: prod.image,
              price: prod.price,
              size: prod.size,
              sku: prod.sku,
              categoryName: prod.categoryName,
            } : null,
          };
        });

        const totalItems = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
        const totalPrice = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

        return {
          _id: cart._id,
          customerId: cart.customerId,
          items,
          totalItems,
          totalPrice,
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        };
      });

      return successResponse(enrichedCarts, 'Carts fetched successfully');
    } catch (error: any) {
      console.error('[GET /api/admin/cart] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
