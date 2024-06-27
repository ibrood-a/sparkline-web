// /app/api/upload/register.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jwt-simple';
import { uploadImage, uploadVideo } from '@/lib/post-service';

async function handleUpload(req: NextRequest) {
  const body = await req.json();
  const { userId, fileData, fileName } = body;

  if (!userId || !fileData || !fileName) {
    return new NextResponse(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
  }

  try {
    const payload = { userId, iss: process.env.JWT_ISSUER };
    const token = jwt.encode(payload, process.env.JWT_SECRET!!, "HS256");

    const request = {
      token: token,
      byteArray: fileData,
    };

    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let url;

    if (['mp4', 'mov', 'avi'].includes(fileExtension)) {
      url = await uploadVideo(request, () => {});
    } else {
      url = await uploadImage(request, () => {});
    }

    return new NextResponse(JSON.stringify({ url }), { status: 200 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleUpload(req);
}

export async function GET() {
  return new NextResponse(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
}
