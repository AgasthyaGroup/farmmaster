import { describe, expect, it, vi } from 'vitest';

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn(async (_req, _roles, handler) =>
    handler({ userId: 'u1', email: 'a@a.com', role: 'SUPER_ADMIN', farmId: null })
  ),
}));

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/Farm', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import { GET } from '@/app/api/farms/[id]/route';

describe('GET /api/farms/[id]', () => {
  it('returns 400 for invalid object id', async () => {
    const req = new Request('http://localhost/api/farms/not-an-id', {
      method: 'GET',
    });

    const response = await GET(req as any, { params: Promise.resolve({ id: 'not-an-id' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid farm id');
  });
});
