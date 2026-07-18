import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'access-token'),
  generateRefreshToken: vi.fn(() => 'refresh-token'),
}));

import Customer from '@/app/api/customer-app/models/Customer';
import { POST } from '@/app/api/customer-app/auth/register/route';

describe('POST /api/customer-app/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers user successfully when fields are flat in request body', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);
    vi.mocked(Customer.create).mockResolvedValue({
      _id: 'cust-flat-123',
      phone: '9999922222',
      name: 'Tester Flat',
      email: 'testing@gmail.com',
    });

    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Tester Flat',
        email: 'testing@gmail.com',
        phone: '9999922222',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.name).toBe('Tester Flat');
  });

  it('registers user successfully when fields are nested under registerUser in request body', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);
    vi.mocked(Customer.create).mockResolvedValue({
      _id: 'cust-nested-123',
      phone: '9999922222',
      name: 'Tester Nested',
      email: 'testing@gmail.com',
    });

    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        registerUser: {
          name: 'Tester Nested',
          email: 'testing@gmail.com',
          phone: '9999922222',
          address1: 'One West',
          address2: 'Nanakramguda',
          city: 'hyd',
          state: 'Telangana',
          pincode: '500032',
        },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.name).toBe('Tester Nested');
    expect(Customer.create).toHaveBeenCalledWith({
      phone: '9999922222',
      name: 'Tester Nested',
      email: 'testing@gmail.com',
      address1: 'One West',
      address2: 'Nanakramguda',
      city: 'hyd',
      state: 'Telangana',
      pincode: '500032',
      status: true,
      isDeleted: false,
    });
  });
});
