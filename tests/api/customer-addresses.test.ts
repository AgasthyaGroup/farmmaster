import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/app/api/customer-app/models/Address', () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateMany: vi.fn(),
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
import { GET, POST, PUT, PATCH, DELETE } from '@/app/api/customer-app/addresses/route';

describe('Customer Addresses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCustomerRecord = {
    _id: 'customer-123',
    phone: '1234567890',
    status: true,
    isDeleted: false,
  };

  it('GET returns unauthorized if token is missing or invalid', async () => {
    const req = new Request('http://localhost/api/customer-app/addresses', {
      method: 'GET',
    });

    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('GET returns list of addresses for authorized customer', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    
    const mockAddresses = [
      { _id: 'addr-1', name: 'Home', isDefault: true },
      { _id: 'addr-2', name: 'Work', isDefault: false },
    ];
    
    // For Address.find().sort() chaining:
    const mockSort = vi.fn().mockResolvedValue(mockAddresses);
    vi.mocked(Address.find).mockReturnValue({
      sort: mockSort,
    } as any);

    const req = new Request('http://localhost/api/customer-app/addresses', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe('Home');
  });

  it('POST creates a new address', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    vi.mocked(Address.create).mockResolvedValue({
      _id: 'addr-new',
      name: 'Office',
      addressLine1: '123 Main St',
      city: 'Austin',
      state: 'TX',
      pincode: '78701',
      isDefault: true,
    } as any);

    const req = new Request('http://localhost/api/customer-app/addresses', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Office',
        phone: '1234567890',
        addressLine1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        pincode: '78701',
        isDefault: true,
      }),
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Office');
    expect(Address.updateMany).toHaveBeenCalledWith({ customerId: 'customer-123' }, { isDefault: false });
  });

  it('DELETE soft deletes an address', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustomerRecord);
    
    const mockSave = vi.fn();
    const mockAddressRecord = {
      _id: 'addr-1',
      customerId: 'customer-123',
      isDeleted: false,
      save: mockSave,
    };
    vi.mocked(Address.findOne).mockResolvedValue(mockAddressRecord);

    const req = new Request('http://localhost/api/customer-app/addresses?id=addr-1', {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer valid-token' },
    });

    const response = await DELETE(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockAddressRecord.isDeleted).toBe(true);
    expect(mockSave).toHaveBeenCalled();
  });
});
