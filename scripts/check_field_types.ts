import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';

async function checkTypes() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) {
      console.error("DB connection is not active");
      return;
    }

    console.log("=== Active Livestock Documents ===");
    const livestockDocs = await db.collection('livestocks').find({ isDeleted: false }).limit(3).toArray();
    for (const doc of livestockDocs) {
      console.log(`Tag: ${doc.tag_id}`);
      console.log(`  farmId: ${doc.farmId} (type: ${typeof doc.farmId}, isObjectId: ${doc.farmId instanceof mongoose.Types.ObjectId})`);
      console.log(`  shedId: ${doc.shedId} (type: ${typeof doc.shedId}, isObjectId: ${doc.shedId instanceof mongoose.Types.ObjectId})`);
    }

    console.log("\n=== Active Cattle Documents ===");
    const cattleDocs = await db.collection('cattles').find({ isDeleted: false }).limit(3).toArray();
    for (const doc of cattleDocs) {
      console.log(`Tag: ${doc.tag}`);
      console.log(`  farmId: ${doc.farmId} (type: ${typeof doc.farmId}, isObjectId: ${doc.farmId instanceof mongoose.Types.ObjectId})`);
      console.log(`  shed: ${doc.shed} (type: ${typeof doc.shed}, isObjectId: ${doc.shed instanceof mongoose.Types.ObjectId})`);
    }

    console.log("\n=== Treatment Log Documents ===");
    const treatmentDocs = await db.collection('treatmentlogs').find({ isDeleted: false }).limit(3).toArray();
    for (const doc of treatmentDocs) {
      console.log(`Tag: ${doc.tag_id}`);
      console.log(`  farmId: ${doc.farmId} (type: ${typeof doc.farmId}, isObjectId: ${doc.farmId instanceof mongoose.Types.ObjectId})`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

checkTypes();
