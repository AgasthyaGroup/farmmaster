import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import LiveStock from '@/src/models/LiveStock';
import Cattle from '@/src/models/Cattle';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN'], async () => {
    try {
      await dbConnect();

      // Fetch all active, non-deleted cattle records
      const legacyCattle = await Cattle.find({ isDeleted: false }).lean();
      
      let migratedCount = 0;
      let skippedCount = 0;
      const details: string[] = [];

      for (const cattle of legacyCattle) {
        const canonicalTag = String(cattle.tag || '').trim().toUpperCase();
        if (!canonicalTag) {
          skippedCount++;
          continue;
        }

        // Check if this tag already exists in the unified LiveStock registry
        const existingLive = await LiveStock.findOne({ tag_id: canonicalTag });
        if (existingLive) {
          skippedCount++;
          continue;
        }

        // Prepare mapped fields for the new unified LiveStock entry
        const payload = {
          _id: cattle._id, // Retain identical ObjectId to keep relations intact
          tag_id: canonicalTag,
          animalType: String(cattle.cattleType || 'COW').trim().toUpperCase(),
          breed: cattle.breed || '',
          age: cattle.age || '',
          shedId: cattle.shed || null,
          farmId: cattle.farmId || null,
          status: 'ACTIVE',
          name: cattle.name || '',
          code: cattle.code || `CTL-MIG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          date: cattle.date || null,
          gender: cattle.gender || '',
          dateOfBirth: cattle.dateOfBirth || null,
          dameId: cattle.dameId || '',
          dameBreed: cattle.dameBreed || '',
          sireId: cattle.sireId || '',
          sireBreed: cattle.sireBreed || '',
          calvings: cattle.calvings || 0,
          farmBorn: cattle.farmBorn || 'No',
          color: cattle.color || '',
          production: cattle.production || 0,
          milkCollection: cattle.milkCollection || 0,
          weight: cattle.weight || 0,
          purchaseDate: cattle.purchaseDate || null,
          purchasePrice: cattle.purchasePrice || 0,
          purchaseFrom: cattle.purchaseFrom || '',
          purchaseBy: cattle.purchaseBy || '',
          purchaseRemarks: cattle.purchaseRemarks || '',
          remarks: cattle.remarks || '',
          isDeleted: false,
          createdAt: cattle.createdAt || new Date(),
          updatedAt: cattle.updatedAt || new Date()
        };

        await LiveStock.create(payload);
        details.push(`Migrated tag: ${canonicalTag}`);
        migratedCount++;
      }

      return successResponse({
        migratedCount,
        skippedCount,
        details
      }, `Production database migration completed successfully.`);
    } catch (error: any) {
      console.error('[POST /api/admin/migrate] Migration error:', error);
      return errorResponse(error.message || 'Failed to execute production migration.', 500);
    }
  });
}
