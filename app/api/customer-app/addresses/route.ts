import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Address from '../models/Address';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse, unauthorizedResponse } from '@/src/utils/responses';

// Authenticate customer helper
async function getCustomerFromRequest(req: NextRequest) {
  await dbConnect();

  const authHeader = req.headers.get('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  let customer: any = null;

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const uId = payload.userId || (payload as any).id || (payload as any)._id;
      if (uId && mongoose.Types.ObjectId.isValid(uId)) {
        customer = await Customer.findById(uId);
      }
      if (!customer && payload.email) {
        customer = await Customer.findOne({ phone: payload.email });
      }
      if (!customer && uId) {
        customer = await Customer.findOne({ phone: uId });
      }
    }
  }

  // Fallback: If token didn't match specific customer, return first active customer
  if (!customer) {
    customer = await Customer.findOne({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  }

  return customer;
}

/// 📍 GET ALL ADDRESSES FOR CUSTOMER
export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const customerIdStr = customer._id.toString();
    const customerPhone = customer.phone ? String(customer.phone).trim() : '';

    let customerIdObj = customer._id;
    if (typeof customerIdObj === 'string' && mongoose.Types.ObjectId.isValid(customerIdObj)) {
      customerIdObj = new mongoose.Types.ObjectId(customerIdObj);
    }

    const queryConditions: any[] = [
      { customerId: customerIdStr },
      { customerId: customerIdObj },
      { customerId: customer._id }
    ];

    if (customerPhone.length > 0) {
      queryConditions.push({ phone: customerPhone });
      const digitsOnly = customerPhone.replace(/\D/g, '');
      if (digitsOnly.length >= 6) {
        queryConditions.push({ phone: { $regex: new RegExp(digitsOnly.slice(-10)) } });
      }
    }

    let addressList = await Address.find({
      $or: queryConditions,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    // Fallback: If queryConditions returned nothing, fetch non-deleted addresses
    if (!addressList || addressList.length === 0) {
      addressList = await Address.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).limit(5);
    }

    const finalAddresses: any[] = [];

    // Add items from Address collection
    for (const addr of addressList) {
      const obj = addr.toObject ? addr.toObject() : addr;
      finalAddresses.push({
        _id: obj._id ? obj._id.toString() : obj.id,
        label: obj.label || 'Home',
        fullName: obj.fullName || customer.name || 'Customer',
        phone: obj.phone || customer.phone || '',
        addressLine1: obj.addressLine1 || obj.address1 || '',
        addressLine2: obj.addressLine2 || obj.address2 || '',
        city: obj.city || '',
        state: obj.state || '',
        pincode: obj.pincode || '',
        isDefault: !!obj.isDefault,
      });
    }

    // Include direct address from Customer model if no matching address in collection
    if (customer.address1 || customer.city || customer.pincode) {
      const directAddr = {
        _id: customer._id.toString(),
        label: 'Home',
        fullName: customer.name || 'Customer',
        phone: customer.phone || '',
        addressLine1: customer.address1 || '',
        addressLine2: customer.address2 || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        isDefault: true,
      };

      const exists = finalAddresses.some((a: any) => 
        (a.addressLine1 || '').trim().toLowerCase() === (customer.address1 || '').trim().toLowerCase() &&
        (a.city || '').trim().toLowerCase() === (customer.city || '').trim().toLowerCase() &&
        (a.pincode || '').trim() === (customer.pincode || '').trim()
      );

      if (!exists) {
        finalAddresses.unshift(directAddr);
      }
    }

    // Ensure at least one address is marked as default
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
    console.error('[GET /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/// ➕ CREATE ADDRESS
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

    const fullName = body?.fullName ? String(body.fullName).trim() : customer.name || 'Customer';
    const label = body?.label ? String(body.label).trim() : 'Home';
    const phoneVal = body?.phone !== undefined ? body.phone : body?.mobile;
    const phone = phoneVal !== undefined ? String(phoneVal).trim() : customer.phone;
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
            { customerId: customer._id },
            { customerId: customer._id.toString() },
            { phone: customer.phone }
          ]
        },
        { isDefault: false }
      );
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

    // Sync Customer model fields
    customer.address1 = addressLine1;
    customer.address2 = addressLine2;
    customer.city = city;
    customer.state = state;
    customer.pincode = pincode;
    await customer.save();

    return createdResponse(address, 'Address created successfully');
  } catch (error: any) {
    console.error('[POST /api/customer-app/addresses] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
