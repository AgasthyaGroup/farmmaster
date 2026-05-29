import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import dbConnect from '../src/database/dbConnection';
import TreatmentLog from '../src/models/TreatmentLog';
import LiveStock from '../src/models/LiveStock';

async function test() {
  try {
    console.log("Connecting to DB...");
    await dbConnect();
    console.log("Connected. Preparing test livestock asset...");
    
    // Ensure TAG-TEST-001 exists in active livestock
    await LiveStock.findOneAndUpdate(
      { tag_id: "TAG-TEST-001" },
      {
        tag_id: "TAG-TEST-001",
        animalType: "COW",
        status: "ACTIVE",
        isDeleted: false
      },
      { upsert: true, new: true }
    );
    console.log("TAG-TEST-001 ensured.");

    const payload = {
      tag_id: "TAG-TEST-001",
      diagnosis: "Fever",
      treatmentDetails: "Antibiotics",
      medicinesUsed: "Paracetamol",
      startDate: new Date(),
      endDate: new Date(),
      administeredBy: "Dr. Smith",
      status: "Completed",
      cost: 500,
      remarks: "Follow up in 3 days",
      isDeleted: false
    };

    console.log("Attempting to create treatment log...");
    const record = await TreatmentLog.create(payload);
    console.log("SUCCESS! Created record:", record);
  } catch (error: any) {
    console.error("ERROR CAUGHT IN TEST SCRIPT:");
    console.error(error);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await mongoose.connection.close();
    console.log("DB Connection closed.");
  }
}

test();
