export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const prisma = new PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Get or create default user
    const user = await prisma.user.upsert({
      where: { sessionId: 'default-session' },
      update: {},
      create: {
        sessionId: 'default-session',
        language: 'en'
      }
    });

    // Save file metadata to database
    const savedFile = await prisma.file.create({
      data: {
        userId: user.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filepath,
        status: 'uploaded'
      }
    });

    // Process file based on type
    let processedContent = null;
    if (file.type.startsWith('text/') || file.type === 'application/json') {
      // For text files, read content directly
      processedContent = buffer.toString('utf-8');
      
      // Update file status
      await prisma.file.update({
        where: { id: savedFile.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
          metadata: { processedContent, analysisMethod: 'direct' }
        }
      });
    }

    return NextResponse.json({
      fileId: savedFile.id,
      filename: savedFile.filename,
      originalName: savedFile.originalName,
      size: savedFile.size,
      mimeType: savedFile.mimeType,
      processedContent,
      status: savedFile.status
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default-session';

    const user = await prisma.user.findUnique({
      where: { sessionId: userId },
      include: {
        files: {
          where: { isDeleted: false },
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ files: [] });
    }

    return NextResponse.json({ files: user.files });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}