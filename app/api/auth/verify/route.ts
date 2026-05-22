import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/src/utils/authGuard';

export async function GET(req: NextRequest) {
  // Verify token and ensure the user has one of the valid roles
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async (user) => {
    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid',
      user 
    });
  });
}
