import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '@/src/utils/responses';

async function getCustomerFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  
  await dbConnect();
  const customer = await Customer.findById(payload.userId);
  if (!customer || customer.isDeleted === true || customer.status === false) {
    return null;
  }
  
  return customer;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = await params;
    const address = await Address.findOne({ _id: id, isDeleted: false });
    if (!address) {
      return errorResponse('Address not found', 404);
    }

    return NextResponse.json({
      success: true,
      message: 'Address retrieved successfully',
      data: address,
      address: address,
    });
  } catch (error: any) {
    console.error('[GET /api/customer-app/addresses/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const addressLine1 = body?.addressLine1 ? String(body.addressLine1).trim() : (body?.address1 ? String(body.address1).trim() : '');
    const addressLine2 = body?.addressLine2 ? String(body.addressLine2).trim() : (body?.address2 ? String(body.address2).trim() : '');
    const city = body?.city ? String(body.city).trim() : '';
    const state = body?.state ? String(body.state).trim() : '';
    const pincode = body?.pincode ? String(body.pincode).trim() : '';
    const label = body?.label ? String(body.label).trim() : 'Home';
    const fullName = body?.fullName ? String(body.fullName).trim() : customer.name || 'Customer';
    const phone = body?.phone ? String(body.phone).trim() : customer.phone;
    const isDefault = !!body?.isDefault;

    if (isDefault) {
      await Address.updateMany(
        { customerId: customer._id },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        fullName,
        label,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        isDefault,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress,
      address: updatedAddress,
    });
  } catch (error: any) {
    console.error('[PUT /api/customer-app/addresses/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = await params;
    await Address.findByIdAndUpdate(id, { isDeleted: true });

    return successResponse(null, 'Address deleted successfully');
  } catch (error: any) {
    console.error('[DELETE /api/customer-app/addresses/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = await params;

    await Address.updateMany(
      { customerId: customer._id },
      { isDefault: false }
    );

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      { isDefault: true },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Address set as default successfully',
      data: updatedAddress,
      address: updatedAddress,
    });
  } catch (error: any) {
    console.error('[PATCH /api/customer-app/addresses/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
