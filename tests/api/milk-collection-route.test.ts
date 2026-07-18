import { describe, expect, it, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const { mockFindOneAndUpdate, mockFindOneLiveStock, mockFindOneCattle, mockFindOneShed, mockFindOneCrossingLog } = vi.hoisted(() => ({
  mockFindOneAndUpdate: vi.fn(),
  mockFindOneLiveStock: vi.fn(),
  mockFindOneCattle: vi.fn(),
  mockFindOneShed: vi.fn(),
  mockFindOneCrossingLog: vi.fn(),
}));

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn(async (_req, _roles, handler) =>
    handler({ userId: 'u1', email: 'a@a.com', role: 'SUPER_ADMIN', farmId: 'farm1' })
  ),
}));

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/MilkCollection', () => ({
  default: {
    findOneAndUpdate: mockFindOneAndUpdate,
  },
}));

import { POST } from '@/app/api/milk/collections/bulk/route';

describe('Bulk Milk Collection API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock mongoose.models retrieval
    mongoose.models.LiveStock = {
      findOne: mockFindOneLiveStock,
    } as any;
    mongoose.models.Cattle = {
      findOneAndUpdate: mockFindOneCattle,
    } as any;
    mongoose.models.Shed = {
      findOne: mockFindOneShed,
    } as any;
    mongoose.models.CrossingLog = {
      findOne: mockFindOneCrossingLog,
    } as any;
  });

  it('successfully records bulk milk collection including lineNo and position', async () => {
    const mockAnimal = {
      _id: 'animal1',
      tag_id: '18Y',
      lineNo: 2,
      position: 5,
      shedId: 'Shed 1',
      status: 'ACTIVE',
    };

    mockFindOneLiveStock.mockResolvedValue(mockAnimal);
    mockFindOneCrossingLog.mockReturnValue({
      sort: vi.fn().mockResolvedValue(null)
    } as any);
    mockFindOneAndUpdate.mockResolvedValue({
      tagId: '18Y',
      quantity: 5,
      lineNo: 2,
      position: 5,
    });

    const req = new Request('http://localhost/api/milk/collections/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-07-17',
        session: 'MORNING',
        farmId: 'farm1',
        shedId: 'Shed 1',
        selfConsumption: 0,
        collections: [
          { tagId: '18Y', quantity: 5 }
        ]
      }),
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);

    // Verify findOneAndUpdate was called with correct values including lineNo & position
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        tag_id: '18Y',
        shedId: 'Shed 1',
      }),
      expect.objectContaining({
        lineNo: 2,
        position: 5,
        quantity: 5,
      }),
      expect.any(Object)
    );
  });
});
