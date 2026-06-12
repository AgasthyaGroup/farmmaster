import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Treatment from '@/src/models/Treatment';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      await dbConnect();
      const records = await Treatment.find({ isDeleted: false }).sort({ createdAt: -1 });
      return successResponse(records, 'Treatments fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message || 'Failed to fetch treatments', 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async (user) => {
    try {
      let body: Record<string, any>;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Request body is not valid JSON', 400);
      }

      const symptoms = body.symptoms?.trim();
      const diagnosis = body.diagnosis?.trim() || '';
      const treatmentVal = body.treatment?.trim();

      if (!symptoms) {
        return errorResponse('Symptoms are required', 400);
      }
      if (!treatmentVal) {
        return errorResponse('Treatment (Medicines) is required', 400);
      }

      await dbConnect();

      // Resolve farmId fallback from user session if not present
      let farmId = body.farmId;
      if (!farmId && user.farmId) {
        farmId = user.farmId.toString();
      }

      const record = await Treatment.create({
        symptoms,
        diagnosis,
        treatment: treatmentVal,
        farmId,
      });

      return createdResponse(record, 'Treatment created successfully');
    } catch (error: any) {
      return errorResponse(error.message || 'Failed to create treatment', 500);
    }
  });
}
