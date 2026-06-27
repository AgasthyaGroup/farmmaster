import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { verifyAccessToken, TokenPayload } from '@/src/utils/jwt';
import { unauthorizedResponse, forbiddenResponse } from '@/src/utils/responses';

import dbConnect from '@/src/database/dbConnection';
import User from '@/src/models/User';
import Role from '@/src/models/Role';

export async function authenticate(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  
  if (!payload) return null;

  // Ensure user exists and is still active in the database
  try {
    await dbConnect();
    const user = await User.findById(payload.userId).select('status role farmId').lean();
    if (!user || user.status === false) {
      return null;
    }
    
    // Refresh permissions and farmId on every request for immediate revocation/granting
    const roleDoc = await Role.findOne({ name: String(user.role).toUpperCase() }).lean();
    let permissions = roleDoc?.permissions || [];
    
    // Failsafe for Super Admin
    if (permissions.length === 0 && user.role === 'SUPER_ADMIN') {
      permissions = ['ALL'];
    }
    
    payload.permissions = permissions;
    payload.farmId = user.farmId ? user.farmId.toString() : null;
  } catch (error) {
    console.error("Auth DB Check Error:", error);
    return null;
  }

  return payload;
}

const BASE_TOKEN_MAP: Record<string, string[]> = {
  CATTLE: ['CATTLE_MANAGEMENT', 'TAG_MANAGEMENT', 'BREED_MANAGEMENT', 'ANIMAL_MANAGEMENT', 'LIVESTOCK'],
  HEALTH: ['HEALTH_MANAGEMENT', 'HEALTH'],
  INVENTORY: ['FEED_ITEMS', 'INVENTORY'],
  MILK: ['MILK'],
  MILK_PRODUCTION: ['MILK'],
  USERS: ['USER_MANAGEMENT'],
  DEPARTMENTS: ['DEPARTMENT'],
  FARMS: ['FARM_MANAGEMENT'],
  SHEDS: ['SHED_MANAGEMENT'],
  SHED_LOG: ['SHED_LOG'],
  CROSSING_LOG: ['CROSSING_LOG'],
  PURCHASE_LOG: ['PURCHASE_LOG'],
  SALE_LOG: ['SALE_LOG'],
  GRASS: ['GRASS', 'GRASS_COLLECTION'],
  FEEDING: ['FEEDING'],
};

export function authorize(user: TokenPayload, allowedRolesOrPermissions: string[], method: string = 'GET', pathname?: string) {
  // Always grant access to roles that have the 'ALL' permission
  if (user.permissions?.includes('ALL')) {
    return true;
  }

  // Allow read-only (GET) requests for essential lookup tables to all authenticated users
  if (method.toUpperCase() === 'GET' && pathname) {
    const isLookupPath = 
      pathname.startsWith('/api/farms') || 
      pathname.startsWith('/api/sheds') || 
      pathname.startsWith('/api/cattle') || 
      pathname.startsWith('/api/breeds') || 
      pathname.startsWith('/api/feed-items') || 
      pathname.startsWith('/api/medicines');
    if (isLookupPath) {
      return true;
    }
  }

  // Determine required action suffix based on request method
  let suffix = 'VIEW';
  const upperMethod = method.toUpperCase();
  if (upperMethod === 'POST') {
    suffix = 'CREATE';
  } else if (upperMethod === 'PUT' || upperMethod === 'PATCH') {
    suffix = 'EDIT';
  } else if (upperMethod === 'DELETE') {
    suffix = 'DELETE';
  }

  // Check if user's role OR any of their permissions match the required list
  return allowedRolesOrPermissions.some(req => {
    // 1. Direct match (e.g. user.role === req or user.permissions has req)
    // We strictly ignore role name match for FARM_ADMIN and INCHARGE to enforce their customized permissions!
    if (user.role === req && req.toUpperCase() !== 'FARM_ADMIN' && req.toUpperCase() !== 'INCHARGE') {
      return true;
    }

    if (user.permissions?.includes(req)) {
      return true;
    }

    // 2. Granular sub-module match
    // If the required permission is a baseToken (like CATTLE), and the user has any of its sub-module permissions (like LIVESTOCK_VIEW)
    const reqUpper = req.toUpperCase();
    let subPrefixes = BASE_TOKEN_MAP[reqUpper];
    if (!subPrefixes) {
      subPrefixes = [reqUpper];
    }

    return subPrefixes.some(prefix => 
      user.permissions?.some(p => {
        const upperP = String(p).trim().toUpperCase();
        const requiredActionToken = `${prefix}_${suffix}`;
        return upperP === requiredActionToken || upperP === prefix || upperP.startsWith(prefix + '_');
      })
    );
  });
}

// Higher-order helper to wrap handlers
export async function withAuth(
  req: NextRequest,
  allowedRolesOrPermissions: string[],
  handler: (user: TokenPayload) => Promise<Response>
) {
  const user = await authenticate(req);
  if (!user) {
    return unauthorizedResponse('Invalid or expired token');
  }

  const { pathname } = req.nextUrl;
  if (!authorize(user, allowedRolesOrPermissions, req.method, pathname)) {
    return forbiddenResponse('You do not have permission for this action');
  }

  return handler(user);
}
