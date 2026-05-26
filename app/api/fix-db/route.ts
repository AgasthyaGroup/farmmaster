import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Cattle from '@/src/models/Cattle';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    await Cattle.syncIndexes();
    return NextResponse.json({ message: 'Indexes synced successfully, tagId_1 dropped.' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
