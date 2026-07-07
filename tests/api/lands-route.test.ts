import { describe, expect, it, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const { mockFind, mockCreate, mockFindOne, mockFindByIdAndUpdate } = vi.hoisted(() => ({
  mockFind: vi.fn(),
  mockCreate: vi.fn(),
  mockFindOne: vi.fn(),
  mockFindByIdAndUpdate: vi.fn(),
}));

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn(async (_req, _roles, handler) =>
    handler({ userId: 'u1', email: 'a@a.com', role: 'SUPER_ADMIN', farmId: null })
  ),
}));

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/Land', () => ({
  default: {
    find: mockFind,
    create: mockCreate,
    findOne: mockFindOne,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}));

import { GET, POST } from '@/app/api/lands/route';

describe('Lands API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mongoose.models.GrassCollection = {
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    } as any;
  });

  describe('GET /api/lands', () => {
    it('successfully retrieves lands', async () => {
      const mockLands = [
        { _id: 'l1', name: 'Land 1', code: 'L1', totalArea: 10, unit: 'Acres', status: 'AVAILABLE', isDeleted: false }
      ];
      
      mockFind.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockLands)
          })
        })
      });

      const req = new Request('http://localhost/api/lands', { method: 'GET' });
      const response = await GET(req as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual([{ ...mockLands[0], utilizedArea: 0 }]);
    });
  });

  describe('POST /api/lands', () => {
    it('returns 400 for invalid body payload', async () => {
      const req = new Request('http://localhost/api/lands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Empty name triggers validation failure
          code: 'L2',
          totalArea: -5, // Negative area triggers validation failure
        }),
      });

      const response = await POST(req as any);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });
  });
});
