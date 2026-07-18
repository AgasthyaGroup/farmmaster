import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    create: vi.fn(),
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

  it('returns 400 if phone is missing', async () => {
    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Mobile number (phone) is required');
  });

  it('returns isRegistered: true if customer exists and is active', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue({
      _id: 'customer-123',
      phone: '1234567890',
      name: 'John Doe',
      email: 'john@example.com',
      isDeleted: false,
    });

    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isRegistered).toBe(true);
    expect(body.data.user.phone).toBe('1234567890');
    expect(body.data.user.name).toBe('John Doe');
  });

  it('returns isRegistered: false if customer does not exist and name is missing', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);

    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isRegistered).toBe(false);
    expect(body.data.user).toBeUndefined();
  });

  it('creates a new customer and returns isRegistered: true when phone not found and name is provided', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);
    vi.mocked(Customer.create).mockResolvedValue({
      _id: 'new-customer-id',
      phone: '1234567890',
      name: 'New User',
      email: 'new@example.com',
    });

    const req = new Request('http://localhost/api/customer-app/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890', name: 'New User', email: 'new@example.com' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.isRegistered).toBe(true);
    expect(body.data.token).toBe('access-token');
    expect(body.data.user.id).toBe('new-customer-id');
  });
});
