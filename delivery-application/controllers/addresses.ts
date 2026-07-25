import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import DeliveryExecutive from '../models/DeliveryExecutive';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse, unauthorizedResponse } from '@/src/utils/responses';

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyAccessToken(token);
}

async function getProfileFromUser(user: any) {
  if (user.role === 'DELIVERY_EXECUTIVE') {
    return DeliveryExecutive.findById(user.userId);
  } else {
    return Customer.findById(user.userId);
  }
}

export async function getAddresses(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();
    const profile = await getProfileFromUser(user);
    if (!profile) {
      return unauthorizedResponse('Profile not found');
    }

    const userIdStr = profile._id.toString();
    const phone = profile.phone ? String(profile.phone).trim() : '';

    const queryConditions: any[] = [
      { customerId: userIdStr },
      { customerId: profile._id }
    ];

    if (phone.length > 0) {
      queryConditions.push({ phone });
    }

    let addressList = await Address.find({
      $or: queryConditions,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    const finalAddresses: any[] = [];

    for (const addr of addressList) {
      const obj: any = addr.toObject ? addr.toObject() : addr;
      finalAddresses.push({
        _id: obj._id ? obj._id.toString() : obj.id,
        label: obj.label || 'Home',
        fullName: obj.fullName || profile.name || 'User',
        phone: obj.phone || profile.phone || '',
        addressLine1: obj.addressLine1 || obj.address1 || '',
        addressLine2: obj.addressLine2 || obj.address2 || '',
        city: obj.city || '',
        state: obj.state || '',
        pincode: obj.pincode || '',
        isDefault: !!obj.isDefault,
      });
    }

    // Include direct address from profile if no matching address in collection (for customers/executives with flat fields)
    if ((profile as any).address1 || (profile as any).city || (profile as any).pincode) {
      const directAddr = {
        _id: profile._id.toString(),
        label: 'Home',
        fullName: profile.name || 'User',
        phone: profile.phone || '',
        addressLine1: (profile as any).address1 || '',
        addressLine2: (profile as any).address2 || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        pincode: (profile as any).pincode || '',
        isDefault: true,
      };

      const exists = finalAddresses.some((a: any) => 
        (a.addressLine1 || '').trim().toLowerCase() === ((profile as any).address1 || '').trim().toLowerCase() &&
        (a.city || '').trim().toLowerCase() === ((profile as any).city || '').trim().toLowerCase() &&
        (a.pincode || '').trim() === ((profile as any).pincode || '').trim()
      );

      if (!exists) {
        finalAddresses.unshift(directAddr);
      }
    }

    if (finalAddresses.length > 0) {
      const hasDefault = finalAddresses.some((a: any) => a.isDefault === true);
      if (!hasDefault) {
        finalAddresses[0].isDefault = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: finalAddresses,
      addresses: finalAddresses,
    });
  } catch (error: any) {
    console.error('[Delivery Get Addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function createAddress(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();
    const profile = await getProfileFromUser(user);
    if (!profile) {
      return unauthorizedResponse('Profile not found');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const fullName = body?.fullName ? String(body.fullName).trim() : profile.name || 'User';
    const label = body?.label ? String(body.label).trim() : 'Home';
    const phoneVal = body?.phone !== undefined ? body.phone : body?.mobile;
    const phone = phoneVal !== undefined ? String(phoneVal).trim() : profile.phone;
    const addressLine1 = body?.addressLine1 ? String(body.addressLine1).trim() : (body?.address1 ? String(body.address1).trim() : '');
    const addressLine2 = body?.addressLine2 ? String(body.addressLine2).trim() : (body?.address2 ? String(body.address2).trim() : '');
    const city = body?.city ? String(body.city).trim() : '';
    const state = body?.state ? String(body.state).trim() : '';
    const pincode = body?.pincode ? String(body.pincode).trim() : '';
    const isDefault = body?.isDefault !== undefined ? !!body.isDefault : true;

    if (!addressLine1 || !city || !pincode) {
      return errorResponse('Missing required address fields (addressLine1, city, pincode)', 400);
    }

    if (isDefault) {
      await Address.updateMany(
        { 
          $or: [
            { customerId: profile._id },
            { customerId: profile._id.toString() },
            { phone: profile.phone }
          ]
        },
        { isDefault: false }
      );
    }

    const address = await Address.create({
      customerId: profile._id,
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

    // Sync profile model fields if they exist
    if ('address1' in profile) {
      profile.address1 = addressLine1;
      profile.address2 = addressLine2;
      profile.city = city;
      profile.state = state;
      profile.pincode = pincode;
      await profile.save();
    }

    return createdResponse(address, 'Address created successfully');
  } catch (error: any) {
    console.error('[Delivery Create Address] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function getAddressById(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = params;
    const address = await Address.findOne({ _id: id, isDeleted: false });
    if (!address) {
      return errorResponse('Address not found', 404);
    }

    return NextResponse.json({
      success: true,
      message: 'Address retrieved successfully',
      data: address,
      address,
    });
  } catch (error: any) {
    console.error('[Delivery Get Address By Id] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function updateAddress(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();
    const profile = await getProfileFromUser(user);
    if (!profile) {
      return unauthorizedResponse('Profile not found');
    }

    const { id } = params;
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
    const fullName = body?.fullName ? String(body.fullName).trim() : profile.name || 'User';
    const phone = body?.phone ? String(body.phone).trim() : profile.phone;
    const isDefault = !!body?.isDefault;

    if (isDefault) {
      await Address.updateMany(
        { customerId: profile._id },
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
    console.error('[Delivery Update Address] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function deleteAddress(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id } = params;
    await Address.findByIdAndUpdate(id, { isDeleted: true });

    return successResponse(null, 'Address deleted successfully');
  } catch (error: any) {
    console.error('[Delivery Delete Address] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function setDefaultAddress(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return unauthorizedResponse('Invalid or expired token');
    }

    await dbConnect();
    const profile = await getProfileFromUser(user);
    if (!profile) {
      return unauthorizedResponse('Profile not found');
    }

    const { id } = params;

    await Address.updateMany(
      { customerId: profile._id },
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
    console.error('[Delivery Set Default Address] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
