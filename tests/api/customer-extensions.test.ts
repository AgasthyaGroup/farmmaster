import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Address', () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Favourite', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Order', () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-token') {
      return { userId: 'customer-123', email: '1234567890', role: 'CUSTOMER' };
    }
    return null;
  }),
}));

import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import Favourite from '@/app/api/customer-app/models/Favourite';
import Order from '@/app/api/customer-app/models/Order';
import { GET as getAddress, PUT as putAddress, DELETE as deleteAddress, PATCH as patchAddress } from '@/app/api/customer-app/addresses/[id]/route';
import { PUT as putProfile } from '@/app/api/customer-app/profile/route';
import { GET as getFavourites, POST as postFavourites } from '@/app/api/customer-app/favourites/route';
import { DELETE as deleteFavourite } from '@/app/api/customer-app/favourites/[id]/route';
import { GET as getOrders, POST as postOrders } from '@/app/api/customer-app/orders/route';

describe('Customer Extensions API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCustomerRecord = {
    _id: 'customer-123',
    phone: '1234567890',
    status: true,
    isDeleted: false,
    name: 'Jaswanth',
  };

  it('profile PUT updates profile info', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Customer.findByIdAndUpdate).mockResolvedValue({
      ...mockCustomerRecord,
      name: 'Jaswanth Updated',
      email: 'newemail@gmail.com',
    } as any);

    const req = new Request('http://localhost/api/customer-app/profile', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Jaswanth Updated', email: 'newemail@gmail.com' }),
    });

    const response = await putProfile(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Jaswanth Updated');
    expect(Customer.findByIdAndUpdate).toHaveBeenCalledWith('customer-123', {
      $set: { name: 'Jaswanth Updated', email: 'newemail@gmail.com' },
    }, { new: true });
  });

  it('addresses/[id] GET returns specific address', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Address.findOne).mockResolvedValue({
      _id: 'addr-1',
      fullName: 'Jaswanth G',
      label: 'Home',
    } as any);

    const req = new Request('http://localhost/api/customer-app/addresses/addr-1', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await getAddress(req as any, { params: Promise.resolve({ id: 'addr-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.fullName).toBe('Jaswanth G');
  });

  it('favourites GET returns custom structure', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Favourite.find).mockResolvedValue([
      { productId: 'prod-abc' },
      { productId: 'prod-xyz' },
    ] as any);

    const req = new Request('http://localhost/api/customer-app/favourites', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await getFavourites(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.favourites).toHaveLength(2);
    expect(body.favourites[0]._id).toBe('prod-abc');
  });

  it('favourites POST creates favourite', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Favourite.findOne).mockResolvedValue(null);
    vi.mocked(Favourite.create).mockResolvedValue({
      customerId: 'customer-123',
      productId: 'prod-abc',
    } as any);

    const req = new Request('http://localhost/api/customer-app/favourites', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({ productId: 'prod-abc' }),
    });

    const response = await postFavourites(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('orders GET returns raw list directly', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    const mockOrders = [
      { _id: 'ord-1', orderNumber: 'ORD-100', status: 'pending', items: [{ product: 'prod-1', name: 'Milk', price: 50, quantity: 2 }] }
    ];
    const mockSort = vi.fn().mockResolvedValue(mockOrders);
    vi.mocked(Order.find).mockReturnValue({
      sort: mockSort,
    } as any);

    const req = new Request('http://localhost/api/customer-app/orders', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await getOrders(req as any);
    const body = await response.json();

    expect(Array.isArray(body)).toBe(true);
    expect(body[0].orderNumber).toBe('ORD-100');
  });
});
