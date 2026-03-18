import { NextRequest } from 'next/server';
import { verifyAccessToken, TokenPayload } from '@/src/utils/jwt';
import { unauthorizedResponse, forbiddenResponse } from '@/src/utils/responses';

export async function authenticate(req: NextRequest): Promise<TokenPayload | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return verifyAccessToken(token);
}

export function authorize(user: TokenPayload, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    return false;
  }
  return true;
}

// Higher-order helper to wrap handlers
export async function withAuth(
  req: NextRequest,
  allowedRoles: ('SUPER_ADMIN' | 'FARM_ADMIN' | 'INCHARGE')[],
  handler: (user: TokenPayload) => Promise<Response>
) {
  const user = await authenticate(req);
  if (!user) {
    return unauthorizedResponse('Invalid or expired token');
  }

  if (!authorize(user, allowedRoles)) {
    return forbiddenResponse('You do not have permission for this action');
  }

  return handler(user);
}
