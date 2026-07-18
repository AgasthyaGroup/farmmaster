import { describe, expect, it, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

const { mockFindLiveStock, mockFindShedLog, mockFindFarm, mockFindCrossingLog, mockFindMilkCollection } = vi.hoisted(() => ({
  mockFindLiveStock: vi.fn(),
  mockFindShedLog: vi.fn(),
  mockFindFarm: vi.fn(),
  mockFindCrossingLog: vi.fn(),
  mockFindMilkCollection: vi.fn(),
}));

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn(async (_req, _roles, handler) =>
    handler({ userId: 'u1', email: 'a@a.com', role: 'SUPER_ADMIN', farmId: 'farm1' })
  ),
}));

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/models/LiveStock', () => ({
  default: {
    find: mockFindLiveStock,
  },
}));

vi.mock('@/src/models/Farm', () => ({
  default: {
    find: mockFindFarm,
  },
}));

vi.mock('@/src/models/MilkCollection', () => ({
  default: {
    find: mockFindMilkCollection,
  },
}));

vi.mock('@/src/models/Logs', () => ({
  CrossingLog: {
    find: mockFindCrossingLog,
  },
  ShedLog: {
    find: mockFindShedLog,
  },
}));

import { GET } from '@/app/api/cattle/route';

describe('Cattle API GET Route - Historical Rollback', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFindFarm.mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    });
    mockFindCrossingLog.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    });
    mockFindMilkCollection.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    });
  });

  it('rolls back livestock position and shed based on date query parameter', async () => {
    // Current state: animal '1Y' is currently in Shed 4, line 0, position 0
    const mockLiveStock = [
      {
        toObject: () => ({
          tag_id: '1Y',
          tag: '1Y',
          shedId: 'Shed 4',
          shed: 'Shed 4',
          lineNo: 0,
          position: 0,
          createdAt: new Date('2026-07-01'),
        }),
      },
    ];

    mockFindLiveStock.mockReturnValue({
      sort: vi.fn().mockResolvedValue(mockLiveStock),
    });

    // ShedLog: '1Y' was shifted from 'Shed 1', line 1, position 1 to 'Shed 4', line 0, position 0 on 2026-07-06
    const mockShedLogs = [
      {
        tag_id: '1Y',
        shiftingDate: new Date('2026-07-06T10:00:00.000Z'),
        oldShed: 'Shed 1',
        newShed: 'Shed 4',
        oldLineNo: 1,
        newLineNo: 0,
        oldPosition: 1,
        newPosition: 0,
      },
    ];

    mockFindShedLog.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockShedLogs),
      }),
    });

    // Query for 2026-07-05 (before the shift occurred on the 6th)
    const req = new Request('http://localhost/api/cattle?date=2026-07-05', {
      method: 'GET',
    });

    const response = await GET(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    
    // The animal should be rolled back to Shed 1, line 1, position 1
    const rolledBackAnimal = body.data[0];
    expect(rolledBackAnimal.tag).toBe('1Y');
    expect(rolledBackAnimal.shedId).toBe('Shed 1');
    expect(rolledBackAnimal.shed).toBe('Shed 1');
    expect(rolledBackAnimal.lineNo).toBe(1);
    expect(rolledBackAnimal.position).toBe(1);
  });
});
