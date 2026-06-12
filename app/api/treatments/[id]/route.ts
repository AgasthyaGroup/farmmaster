import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Treatment from '@/src/models/Treatment';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, notFoundResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid treatment id', 400);
      }

      await dbConnect();
      const record = await Treatment.findById(id);
      if (!record || record.isDeleted) {
        return notFoundResponse('Treatment not found');
      }
      return successResponse(record, 'Treatment fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid treatment id', 400);
      }

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
      const record = await Treatment.findByIdAndUpdate(
        id,
        { symptoms, diagnosis, treatment: treatmentVal },
        { new: true, runValidators: true }
      );
      if (!record || record.isDeleted) {
        return notFoundResponse('Treatment not found');
      }
      return successResponse(record, 'Treatment updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'HEALTH'], async () => {
    try {
      const { id } = await params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse('Invalid treatment id', 400);
      }

      await dbConnect();
      const record = await Treatment.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return notFoundResponse('Treatment not found');
      }
      return successResponse(null, 'Treatment deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
