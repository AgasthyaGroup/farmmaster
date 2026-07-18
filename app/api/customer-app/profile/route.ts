import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '@/src/utils/responses';

async function getCustomerFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== 'CUSTOMER') {
    return null;
  }
  
  await dbConnect();
  const customer = await Customer.findOne({ _id: payload.userId, isDeleted: false });
  if (!customer || customer.status === false) {
    return null;
  }
  
  return customer;
}

export async function PUT(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = String(body.name).trim();
    if (body.email !== undefined) updateData.email = String(body.email).trim();

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer._id,
      { $set: updateData },
      { new: true }
    );

    return successResponse(updatedCustomer, 'Profile updated successfully');
  } catch (error: any) {
    console.error('[PUT /api/customer-app/profile] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
