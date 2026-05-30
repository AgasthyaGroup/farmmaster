import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';
import LiveStock from '../src/models/LiveStock';
import Cattle from '../src/models/Cattle';
import { deepSanitizeCattleInput } from '../app/api/cattle/route';
import { createCattleSchema } from '../src/utils/validation';

async function run() {
  try {
    await dbConnect();
    console.log("Connected to DB.");

    console.log("--- Scanning LiveStock Collection ---");
    const allLiveStock = await LiveStock.find({});
    console.log(`Total LiveStock records: ${allLiveStock.length}`);

    // Map to find duplicates
    const liveStockTags: Record<string, any[]> = {};
    allLiveStock.forEach(item => {
      const tag = item.tag_id || item.tag || '';
      if (!liveStockTags[tag]) {
        liveStockTags[tag] = [];
      }
      liveStockTags[tag].push(item);
    });

    console.log("\nDuplicate tags in LiveStock:");
    let duplicateCount = 0;
    for (const [tag, records] of Object.entries(liveStockTags)) {
      if (records.length > 1) {
        duplicateCount++;
        console.log(`Tag: [${tag}] - Found ${records.length} records:`);
        records.forEach(r => {
          console.log(`  - _id: ${r._id}, isDeleted: ${r.isDeleted}, status: ${r.status}, farmId: ${r.farmId}, createdAt: ${r.createdAt}`);
        });
      }
    }
    if (duplicateCount === 0) {
      console.log("No duplicates found in LiveStock collection.");
    }

    console.log("\n--- Scanning Cattle Collection ---");
    const allCattle = await Cattle.find({});
    console.log(`Total Cattle records: ${allCattle.length}`);

    const cattleTags: Record<string, any[]> = {};
    allCattle.forEach(item => {
      const tag = item.tag || '';
      if (!cattleTags[tag]) {
        cattleTags[tag] = [];
      }
      cattleTags[tag].push(item);
    });

    console.log("\nDuplicate tags in Cattle:");
    let cattleDuplicateCount = 0;
    for (const [tag, records] of Object.entries(cattleTags)) {
      if (records.length > 1) {
        cattleDuplicateCount++;
        console.log(`Tag: [${tag}] - Found ${records.length} records:`);
        records.forEach(r => {
          console.log(`  - _id: ${r._id}, isDeleted: ${r.isDeleted}, status: ${r.status}, farmId: ${r.farmId}, createdAt: ${r.createdAt}`);
        });
      }
    }
    if (cattleDuplicateCount === 0) {
      console.log("No duplicates found in Cattle collection.");
    }

  } catch (error: any) {
    console.error("❌ Diagnostic Scan Failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("DB Closed.");
  }
}

run();
