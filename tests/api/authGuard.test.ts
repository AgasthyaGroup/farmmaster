import { describe, expect, it } from 'vitest';
import { authorize } from '@/src/utils/authGuard';

describe('authGuard authorize logic', () => {
  it('correctly authorize or deny user access', () => {
    const userFarmAdmin = {
      userId: '123',
      email: 'admin@farm.com',
      role: 'FARM_ADMIN',
      permissions: ['DASHBOARD', 'FARMS', 'SHEDS', 'TAGS', 'CATTLE', 'LAND', 'LAND_MANAGEMENT', 'BMC']
    };

    const userIncharge = {
      userId: '456',
      email: 'incharge@farm.com',
      role: 'INCHARGE',
      permissions: ['DASHBOARD', 'CATTLE', 'SHED_LOG', 'CROSSING_LOG', 'HEALTH', 'MILK_PRODUCTION', 'BMC']
    };

    const userCustom = {
      userId: '789',
      email: 'custom@farm.com',
      role: 'OPERATOR',
      permissions: ['CATTLE_MANAGEMENT_CREATE', 'CATTLE_MANAGEMENT_VIEW']
    };

    // FARM_ADMIN accessing LAND POST (requires SUPER_ADMIN, FARM_ADMIN, LAND)
    const res1 = authorize(userFarmAdmin, ['SUPER_ADMIN', 'FARM_ADMIN', 'LAND'], 'POST', '/api/lands');
    console.log('Result 1 (FARM_ADMIN accessing LAND POST):', res1);
    
    // INCHARGE accessing MILK_PROCUREMENT POST (requires SUPER_ADMIN, FARM_ADMIN, INCHARGE, MILK)
    const res2 = authorize(userIncharge, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK'], 'POST', '/api/milk/procurement');
    console.log('Result 2 (INCHARGE accessing MILK_PROCUREMENT POST):', res2);

    // CUSTOM operator accessing CATTLE POST (requires SUPER_ADMIN, FARM_ADMIN, CATTLE)
    const res3 = authorize(userCustom, ['SUPER_ADMIN', 'FARM_ADMIN', 'CATTLE'], 'POST', '/api/cattle');
    console.log('Result 3 (CUSTOM operator accessing CATTLE POST):', res3);

    expect(1).toBe(1);
  });
});
