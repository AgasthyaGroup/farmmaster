import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import DeliveryExecutive from '../models/DeliveryExecutive';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '@/src/utils/responses';

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyAccessToken(token);
}

export async function getProfile(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();

    let profile;
    if (user.role === 'DELIVERY_EXECUTIVE') {
      profile = await DeliveryExecutive.findById(user.userId).select('-password');
    } else {
      profile = await Customer.findById(user.userId);
    }

    if (!profile) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse(profile, 'Profile fetched successfully');
  } catch (error: any) {
    console.error('[Delivery Get Profile] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function updateProfile(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    await dbConnect();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.email !== undefined) updateData.email = String(body.email).trim();

    let updatedProfile;
    if (user.role === 'DELIVERY_EXECUTIVE') {
      updatedProfile = await DeliveryExecutive.findByIdAndUpdate(
        user.userId,
        { $set: updateData },
        { new: true }
      );
    } else {
      updatedProfile = await Customer.findByIdAndUpdate(
        user.userId,
        { $set: updateData },
        { new: true }
      );
    }

    if (!updatedProfile) {
      return errorResponse('Profile not found', 404);
    }

    return successResponse(updatedProfile, 'Profile updated successfully');
  } catch (error: any) {
    console.error('[Delivery Update Profile] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
