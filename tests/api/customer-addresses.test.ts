import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findById: vi.fn(),
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
import { GET, POST } from '@/app/api/customer-app/addresses/route';

describe('Customer Addresses API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCustomerRecord = {
    _id: 'customer-123',
    name: 'Jaswanth G',
    phone: '1234567890',
    status: true,
    isDeleted: false,
    save: vi.fn().mockResolvedValue(true),
  };

  it('GET returns list of addresses for authorized customer', async () => {
    vi.mocked(Customer.findById).mockResolvedValue(mockCustomerRecord as any);
    
    const mockAddresses = [
      { _id: 'addr-1', fullName: 'Jaswanth G', label: 'Home', isDefault: true, toObject: () => ({ _id: 'addr-1', fullName: 'Jaswanth G', label: 'Home', isDefault: true }) },
      { _id: 'addr-2', fullName: 'Jaswanth Office', label: 'Work', isDefault: false, toObject: () => ({ _id: 'addr-2', fullName: 'Jaswanth Office', label: 'Work', isDefault: false }) },
    ];
    
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
    expect(body.data[0].label).toBe('Home');
    expect(body.data[0].fullName).toBe('Jaswanth G');
  });

  it('POST creates a new address', async () => {
    vi.mocked(Customer.findById).mockResolvedValue(mockCustomerRecord as any);
    vi.mocked(Address.create).mockResolvedValue({
      _id: 'addr-new',
      fullName: 'Jaswanth New',
      label: 'Office',
      phone: '1234567890',
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
        fullName: 'Jaswanth New',
        label: 'Office',
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
    expect(body.data.label).toBe('Office');
    expect(body.data.fullName).toBe('Jaswanth New');
  });
});
