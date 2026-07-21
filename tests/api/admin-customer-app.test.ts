import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {},
}));

vi.mock('@/app/api/customer-app/models/Order', () => ({
  default: {
    find: vi.fn(() => ({
      populate: vi.fn(() => ({
        sort: vi.fn().mockResolvedValue([
          {
            _id: 'order-1',
            orderNumber: 'ORD123',
            status: 'pending',
            items: [],
            customerId: { _id: 'cust-1', name: 'Jaswanth' },
          },
        ]),
      })),
    })),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Favourite', () => ({
  default: {
    find: vi.fn(() => ({
      populate: vi.fn(() => ({
        sort: vi.fn().mockResolvedValue([
          {
            _id: 'fav-1',
            productId: 'prod-milk',
            customerId: { _id: 'cust-1', name: 'Jaswanth' },
          },
        ]),
      })),
    })),
  },
}));

vi.mock('@/app/api/customer-app/models/Cart', () => ({
  default: {
    find: vi.fn(() => ({
      populate: vi.fn(() => ({
        sort: vi.fn().mockResolvedValue([
          {
            _id: 'cart-1',
            items: [{ productId: 'prod-milk', quantity: 2, price: 50 }],
            customerId: { _id: 'cust-1', name: 'Jaswanth' },
          },
        ]),
      })),
    })),
    findOneAndDelete: vi.fn().mockResolvedValue({ _id: 'cart-1' }),
  },
}));

vi.mock('@/app/api/customer-app/models/Product', () => ({
  default: {
    find: vi.fn().mockResolvedValue([
      { _id: 'prod-milk', name: 'Fresh Milk', price: 50 },
    ]),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'admin-token') {
      return { userId: 'admin-123', email: 'admin@gmail.com', role: 'SUPER_ADMIN' };
    }
    return null;
  }),
}));

vi.mock('@/src/models/User', () => ({
  default: {
    findById: vi.fn(() => ({
      select: vi.fn(() => ({
        lean: vi.fn().mockResolvedValue({
          _id: 'admin-123',
          role: 'SUPER_ADMIN',
          status: true,
          permissions: ['SUPER_ADMIN'],
        }),
      })),
    })),
  },
}));

vi.mock('@/src/models/Role', () => ({
  default: {
    findOne: vi.fn(() => ({
      lean: vi.fn().mockResolvedValue({
        permissions: ['SUPER_ADMIN'],
      }),
    })),
  },
}));

import Order from '@/app/api/customer-app/models/Order';
import Favourite from '@/app/api/customer-app/models/Favourite';
import { GET as getOrders } from '@/app/api/admin/orders/route';
import { PUT as putOrder } from '@/app/api/admin/orders/[id]/route';
import { GET as getFavourites } from '@/app/api/admin/favourites/route';
import { GET as getCarts } from '@/app/api/admin/cart/route';
import { DELETE as deleteCart } from '@/app/api/admin/cart/[id]/route';

describe('Admin Customer App Management API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/orders returns orders populated with customer info', async () => {
    const req = new NextRequest('http://localhost/api/admin/orders', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getOrders(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].orderNumber).toBe('ORD123');
    expect(body.data[0].customerId.name).toBe('Jaswanth');
  });

  it('PUT /api/admin/orders/[id] updates order status', async () => {
    vi.mocked(Order.findByIdAndUpdate).mockResolvedValue({
      _id: 'order-1',
      orderNumber: 'ORD123',
      status: 'completed',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/orders/order-1', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });

    const response = await putOrder(req as any, { params: Promise.resolve({ id: 'order-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('completed');
  });

  it('GET /api/admin/favourites returns list of customer favorites', async () => {
    const req = new NextRequest('http://localhost/api/admin/favourites', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getFavourites(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].productId).toBe('prod-milk');
    expect(body.data[0].customerId.name).toBe('Jaswanth');
  });

  it('GET /api/admin/cart returns customer carts', async () => {
    const req = new NextRequest('http://localhost/api/admin/cart', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getCarts(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].items[0].productId).toBe('prod-milk');
    expect(body.data[0].customerId.name).toBe('Jaswanth');
  });

  it('DELETE /api/admin/cart/[id] deletes cart', async () => {
    const req = new NextRequest('http://localhost/api/admin/cart/cart-1', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await deleteCart(req as any, { params: Promise.resolve({ id: 'cart-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
