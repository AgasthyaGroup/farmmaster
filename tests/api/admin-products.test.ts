import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Product', () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'prod-123',
          name: 'Fresh Cow Milk',
          sku: 'MILK-COW',
          price: 60,
          quantity: 100,
          status: 'active',
          categoryId: 'cat-123',
          categoryName: 'Dairy',
          categoryCode: 'DAIRY',
        },
      ]),
    })),
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
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

import Product from '@/app/api/customer-app/models/Product';
import { GET as getProducts, POST as postProducts } from '@/app/api/admin/products/route';
import { GET as getSingleProduct, PUT as putProduct, DELETE as deleteProduct } from '@/app/api/admin/products/[id]/route';
import { GET as getCustomerProducts } from '@/app/api/customer-app/products/route';

describe('Admin and Customer Product Catalog API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/products returns all products', async () => {
    const req = new NextRequest('http://localhost/api/admin/products', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getProducts(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].sku).toBe('MILK-COW');
  });

  it('POST /api/admin/products creates a product successfully', async () => {
    vi.mocked(Product.findOne).mockResolvedValue(null);
    vi.mocked(Product.create).mockResolvedValue({
      _id: 'prod-new',
      name: 'Organic Butter',
      sku: 'BUTTER-ORG',
      price: 150,
      quantity: 50,
      status: 'inactive',
      categoryId: 'cat-123',
      categoryName: 'Dairy',
      categoryCode: 'DAIRY',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/products', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Organic Butter',
        sku: 'BUTTER-ORG',
        price: 150,
        quantity: 50,
        categoryId: 'cat-123',
        categoryName: 'Dairy',
        categoryCode: 'DAIRY',
      }),
    });

    const response = await postProducts(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.sku).toBe('BUTTER-ORG');
  });

  it('GET /api/admin/products/[id] returns single product', async () => {
    vi.mocked(Product.findById).mockResolvedValue({
      _id: 'prod-123',
      sku: 'MILK-COW',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/products/prod-123', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getSingleProduct(req as any, { params: Promise.resolve({ id: 'prod-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('prod-123');
  });

  it('PUT /api/admin/products/[id] updates product fields', async () => {
    vi.mocked(Product.findOne).mockResolvedValue(null);
    vi.mocked(Product.findByIdAndUpdate).mockResolvedValue({
      _id: 'prod-123',
      name: 'Fresh Cow Milk Premium',
      sku: 'MILK-COW',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/products/prod-123', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Fresh Cow Milk Premium' }),
    });

    const response = await putProduct(req as any, { params: Promise.resolve({ id: 'prod-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Fresh Cow Milk Premium');
  });

  it('DELETE /api/admin/products/[id] deletes product', async () => {
    vi.mocked(Product.findByIdAndDelete).mockResolvedValue({
      _id: 'prod-123',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/products/prod-123', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await deleteProduct(req as any, { params: Promise.resolve({ id: 'prod-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /api/customer-app/products returns active products', async () => {
    const req = new NextRequest('http://localhost/api/customer-app/products');
    const response = await getCustomerProducts(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].status).toBe('active');
  });
});
