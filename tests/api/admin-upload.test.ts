import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
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

import { POST as uploadFile } from '@/app/api/admin/upload/route';

describe('Admin File Upload API tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/admin/upload uploads file successfully', async () => {
    const formData = new FormData();
    const file = new File(['dummy content'], 'milk.png', { type: 'image/png' });
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token' },
      body: formData,
    });

    const response = await uploadFile(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toContain('/uploads/');
  });

  it('POST /api/admin/upload returns 400 when file is missing', async () => {
    const formData = new FormData();

    const req = new NextRequest('http://localhost/api/admin/upload', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer admin-token' },
      body: formData,
    });

    const response = await uploadFile(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('No file uploaded');
  });
});
