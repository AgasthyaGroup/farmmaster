import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const addressList = await Address.find({
      $or: [
        { customerId: customer._id },
        { customerId: customer._id.toString() }
      ],
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    let finalAddresses: any[] = [...addressList];

    // 1. Check if customer document has embedded addresses array
    if ((customer as any).addresses && Array.isArray((customer as any).addresses) && (customer as any).addresses.length > 0) {
      for (const embeddedAddr of (customer as any).addresses) {
        if (!finalAddresses.some((a: any) => a._id?.toString() === embeddedAddr._id?.toString())) {
          finalAddresses.push(embeddedAddr);
        }
      }
    }

    // 2. Check if customer has direct address fields on customer model (address1, address2, city, state, pincode)
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
        (a.addressLine1 || a.address1 || '').trim().toLowerCase() === (customer.address1 || '').trim().toLowerCase() &&
        (a.city || '').trim().toLowerCase() === (customer.city || '').trim().toLowerCase() &&
        (a.pincode || '').trim() === (customer.pincode || '').trim()
      );

      if (!exists) {
        finalAddresses.unshift(directAddr);
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

    // Sync direct customer address fields as well
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
