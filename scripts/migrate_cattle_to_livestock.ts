import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';
import LiveStock from '../src/models/LiveStock';
import Cattle from '../src/models/Cattle';

async function migrate() {
  try {
    console.log("Connecting to Database...");
    await dbConnect();
    console.log("Connected successfully.");

    // Fetch all active, non-deleted cattle records
    const legacyCattle = await Cattle.find({ isDeleted: false }).lean();
    console.log(`Found ${legacyCattle.length} legacy Cattle records in database.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const cattle of legacyCattle) {
      const canonicalTag = String(cattle.tag || '').trim().toUpperCase();
      if (!canonicalTag) {
        console.log(`Skipping cattle with invalid tag, ID: ${cattle._id}`);
        skippedCount++;
        continue;
      }

      // Check if this tag already exists in the unified LiveStock registry
      const existingLive = await LiveStock.findOne({ tag_id: canonicalTag });
      if (existingLive) {
        console.log(`Skipping tag [${canonicalTag}] — already exists in unified LiveStock.`);
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
        status: String(cattle.status || 'ACTIVE').trim().toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'ACTIVE',
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
      console.log(`✅ Successfully migrated tag [${canonicalTag}] to LiveStock.`);
      migratedCount++;
    }

    console.log("\n======================================");
    console.log("🎉 MIGRATION COMPLETED");
    console.log(`✅ Mapped & Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount}`);
    console.log("======================================");

  } catch (error) {
    console.error("Migration failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("DB Connection closed.");
  }
}

migrate();
