import { describe, expect, it, vi } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/User', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'access-token'),
  generateRefreshToken: vi.fn(() => 'refresh-token'),
}));

import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  it('returns 400 for invalid email', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email', password: 'password123' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBeTruthy();
  });
});
