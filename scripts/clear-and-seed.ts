import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dbConnect from '../src/database/dbConnection';
import Role from '../src/models/Role';
import User from '../src/models/User';
import Farm from '../src/models/Farm';
import Shed from '../src/models/Shed';

async function main() {
  console.log("Connecting to Database...");
  await dbConnect();
  console.log("Connected successfully.");

  if (!mongoose.connection.db) {
    throw new Error("Database connection not established correctly");
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Found collections:", collections.map(c => c.name));

  for (const collection of collections) {
    console.log(`Dropping collection: ${collection.name}`);
    try {
      await mongoose.connection.db.dropCollection(collection.name);
    } catch (e: any) {
      console.log(`Error dropping ${collection.name}:`, e.message);
    }
  }

  console.log("Database cleared completely!");

  // 1. Seed Roles
  console.log("Seeding Roles...");
  const roles = [
    {
      name: 'SUPER_ADMIN',
      description: 'Full access to all modules and settings',
      permissions: ['ALL'],
      isSystem: true,
      status: true,
    },
    {
      name: 'FARM_ADMIN',
      description: 'Access to all modules except user management',
      permissions: ['DASHBOARD', 'FARMS', 'SHEDS', 'TAGS', 'CATTLE'],
      isSystem: true,
      status: true,
    },
    {
      name: 'INCHARGE',
      description: 'Access to operations and data entry for a specific farm',
      permissions: ['DASHBOARD', 'CATTLE', 'SHED_LOG', 'CROSSING_LOG', 'HEALTH', 'MILK_PRODUCTION'],
      isSystem: true,
      status: true,
    },
    {
      name: 'HEALTH',
      description: 'Access to health and treatment logs',
      permissions: ['DASHBOARD', 'HEALTH'],
      isSystem: true,
      status: true,
    }
  ];
  await Role.insertMany(roles);
  console.log("Roles seeded!");

  // 2. Seed Users
  console.log("Seeding Admin Users...");
  const hashedPassword = await bcryptjs.hash('admin123', 10);
  
  await User.create({
    userId: 'admin',
    name: 'Local Admin',
    email: 'admin@admin.com',
    department: 'IT',
    phone: '1234567890',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    status: true,
  });

  await User.create({
    userId: 'main_admin',
    name: 'Main Admin',
    email: 'admin@farmmaster.com',
    department: 'Management',
    phone: '1234567890',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    status: true,
  });

  const jashPassword = await bcryptjs.hash('Admin@143', 10);
  await User.create({
    userId: 'jash',
    name: 'Jash',
    email: 'jash@gmail.com',
    department: 'Management',
    phone: '1234567890',
    password: jashPassword,
    role: 'SUPER_ADMIN',
    status: true,
  });

  console.log("Admin users seeded!");

  // 3. Seed default Farm
  console.log("Seeding default Farm...");
  const defaultFarm = await Farm.create({
    name: 'Agasthya Farm 1',
    code: 'AGA1',
    address: 'Vemula, Andhra Pradesh',
    location: 'Vemula',
    status: true,
    isDeleted: false,
  });
  console.log("Default farm seeded:", defaultFarm.name, `(ID: ${defaultFarm._id})`);

  // 4. Seed default Sheds (codes 1 to 6)
  console.log("Seeding default Sheds...");
  const sheds = [
    { farmId: defaultFarm._id, name: 'Shed 1', code: '1', capacity: 100, status: 'ACTIVE' },
    { farmId: defaultFarm._id, name: 'Shed 2', code: '2', capacity: 100, status: 'ACTIVE' },
    { farmId: defaultFarm._id, name: 'Shed 3', code: '3', capacity: 100, status: 'ACTIVE' },
    { farmId: defaultFarm._id, name: 'Shed 4', code: '4', capacity: 100, status: 'ACTIVE' },
    { farmId: defaultFarm._id, name: 'Shed 5', code: '5', capacity: 100, status: 'ACTIVE' },
    { farmId: defaultFarm._id, name: 'Shed 6', code: '6', capacity: 100, status: 'ACTIVE' },
  ];
  await Shed.insertMany(sheds);
  console.log("Shed codes 1-6 seeded successfully!");

  await mongoose.disconnect();
  console.log("Disconnected. Clear and seed process complete.");
}

main().catch(console.error);
