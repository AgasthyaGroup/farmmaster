import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Address', () => ({
  default: {
    find: vi.fn(),
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

vi.mock('@/app/api/customer-app/models/ProductInventory', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue({ quantity: 100 }),
    create: vi.fn().mockResolvedValue({ quantity: 100 }),
    findOneAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-token') {
      return { userId: 'customer-123', email: '1234567890', role: 'CUSTOMER' };
    }
    if (token === 'admin-token') {
      return { userId: 'admin-123', email: 'admin@gmail.com', role: 'SUPER_ADMIN' };
    }
    return null;
  }),
}));

vi.mock('@/src/models/User', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(() => ({
      select: vi.fn(() => ({
        lean: vi.fn(),
      })),
    })),
  },
}));

vi.mock('@/src/models/Role', () => ({
  default: {
    findOne: vi.fn(() => ({
      lean: vi.fn(),
    })),
  },
}));

import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import Favourite from '@/app/api/customer-app/models/Favourite';
import Order from '@/app/api/customer-app/models/Order';
import User from '@/src/models/User';
import Role from '@/src/models/Role';
import { GET as getAddress, PUT as putAddress, DELETE as deleteAddress, PATCH as patchAddress } from '@/app/api/customer-app/addresses/[id]/route';
import { PUT as putProfile } from '@/app/api/customer-app/profile/route';
import { GET as getFavourites, POST as postFavourites } from '@/app/api/customer-app/favourites/route';
import { DELETE as deleteFavourite } from '@/app/api/customer-app/favourites/[id]/route';
import { GET as getOrders, POST as postOrders } from '@/app/api/customer-app/orders/route';
import { GET as getCustomers } from '@/app/api/admin/customers/route';
import { PUT as putAdminCustomer, DELETE as deleteAdminCustomer } from '@/app/api/admin/customers/[id]/route';

describe('Customer Extensions API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Customer.findById).mockResolvedValue(mockCustomerRecord as any);
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord as any);
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

  it('addresses/[id] PUT updates address details', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Address.findOne).mockResolvedValue({
      _id: 'addr-1',
      customerId: 'customer-123',
      isDeleted: false,
    } as any);
    vi.mocked(Address.findByIdAndUpdate).mockResolvedValue({
      _id: 'addr-1',
      fullName: 'Jaswanth Updated',
      label: 'Work',
      phone: '1234567890',
      addressLine1: '789 Main St',
      city: 'Austin',
      state: 'TX',
      pincode: '78701',
      isDefault: true,
    } as any);

    const req = new Request('http://localhost/api/customer-app/addresses/addr-1', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jaswanth Updated',
        label: 'Work',
        phone: '1234567890',
        addressLine1: '789 Main St',
        city: 'Austin',
        state: 'TX',
        pincode: '78701',
        isDefault: true,
      }),
    });

    const response = await putAddress(req as any, { params: Promise.resolve({ id: 'addr-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.fullName).toBe('Jaswanth Updated');
  });

  it('addresses/[id] PATCH sets address as default', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Address.findOne).mockResolvedValue({
      _id: 'addr-1',
      customerId: 'customer-123',
      isDeleted: false,
    } as any);
    vi.mocked(Address.findByIdAndUpdate).mockResolvedValue({
      _id: 'addr-1',
      isDefault: true,
    } as any);

    const req = new Request('http://localhost/api/customer-app/addresses/addr-1', {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await patchAddress(req as any, { params: Promise.resolve({ id: 'addr-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isDefault).toBe(true);
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

  it('admin/customers GET returns list of customers with grouped addresses', async () => {
    const mockLean = vi.fn().mockResolvedValue({
      _id: 'admin-123',
      role: 'SUPER_ADMIN',
      status: true,
      permissions: ['SUPER_ADMIN'],
    });
    const mockSelect = vi.fn(() => ({ lean: mockLean }));
    vi.mocked(User.findById).mockReturnValue({
      select: mockSelect,
    } as any);

    const mockRoleLean = vi.fn().mockResolvedValue({
      permissions: ['SUPER_ADMIN'],
    });
    vi.mocked(Role.findOne).mockReturnValue({
      lean: mockRoleLean,
    } as any);

    vi.mocked(Customer.find).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          _id: 'cust-abc',
          name: 'Jaswanth Customer',
          phone: '9999988888',
          toObject: function() { return this; }
        }
      ])
    } as any);
    vi.mocked(Address.find).mockResolvedValue([
      {
        _id: 'addr-xyz',
        customerId: 'cust-abc',
        fullName: 'Jaswanth G',
        addressLine1: 'Nanakramguda',
        city: 'Hyderabad',
      }
    ] as any);

    const req = new NextRequest('http://localhost/api/admin/customers', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await getCustomers(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe('Jaswanth Customer');
    expect(body.data[0].addresses).toHaveLength(1);
    expect(body.data[0].addresses[0].fullName).toBe('Jaswanth G');
  });

  it('admin/customers/[id] PUT updates customer profile', async () => {
    const mockLean = vi.fn().mockResolvedValue({
      _id: 'admin-123',
      role: 'SUPER_ADMIN',
      status: true,
      permissions: ['SUPER_ADMIN'],
    });
    const mockSelect = vi.fn(() => ({ lean: mockLean }));
    vi.mocked(User.findById).mockReturnValue({
      select: mockSelect,
    } as any);

    const mockRoleLean = vi.fn().mockResolvedValue({
      permissions: ['SUPER_ADMIN'],
    });
    vi.mocked(Role.findOne).mockReturnValue({
      lean: mockRoleLean,
    } as any);

    vi.mocked(Customer.findOne).mockResolvedValue(null);
    vi.mocked(Customer.findByIdAndUpdate).mockResolvedValue({
      _id: 'cust-abc',
      name: 'Jaswanth Updated',
      phone: '9999988888',
      email: 'newemail@gmail.com',
    } as any);

    const req = new NextRequest('http://localhost/api/admin/customers/cust-abc', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer admin-token', 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Jaswanth Updated', phone: '9999988888', email: 'newemail@gmail.com' }),
    });

    const response = await putAdminCustomer(req as any, { params: Promise.resolve({ id: 'cust-abc' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Jaswanth Updated');
  });

  it('admin/customers/[id] DELETE soft deletes customer', async () => {
    const mockLean = vi.fn().mockResolvedValue({
      _id: 'admin-123',
      role: 'SUPER_ADMIN',
      status: true,
      permissions: ['SUPER_ADMIN'],
    });
    const mockSelect = vi.fn(() => ({ lean: mockLean }));
    vi.mocked(User.findById).mockReturnValue({
      select: mockSelect,
    } as any);

    const mockRoleLean = vi.fn().mockResolvedValue({
      permissions: ['SUPER_ADMIN'],
    });
    vi.mocked(Role.findOne).mockReturnValue({
      lean: mockRoleLean,
    } as any);

    vi.mocked(Customer.findByIdAndUpdate).mockResolvedValue({
      _id: 'cust-abc',
      isDeleted: true,
    } as any);

    const req = new NextRequest('http://localhost/api/admin/customers/cust-abc', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer admin-token' },
    });

    const response = await deleteAdminCustomer(req as any, { params: Promise.resolve({ id: 'cust-abc' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
