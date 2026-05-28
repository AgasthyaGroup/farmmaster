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
    const user = await User.findById(payload.userId).select('status role').lean();
    if (!user || user.status === false) {
      return null;
    }
    
    // Refresh permissions on every request for immediate revocation/granting
    const roleDoc = await Role.findOne({ name: String(user.role).toUpperCase() }).lean();
    let permissions = roleDoc?.permissions || [];
    
    // Failsafe for Super Admin
    if (permissions.length === 0 && user.role === 'SUPER_ADMIN') {
      permissions = ['ALL'];
    }
    
    payload.permissions = permissions;
  } catch (error) {
    console.error("Auth DB Check Error:", error);
    return null;
  }

  return payload;
}

export function authorize(user: TokenPayload, allowedRolesOrPermissions: string[]) {
  // Always grant access to roles that have the 'ALL' permission
  if (user.permissions?.includes('ALL')) {
    return true;
  }

  // Check if user's role OR any of their permissions match the required list
  return allowedRolesOrPermissions.some(req => 
    user.role === req || user.permissions?.includes(req)
  );
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

  if (!authorize(user, allowedRolesOrPermissions)) {
    return forbiddenResponse('You do not have permission for this action');
  }

  return handler(user);
}
