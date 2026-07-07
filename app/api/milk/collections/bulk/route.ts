import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import MilkCollection from '@/src/models/MilkCollection';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE', 'MILK_PRODUCTION', 'MILK'], async () => {
    try {
      const body = await req.json();
      const { date, session, farmId, shedId, selfConsumption, collections } = body;

      if (!collections || !Array.isArray(collections)) {
        return errorResponse('Collections array is required', 400);
      }

      await dbConnect();

      const LiveStock = mongoose.models.LiveStock || mongoose.model('LiveStock');
      const Cattle = mongoose.models.Cattle || mongoose.model('Cattle');
      const Shed = mongoose.models.Shed || mongoose.model('Shed');
      const savedRecords = [];

      // Parse and normalize date to start of day in UTC/local to ensure consistent grouping
      const baseDate = new Date(date);
      baseDate.setUTCHours(0, 0, 0, 0);

      for (const item of collections) {
        const { tagId, quantity } = item;
        const cleanTag = String(tagId).trim().toUpperCase();

        const animalExists = await LiveStock.findOne({ tag_id: cleanTag, isDeleted: false });
        if (!animalExists) {
          console.warn(`Tag ID ${cleanTag} not found in active livestock registry. Skipping.`);
          continue;
        }

        // Resolve active shed ID: if saving the virtual pregnant workspace, keep individual physical shed code
        const activeShedId = shedId === 'PREGNANT_WORKFLOW' ? animalExists.shedId : shedId;

        // Upsert entry for this animal, date, session
        const filter = {
          tag_id: cleanTag,
          date: baseDate,
          session,
          shedId: activeShedId || '-',
          farmId,
        };

        const update = {
          tagId: cleanTag,
          quantity: Number(quantity) || 0,
          selfConsumption: Number(selfConsumption) || 0,
          dayTotal: Number(quantity) || 0,
          isDeleted: false,
        };

        const doc = await MilkCollection.findOneAndUpdate(filter, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        });
        savedRecords.push(doc);

        // Check if the animal is pregnant and contribution is less than 2 liters
        let isPregnant = animalExists.status === 'PREGNANT';
        if (!isPregnant) {
          const CrossingLog = mongoose.models.CrossingLog || mongoose.model('CrossingLog');
          const latestCrossing = await CrossingLog.findOne({
            $or: [{ tag_id: cleanTag }, { tag: cleanTag }],
            isDeleted: false
          }).sort({ createdAt: -1 });

          if (latestCrossing && latestCrossing.pregnancyStatus === 'Positive' && !latestCrossing.actualCalvingDate) {
            isPregnant = true;
          }
        }

        if (isPregnant && Number(quantity) < 2) {
          let dryShed = await Shed.findOne({
            farmId: farmId,
            $or: [
              { code: 'DRY' },
              { name: /dry/i }
            ],
            isDeleted: false
          });

          if (!dryShed) {
            dryShed = await Shed.create({
              farmId,
              name: 'Dry Shed',
              code: 'DRY',
              lines: 1,
              capacity: 100,
              status: 'ACTIVE',
              lineManagement: 'No',
              milking: 'No',
              remarks: 'Auto-created Dry Shed for dry cows'
            });
          }

          // Move the animal to DRY status and Dry Shed in both unified LiveStock and legacy Cattle records
          await LiveStock.findByIdAndUpdate(animalExists._id, {
            status: 'DRY',
            shedId: dryShed.code
          });

          await Cattle.findOneAndUpdate({ tag: cleanTag }, {
            status: 'DRY',
            shed: dryShed.code
          });
        }
      }

      return successResponse(savedRecords, 'Bulk milk collections recorded successfully');
    } catch (error: any) {
      console.error('[POST /api/milk/collections/bulk] Error:', error);
      return errorResponse(error.message, 500);
    }
  });
}
