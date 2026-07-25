import { updateOrderStatus } from '@/delivery-application/controllers/orders';

export async function PATCH(request: any, context: any) {
  return updateOrderStatus(request, context);
}
