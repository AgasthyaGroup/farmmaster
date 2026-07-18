import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Address from '../models/Address';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse, unauthorizedResponse } from '@/src/utils/responses';

// Helper to authenticate the customer
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

export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const addresses = await Address.find({ customerId: customer._id, isDeleted: false }).sort({ createdAt: -1 });
    return successResponse(addresses, 'Addresses retrieved successfully');
  } catch (error: any) {
    console.error('[GET /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
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

    const fullName = body?.fullName ? String(body.fullName).trim() : '';
    const label = body?.label ? String(body.label).trim() : '';
    const phoneVal = body?.phone !== undefined ? body.phone : body?.mobile;
    const phone = phoneVal !== undefined ? String(phoneVal).trim() : '';
    const addressLine1 = body?.addressLine1 ? String(body.addressLine1).trim() : '';
    const addressLine2 = body?.addressLine2 ? String(body.addressLine2).trim() : '';
    const city = body?.city ? String(body.city).trim() : '';
    const state = body?.state ? String(body.state).trim() : '';
    const pincode = body?.pincode ? String(body.pincode).trim() : '';
    const isDefault = !!body?.isDefault;

    if (!fullName || !label || !phone || !addressLine1 || !city || !state || !pincode) {
      return errorResponse('Missing required address fields', 400);
    }

    // If this is set as default address, reset other default addresses for this customer
    if (isDefault) {
      await Address.updateMany({ customerId: customer._id }, { isDefault: false });
    }

    const address = await Address.create({
      customerId: customer._id,
      fullName,
      label,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault,
      isDeleted: false,
    });

    return createdResponse(address, 'Address created successfully');
  } catch (error: any) {
    console.error('[POST /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { searchParams } = new URL(req.url);
    let addressId = searchParams.get('id');

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    if (!addressId) {
      addressId = body.id;
    }

    if (!addressId) {
      return errorResponse('Address ID is required', 400);
    }

    const fullName = body?.fullName ? String(body.fullName).trim() : '';
    const label = body?.label ? String(body.label).trim() : '';
    const phoneVal = body?.phone !== undefined ? body.phone : body?.mobile;
    const phone = phoneVal !== undefined ? String(phoneVal).trim() : '';
    const addressLine1 = body?.addressLine1 ? String(body.addressLine1).trim() : '';
    const addressLine2 = body?.addressLine2 ? String(body.addressLine2).trim() : '';
    const city = body?.city ? String(body.city).trim() : '';
    const state = body?.state ? String(body.state).trim() : '';
    const pincode = body?.pincode ? String(body.pincode).trim() : '';
    const isDefault = !!body?.isDefault;

    if (!fullName || !label || !phone || !addressLine1 || !city || !state || !pincode) {
      return errorResponse('Missing required address fields', 400);
    }

    const existingAddress = await Address.findOne({ _id: addressId, customerId: customer._id, isDeleted: false });
    if (!existingAddress) {
      return errorResponse('Address not found', 404);
    }

    if (isDefault) {
      await Address.updateMany({ customerId: customer._id }, { isDefault: false });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
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

    return successResponse(updatedAddress, 'Address updated successfully');
  } catch (error: any) {
    console.error('[PUT /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { searchParams } = new URL(req.url);
    let addressId = searchParams.get('id');

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    if (!addressId) {
      addressId = body.id;
    }

    if (!addressId) {
      return errorResponse('Address ID is required', 400);
    }

    const existingAddress = await Address.findOne({ _id: addressId, customerId: customer._id, isDeleted: false });
    if (!existingAddress) {
      return errorResponse('Address not found', 404);
    }

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = String(body.fullName).trim();
    if (body.label !== undefined) updateData.label = String(body.label).trim();
    
    const phoneVal = body.phone !== undefined ? body.phone : body.mobile;
    if (phoneVal !== undefined) updateData.phone = String(phoneVal).trim();
    
    if (body.addressLine1 !== undefined) updateData.addressLine1 = String(body.addressLine1).trim();
    if (body.addressLine2 !== undefined) updateData.addressLine2 = String(body.addressLine2).trim();
    if (body.city !== undefined) updateData.city = String(body.city).trim();
    if (body.state !== undefined) updateData.state = String(body.state).trim();
    if (body.pincode !== undefined) updateData.pincode = String(body.pincode).trim();
    
    if (body.isDefault !== undefined) {
      updateData.isDefault = !!body.isDefault;
      if (updateData.isDefault) {
        await Address.updateMany({ customerId: customer._id }, { isDefault: false });
      }
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: updateData },
      { new: true }
    );

    return successResponse(updatedAddress, 'Address patched successfully');
  } catch (error: any) {
    console.error('[PATCH /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { searchParams } = new URL(req.url);
    let addressId = searchParams.get('id');

    if (!addressId) {
      try {
        const body = await req.json();
        addressId = body?.id;
      } catch {}
    }

    if (!addressId) {
      return errorResponse('Address ID is required', 400);
    }

    const existingAddress = await Address.findOne({ _id: addressId, customerId: customer._id, isDeleted: false });
    if (!existingAddress) {
      return errorResponse('Address not found', 404);
    }

    existingAddress.isDeleted = true;
    await existingAddress.save();

    return successResponse(null, 'Address deleted successfully');
  } catch (error: any) {
    console.error('[DELETE /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
