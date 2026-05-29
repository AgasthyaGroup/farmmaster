import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';

async function check() {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    if (!db) return;

    const animal = await db.collection('livestocks').findOne({ _id: new mongoose.Types.ObjectId("6a19446242aa92865ab6e829") });
    console.log("Animal in livestocks by ObjectId:", animal);

    const cattle = await db.collection('cattles').findOne({ _id: new mongoose.Types.ObjectId("6a19446242aa92865ab6e829") });
    console.log("Animal in cattles by ObjectId:", cattle);

    const treatmentLogs = await db.collection('treatmentlogs').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    console.log("\n=== Last 10 Treatment Logs ===");
    for (const log of treatmentLogs) {
      console.log(`Log ID: ${log._id}, tag_id: ${log.tag_id}, tagId: ${log.tagId}, animalId: ${log.animalId}, shedId: ${log.shedId}`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

check();
