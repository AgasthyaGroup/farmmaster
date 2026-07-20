import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { withAuth } from '@/src/utils/authGuard';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  return withAuth(req, ['SUPER_ADMIN', 'FARM_ADMIN', 'USERS'], async () => {
    try {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return errorResponse('No file uploaded', 400);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads folder inside public directory
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      // Generate a unique filename
      const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);

      const fileUrl = `/uploads/${uniqueName}`;
      return successResponse({ url: fileUrl }, 'File uploaded successfully');
    } catch (error: any) {
      console.error('[POST /api/admin/upload] error:', error);
      return errorResponse(error.message || 'Internal server error', 500);
    }
  });
}
