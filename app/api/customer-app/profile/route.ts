import { NextRequest } from 'next/server';
import { getProfile, updateProfile } from '@/delivery-application/controllers/profile';

export async function GET(req: NextRequest) {
  return getProfile(req);
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}