import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import DeliveryLocation from '../models/DeliveryLocation';
import { errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // Return only active deliverable locations for the client app validation
    const locations = await DeliveryLocation.find({ status: 'active' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: locations });
  } catch (error: any) {
    console.error('[GET /api/customer-app/delivery-locations] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
