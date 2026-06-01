import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return new Response('Forbidden: Access is denied.', { status: 403 });
    }

    const docId = params.id;
    const document = await prisma.beneficiaryDocument.findUnique({
      where: { id: docId },
    });

    if (!document) {
      return new Response('Document not found', { status: 404 });
    }

    // Resolve file path relative to workspace project root
    const filePath = path.join(process.cwd(), document.fileUrl);

    // Dynamic file serving
    if (!fs.existsSync(filePath)) {
      // Fallback to favicon or basic placeholder image if mock seeded file doesn't exist on disk yet
      const placeholderPath = path.join(process.cwd(), 'src/app/favicon.ico');
      if (fs.existsSync(placeholderPath)) {
        const fileBuffer = fs.readFileSync(placeholderPath);
        return new Response(fileBuffer, {
          headers: { 'Content-Type': 'image/x-icon' },
        });
      }
      // If favicon is in standard public directory
      const publicPlaceholder = path.join(process.cwd(), 'public/favicon.ico');
      if (fs.existsSync(publicPlaceholder)) {
        const fileBuffer = fs.readFileSync(publicPlaceholder);
        return new Response(fileBuffer, {
          headers: { 'Content-Type': 'image/x-icon' },
        });
      }
      return new Response('Mock Document Placeholder Active (No file on disk)', { status: 200 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    let contentType = 'application/octet-stream';
    const ext = path.extname(document.fileName).toLowerCase();
    
    if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    }

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${document.fileName}"`,
      },
    });
  } catch (error) {
    console.error('Secure document API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
