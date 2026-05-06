import 'dotenv/config';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Farm from '@/src/models/Farm';
import Shed from '@/src/models/Shed';
import Tag from '@/src/models/Tag';
import Cattle from '@/src/models/Cattle';
import User from '@/src/models/User';

async function run() {
  await dbConnect();

  // Backfill commonly expected flags where missing.
  await Promise.all([
    Farm.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } }),
    Farm.updateMany({ status: { $exists: false } }, { $set: { status: true } }),
    Shed.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } }),
    Tag.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } }),
    Cattle.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } }),
    Cattle.updateMany({ status: { $exists: false } }, { $set: { status: true } }),
    User.updateMany({ status: { $exists: false } }, { $set: { status: true } }),
    User.updateMany({ phone: { $exists: false } }, { $set: { phone: '' } }),
  ]);

  // Normalize emails to lowercase to match schema behavior.
  await User.collection.updateMany(
    { email: { $type: 'string' } },
    [{ $set: { email: { $toLower: '$email' } } }]
  );

  // Ensure DB indexes reflect current model definitions.
  await Promise.all([
    Farm.syncIndexes(),
    Shed.syncIndexes(),
    Tag.syncIndexes(),
    Cattle.syncIndexes(),
    User.syncIndexes(),
  ]);

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log('Database update completed successfully.');
}

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error('Database update failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
