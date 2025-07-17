import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import * as ftp from 'basic-ftp';

export const POST = withAuthRoleAndOwner(1)(async (req) => {
  try {
    // Only accept multipart/form-data
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !file.name.endsWith('.so')) {
      return NextResponse.json({ error: 'Only .so files are allowed' }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to FTP
    const client = new ftp.Client();
    await client.access({
      host: "ftp://147.93.79.55",
      user: "u679703987",
      password: "@YnO0A@e;J^2r0e5",
      secure: false
    });
    await client.uploadFrom(buffer, `/libs/${file.name}`);
    client.close();

    return NextResponse.json({ success: true, message: 'File uploaded to FTP successfully.' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}); 