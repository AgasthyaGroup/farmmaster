import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Category', () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'cat-123',
          name: 'Cow Milk',
          code: 'MILK-COW',
          image: '',
          volume: '500ml',
          price: 30,
          description: 'Fresh milk',
          benefits: [],
          status: 'active',
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

import Category from '@/app/api/customer-app/models/Category';
import { GET as getCategories, POST as postCategories } from '@/app/api/admin/categories/route';
import { GET as getSingleCategory, PUT as putCategory, DELETE as deleteCategory } from '@/app/api/admin/categories/[id]/route';
import { GET as getCustomerCategories } from '@/app/api/customer-app/categories/route';

describe('Admin and Customer Category Catalog API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/categories returns all categories', async () => {
    const req = new NextRequest('http://localhost/api/admin/categories', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getCategories(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].code).toBe('MILK-COW');
  });

  it('POST /api/admin/categories creates a category successfully', async () => {
    vi.mocked(Category.findOne).mockResolvedValue(null);
    vi.mocked(Category.create).mockResolvedValue({
      _id: 'cat-new',
      name: 'Organic Ghee',
      code: 'GHEE-ORG',
      price: 450,
      status: 'inactive',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/categories', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Organic Ghee',
        code: 'GHEE-ORG',
        price: 450,
      }),
    });

    const response = await postCategories(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.code).toBe('GHEE-ORG');
  });

  it('GET /api/admin/categories/[id] returns single category', async () => {
    vi.mocked(Category.findById).mockResolvedValue({
      _id: 'cat-123',
      code: 'MILK-COW',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/categories/cat-123', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getSingleCategory(req as any, { params: Promise.resolve({ id: 'cat-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('cat-123');
  });

  it('PUT /api/admin/categories/[id] updates category fields', async () => {
    vi.mocked(Category.findOne).mockResolvedValue(null);
    vi.mocked(Category.findByIdAndUpdate).mockResolvedValue({
      _id: 'cat-123',
      name: 'Fresh Cow Milk Premium',
      code: 'MILK-COW',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/categories/cat-123', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Fresh Cow Milk Premium' }),
    });

    const response = await putCategory(req as any, { params: Promise.resolve({ id: 'cat-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Fresh Cow Milk Premium');
  });

  it('DELETE /api/admin/categories/[id] deletes category', async () => {
    vi.mocked(Category.findByIdAndDelete).mockResolvedValue({
      _id: 'cat-123',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/categories/cat-123', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await deleteCategory(req as any, { params: Promise.resolve({ id: 'cat-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /api/customer-app/categories returns active categories', async () => {
    const req = new NextRequest('http://localhost/api/customer-app/categories');
    const response = await getCustomerCategories(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].status).toBe('active');
  });
});
