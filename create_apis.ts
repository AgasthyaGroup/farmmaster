import fs from 'fs';
import path from 'path';

const apiBaseDir = path.join(__dirname, 'app', 'api');

const modelsConfig = [
  { path: 'health/treatments', model: 'TreatmentLog', populate: "['tagId', 'shedId', 'animalId']" },
  { path: 'health/vaccinations', model: 'VaccinationLog', populate: "['tagId', 'shedId', 'animalId']" },
  { path: 'inventory/medicines', model: 'MedicineInventory', populate: "[]" },
  { path: 'inventory/feed', model: 'FeedInventory', populate: "[]" },
  { path: 'operations/grass-collection', model: 'GrassCollection', populate: "['farmId']" },
  { path: 'operations/daily-feeding', model: 'DailyFeeding', populate: "['shedId', 'animalId']" },
  { path: 'milk/collections', model: 'MilkCollection', populate: "['shedId', 'tagId']" },
  { path: 'milk/quality', model: 'MilkQuality', populate: "[]" },
];

modelsConfig.forEach(({ path: routePath, model, populate }) => {
  const fullDirPath = path.join(apiBaseDir, routePath);
  const idDirPath = path.join(fullDirPath, '[id]');
  
  fs.mkdirSync(idDirPath, { recursive: true });

  const routeContent = `import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import ${model} from '@/src/models/${model}';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse, createdResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      await dbConnect();
      const records = await ${model}.find({ isDeleted: false }).populate(${populate}).sort({ createdAt: -1 });
      return successResponse(records, '${model} fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const body = await req.json();
      await dbConnect();
      const record = await ${model}.create(body);
      return createdResponse(record, '${model} created successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
`;

  const idRouteContent = `import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import ${model} from '@/src/models/${model}';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await ${model}.findById(id).populate(${populate});
      if (!record || record.isDeleted) {
        return errorResponse('${model} not found', 404);
      }
      return successResponse(record, '${model} fetched successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'INCHARGE'], async () => {
    try {
      const { id } = await params;
      const body = await req.json();
      await dbConnect();
      const record = await ${model}.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!record || record.isDeleted) {
        return errorResponse('${model} not found', 404);
      }
      return successResponse(record, '${model} updated successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN'], async () => {
    try {
      const { id } = await params;
      await dbConnect();
      const record = await ${model}.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!record) {
        return errorResponse('${model} not found', 404);
      }
      return successResponse(null, '${model} deleted successfully');
    } catch (error: any) {
      return errorResponse(error.message, 500);
    }
  });
}
`;

  fs.writeFileSync(path.join(fullDirPath, 'route.ts'), routeContent);
  fs.writeFileSync(path.join(idDirPath, 'route.ts'), idRouteContent);
});

console.log('Successfully generated API routes.');
