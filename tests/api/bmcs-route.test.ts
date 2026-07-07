import { describe, expect, it, vi, beforeEach } from 'vitest';

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

vi.mock('@/src/models/BMC', () => ({
  default: {
    find: mockFind,
    create: mockCreate,
    findOne: mockFindOne,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}));

import { GET, POST } from '@/app/api/bmcs/route';

describe('BMCs API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/bmcs', () => {
    it('successfully retrieves BMCs', async () => {
      const mockBmcs = [
        { _id: 'b1', name: 'Cooler A', code: 'C1', capacity: 5000, currentVolume: 0, status: 'ACTIVE', isDeleted: false }
      ];
      
      mockFind.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockBmcs)
        })
      });

      const req = new Request('http://localhost/api/bmcs', { method: 'GET' });
      const response = await GET(req as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockBmcs);
    });
  });

  describe('POST /api/bmcs', () => {
    it('successfully defines a BMC', async () => {
      const mockBmc = {
        _id: 'b2',
        farmId: '60c72b2f9b1d8e1f88c8d8a1',
        name: 'Cooler B',
        code: 'C2',
        capacity: 10000,
        location: 'Shed 2',
        description: 'New Cooler',
        currentVolume: 0,
        status: 'ACTIVE'
      };

      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockBmc);

      const req = new Request('http://localhost/api/bmcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: '60c72b2f9b1d8e1f88c8d8a1',
          name: 'Cooler B',
          code: 'C2',
          capacity: 10000,
          location: 'Shed 2',
          description: 'New Cooler'
        }),
      });

      const response = await POST(req as any);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(mockBmc);
    });

    it('returns 400 for invalid body payload', async () => {
      const req = new Request('http://localhost/api/bmcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Empty name triggers validation failure
          code: 'C2',
          capacity: -100, // Negative capacity triggers validation failure
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
