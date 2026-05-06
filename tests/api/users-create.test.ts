import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn(async (_req, _roles, handler) =>
    handler({ userId: 'u1', email: 'a@a.com', role: 'SUPER_ADMIN', farmId: null })
  ),
}));

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/User', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => 'hashed-pass'),
  },
}));

import User from '@/src/models/User';
import { POST } from '@/app/api/users/route';

describe('POST /api/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when FARM_ADMIN is sent without farmId', async () => {
    const req = new Request('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Farm Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'FARM_ADMIN',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('farmId');
    expect((User as any).create).not.toHaveBeenCalled();
  });
});
