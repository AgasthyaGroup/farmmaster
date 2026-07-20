import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/DeliveryExecutive', () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'exec-123',
          name: 'Ramesh Kumar',
          phone: '9876543210',
          email: 'ramesh@gmail.com',
          vehicleType: 'Bike',
          vehicleNumber: 'KA-03-HA-1234',
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

vi.mock('@/app/api/customer-app/models/DeliveryRoute', () => ({
  default: {
    find: vi.fn(() => ({
      populate: vi.fn(() => ({
        sort: vi.fn().mockResolvedValue([
          {
            _id: 'route-123',
            routeName: 'ORR North',
            routeCode: 'ORR-N',
            startPoint: 'Farm Hub',
            endPoint: 'Indiranagar Depot',
            pincodes: ['560038'],
            assignedExecutiveId: {
              _id: 'exec-123',
              name: 'Ramesh Kumar',
            },
            status: 'active',
          },
        ]),
      })),
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

import DeliveryExecutive from '@/app/api/customer-app/models/DeliveryExecutive';
import DeliveryRoute from '@/app/api/customer-app/models/DeliveryRoute';
import { GET as getExecutives, POST as postExecutives } from '@/app/api/admin/delivery-executives/route';
import { GET as getSingleExecutive, PUT as putExecutive, DELETE as deleteExecutive } from '@/app/api/admin/delivery-executives/[id]/route';
import { GET as getRoutes, POST as postRoutes } from '@/app/api/admin/delivery-routes/route';
import { GET as getSingleRoute, PUT as putRoute, DELETE as deleteRoute } from '@/app/api/admin/delivery-routes/[id]/route';

describe('Admin Delivery Logistics (Executives & Routes) API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // EXECUTIVES TESTS
  it('GET /api/admin/delivery-executives returns all executives', async () => {
    const req = new NextRequest('http://localhost/api/admin/delivery-executives', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getExecutives(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].phone).toBe('9876543210');
  });

  it('POST /api/admin/delivery-executives creates an executive successfully', async () => {
    vi.mocked(DeliveryExecutive.findOne).mockResolvedValue(null);
    vi.mocked(DeliveryExecutive.create).mockResolvedValue({
      _id: 'exec-new',
      name: 'Suresh Kumar',
      phone: '9876543211',
      status: 'inactive',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-executives', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Kumar',
        phone: '9876543211',
      }),
    });

    const response = await postExecutives(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.phone).toBe('9876543211');
  });

  it('GET /api/admin/delivery-executives/[id] returns single executive', async () => {
    vi.mocked(DeliveryExecutive.findById).mockResolvedValue({
      _id: 'exec-123',
      phone: '9876543210',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-executives/exec-123', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getSingleExecutive(req as any, { params: Promise.resolve({ id: 'exec-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('exec-123');
  });

  // ROUTES TESTS
  it('GET /api/admin/delivery-routes returns all routes', async () => {
    const req = new NextRequest('http://localhost/api/admin/delivery-routes', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getRoutes(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].routeCode).toBe('ORR-N');
  });

  it('POST /api/admin/delivery-routes creates a route successfully', async () => {
    vi.mocked(DeliveryRoute.findOne).mockResolvedValue(null);
    vi.mocked(DeliveryRoute.create).mockResolvedValue({
      _id: 'route-new',
      routeName: 'ORR South',
      routeCode: 'ORR-S',
      status: 'inactive',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-routes', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        routeName: 'ORR South',
        routeCode: 'ORR-S',
      }),
    });

    const response = await postRoutes(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.routeCode).toBe('ORR-S');
  });
});
