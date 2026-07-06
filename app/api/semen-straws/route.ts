import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import SemenStraw from '@/src/models/SemenStraw';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';
import { createSemenStrawSchema } from '@/src/utils/validation';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async (user) => {
    try {
      await dbConnect();
      const query: any = { isDeleted: false };
      if (user.role !== 'SUPER_ADMIN' && user.farmId) {
        query.farmId = user.farmId;
      }
      const straws = await SemenStraw.find(query).populate('farmId').sort({ createdAt: -1 });
      return successResponse(straws, 'Semen straws fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'CROSSING_LOG', 'CROSSING'], async (user) => {
    try {
      const parsedBody = createSemenStrawSchema.safeParse(await req.json());
      if (!parsedBody.success) {
        return errorResponse(parsedBody.error.issues[0]?.message || 'Invalid request body', 400);
      }
      const { 
        batchNo, breed, noOfStraws, usedStraws, purchaseDate, expiryDate, price, farmId, status 
      } = parsedBody.data;

      // Access control for non-super admins
      const targetFarmId = farmId || user.farmId;
      if (user.role !== 'SUPER_ADMIN' && user.farmId && String(targetFarmId) !== String(user.farmId)) {
        return errorResponse('You can only create semen straw records for your own farm', 403);
      }

      await dbConnect();

      // Check if a straw batch already exists (even if deleted)
      const existingStraw = await SemenStraw.findOne({ batchNo });
      
      let straw;
      if (existingStraw) {
        if (!existingStraw.isDeleted) {
          return errorResponse('A semen straw batch with this batch number already exists.', 400);
        }
        // Revive the soft-deleted straw batch
        straw = await SemenStraw.findByIdAndUpdate(
          existingStraw._id,
          { 
            breed, noOfStraws, usedStraws: usedStraws || 0, purchaseDate: purchaseDate || new Date(), 
            expiryDate: expiryDate || null, price: price || 0, farmId: targetFarmId, status: status || 'ACTIVE', isDeleted: false
          },
          { new: true }
        );
      } else {
        straw = await SemenStraw.create({
          batchNo,
          breed,
          noOfStraws,
          usedStraws: usedStraws || 0,
          purchaseDate: purchaseDate || new Date(),
          expiryDate: expiryDate || null,
          price: price || 0,
          farmId: targetFarmId,
          status: status || 'ACTIVE'
        });
      }

      return createdResponse(straw, 'Semen straw batch created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
