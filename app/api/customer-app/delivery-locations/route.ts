import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryLocation from '../models/DeliveryLocation';
import DeliveryRoute from '../models/DeliveryRoute';
import DeliveryExecutive from '../models/DeliveryExecutive';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // 1. Fetch active delivery locations
    const locations = await DeliveryLocation.find({ status: 'active' }).sort({ createdAt: -1 });
    
    // Convert to plan objects
    const locationList = locations.map(loc => loc.toObject ? loc.toObject() : loc);
    const existingPincodes = new Set(locationList.map(loc => String(loc.pincode).trim()));

    // 2. Fetch active delivery routes to find any extra pincodes
    const activeRoutes = await DeliveryRoute.find({ status: 'active' });
    for (const route of activeRoutes) {
      if (route.pincodes && Array.isArray(route.pincodes)) {
        for (const pin of route.pincodes) {
          const cleanPin = String(pin).trim();
          if (cleanPin && !existingPincodes.has(cleanPin)) {
            existingPincodes.add(cleanPin);
            locationList.push({
              _id: `route-pin-${cleanPin}`,
              name: route.routeName || 'Delivery Route',
              pincode: cleanPin,
              city: route.startPoint || 'Local',
              state: 'Active',
              status: 'active',
            });
          }
        }
      }
    }

    // 3. Fetch active delivery executives to find any extra pincodes
    const activeExecs = await DeliveryExecutive.find({ status: 'active' });
    for (const exec of activeExecs) {
      if (exec.pincodes && Array.isArray(exec.pincodes)) {
        for (const pin of exec.pincodes) {
          const cleanPin = String(pin).trim();
          if (cleanPin && !existingPincodes.has(cleanPin)) {
            existingPincodes.add(cleanPin);
            locationList.push({
              _id: `exec-pin-${cleanPin}`,
              name: exec.name || 'Executive Area',
              pincode: cleanPin,
              city: 'Local',
              state: 'Active',
              status: 'active',
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: locationList });
  } catch (error: any) {
    console.error('[GET /api/customer-app/delivery-locations] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
