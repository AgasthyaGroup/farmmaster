import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/DeliveryLocation', () => ({
  default: {
    find: vi.fn(() => ({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'loc-123',
          name: 'Indiranagar',
          pincode: '560038',
          city: 'Bengaluru',
          state: 'Karnataka',
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

import DeliveryLocation from '@/app/api/customer-app/models/DeliveryLocation';
import { GET as getLocations, POST as postLocations } from '@/app/api/admin/delivery-locations/route';
import { GET as getSingleLocation, PUT as putLocation, DELETE as deleteLocation } from '@/app/api/admin/delivery-locations/[id]/route';
import { GET as getCustomerLocations } from '@/app/api/customer-app/delivery-locations/route';

describe('Admin and Customer Delivery Location Catalog API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/delivery-locations returns all delivery locations', async () => {
    const req = new NextRequest('http://localhost/api/admin/delivery-locations', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getLocations(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].pincode).toBe('560038');
  });

  it('POST /api/admin/delivery-locations creates a delivery location successfully', async () => {
    vi.mocked(DeliveryLocation.findOne).mockResolvedValue(null);
    vi.mocked(DeliveryLocation.create).mockResolvedValue({
      _id: 'loc-new',
      name: 'Whitefield',
      pincode: '560066',
      city: 'Bengaluru',
      state: 'Karnataka',
      status: 'inactive',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-locations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Whitefield',
        pincode: '560066',
        city: 'Bengaluru',
        state: 'Karnataka',
      }),
    });

    const response = await postLocations(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.pincode).toBe('560066');
  });

  it('GET /api/admin/delivery-locations/[id] returns single delivery location', async () => {
    vi.mocked(DeliveryLocation.findById).mockResolvedValue({
      _id: 'loc-123',
      pincode: '560038',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-locations/loc-123', {
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getSingleLocation(req as any, { params: Promise.resolve({ id: 'loc-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data._id).toBe('loc-123');
  });

  it('PUT /api/admin/delivery-locations/[id] updates delivery location fields', async () => {
    vi.mocked(DeliveryLocation.findOne).mockResolvedValue(null);
    vi.mocked(DeliveryLocation.findByIdAndUpdate).mockResolvedValue({
      _id: 'loc-123',
      name: 'Indiranagar Premium',
      pincode: '560038',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-locations/loc-123', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Indiranagar Premium' }),
    });

    const response = await putLocation(req as any, { params: Promise.resolve({ id: 'loc-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Indiranagar Premium');
  });

  it('DELETE /api/admin/delivery-locations/[id] deletes delivery location', async () => {
    vi.mocked(DeliveryLocation.findByIdAndDelete).mockResolvedValue({
      _id: 'loc-123',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/delivery-locations/loc-123', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await deleteLocation(req as any, { params: Promise.resolve({ id: 'loc-123' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('GET /api/customer-app/delivery-locations returns active delivery locations', async () => {
    const req = new NextRequest('http://localhost/api/customer-app/delivery-locations');
    const response = await getCustomerLocations(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].status).toBe('active');
  });
});
