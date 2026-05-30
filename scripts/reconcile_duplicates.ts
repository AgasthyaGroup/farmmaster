import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';
import LiveStock from '../src/models/LiveStock';
import Cattle from '../src/models/Cattle';

async function reconcile() {
  try {
    console.log("Connecting to Database...");
    await dbConnect();
    console.log("Connected successfully.");

    console.log("\n--- Scanning for duplicate/orphaned tags in Cattle ---");
    const allCattle = await Cattle.find({});
    
    // Group Cattle by Tag
    const cattleGroups: Record<string, any[]> = {};
    allCattle.forEach(c => {
      const tag = String(c.tag || '').trim().toUpperCase();
      if (tag) {
        if (!cattleGroups[tag]) cattleGroups[tag] = [];
        cattleGroups[tag].push(c);
      }
    });

    for (const [tag, records] of Object.entries(cattleGroups)) {
      if (records.length > 1) {
        console.log(`\nDuplicate tag detected in Cattle collection: [${tag}]`);
        
        // Separate correct (non-null farmId) from legacy/orphaned (null or UNKNOWN_FARM farmId)
        const correctRecord = records.find(r => r.farmId && r.farmId.toString() !== 'UNKNOWN_FARM');
        const incorrectRecords = records.filter(r => r !== correctRecord);

        if (correctRecord) {
          console.log(`  -> Canonical active record identified: _id: ${correctRecord._id}, farmId: ${correctRecord.farmId}, createdAt: ${correctRecord.createdAt}`);
          
          // Delete or mark deleted the orphaned records in Cattle
          for (const inc of incorrectRecords) {
            console.log(`  -> Deleting legacy/orphaned duplicate in Cattle: _id: ${inc._id}, farmId: ${inc.farmId}`);
            await Cattle.deleteOne({ _id: inc._id });
          }

          // Now ensure LiveStock only contains the single canonical active record!
          console.log(`  -> Reconciling in LiveStock collection...`);
          
          // Delete all records with this tag from LiveStock first to clear indices
          const deleteRes = await LiveStock.deleteMany({ tag_id: tag });
          console.log(`  -> Removed ${deleteRes.deletedCount} old/duplicate entries for tag [${tag}] from LiveStock.`);

          // Create the clean canonical entry in LiveStock matching the correct Cattle record
          const payload = {
            _id: correctRecord._id, // Keep the same ObjectId
            tag_id: tag,
            animalType: String(correctRecord.cattleType || 'COW').trim().toUpperCase(),
            breed: correctRecord.breed || '',
            age: correctRecord.age || '',
            shedId: correctRecord.shed || null,
            farmId: correctRecord.farmId,
            status: String(correctRecord.status || 'ACTIVE').trim().toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'ACTIVE',
            name: correctRecord.name || '',
            code: correctRecord.code || `CTL-REC-${Date.now()}`,
            date: correctRecord.date || null,
            gender: correctRecord.gender || '',
            dateOfBirth: correctRecord.dateOfBirth || null,
            dameId: correctRecord.dameId || '',
            dameBreed: correctRecord.dameBreed || '',
            sireId: correctRecord.sireId || '',
            sireBreed: correctRecord.sireBreed || '',
            calvings: correctRecord.calvings || 0,
            farmBorn: correctRecord.farmBorn || 'No',
            color: correctRecord.color || '',
            production: correctRecord.production || 0,
            milkCollection: correctRecord.milkCollection || 0,
            weight: correctRecord.weight || 0,
            purchaseDate: correctRecord.purchaseDate || null,
            purchasePrice: correctRecord.purchasePrice || 0,
            purchaseFrom: correctRecord.purchaseFrom || '',
            purchaseBy: correctRecord.purchaseBy || '',
            purchaseRemarks: correctRecord.purchaseRemarks || '',
            remarks: correctRecord.remarks || '',
            isDeleted: false,
            createdAt: correctRecord.createdAt,
            updatedAt: new Date()
          };

          await LiveStock.create(payload);
          console.log(`  -> Canonical record recreated successfully in LiveStock.`);
        } else {
          // If all records have null farmId, keep the newest one and remove the rest
          records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const newest = records[0];
          console.log(`  -> No farmId assigned. Keeping newest entry: _id: ${newest._id}, createdAt: ${newest.createdAt}`);
          
          for (let i = 1; i < records.length; i++) {
            console.log(`  -> Deleting duplicate: _id: ${records[i]._id}`);
            await Cattle.deleteOne({ _id: records[i]._id });
            await LiveStock.deleteOne({ _id: records[i]._id });
          }
        }
      }
    }

    console.log("\n--- Scanning LiveStock Collection for non-null farmId drift ---");
    const allLiveStock = await LiveStock.find({});
    
    // Group LiveStock by Tag
    const liveStockGroups: Record<string, any[]> = {};
    allLiveStock.forEach(l => {
      const tag = String(l.tag_id || '').trim().toUpperCase();
      if (tag) {
        if (!liveStockGroups[tag]) liveStockGroups[tag] = [];
        liveStockGroups[tag].push(l);
      }
    });

    for (const [tag, records] of Object.entries(liveStockGroups)) {
      if (records.length > 1) {
        console.log(`\nDuplicate tag detected in LiveStock collection: [${tag}]`);
        records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Keep the newest and remove the rest
        console.log(`  -> Keeping newest entry: _id: ${records[0]._id}, createdAt: ${records[0].createdAt}`);
        for (let i = 1; i < records.length; i++) {
          console.log(`  -> Deleting duplicate: _id: ${records[i]._id}`);
          await LiveStock.deleteOne({ _id: records[i]._id });
        }
      }
    }

    console.log("\n======================================");
    console.log("🎉 DATABASE RECONCILIATION COMPLETE");
    console.log("======================================");

  } catch (error: any) {
    console.error("❌ Reconciliation failed with error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("DB Connection closed.");
  }
}

reconcile();
