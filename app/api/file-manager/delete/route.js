import { withAuth } from '../../../../lib/middleware';
import ftp from 'basic-ftp';

const ftpConfig = {
  host: "147.93.79.55", // or your domain
  user: "u679703987",
  password: "j5[~H[//TKoqMn>0",
  port: 21,
  secure: false,
  baseDir: "/home/u679703987/domains/nocash.cc/public_html/uploads"
};

async function handler(req) {
  const user = req.user;
  const { filename } = await req.json();
  if (!filename) return Response.json({ error: 'No filename provided.' }, { status: 400 });
  if (filename.includes('..') || filename.startsWith('/')) {
    return Response.json({ error: 'Invalid filename.' }, { status: 400 });
  }
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.user,
      password: ftpConfig.password,
      port: ftpConfig.port,
      secure: ftpConfig.secure,
    });
    const userDir = `${ftpConfig.baseDir}/${user.username}`;
    const filePath = `${userDir}/${filename}`;
    await client.remove(filePath);
    await client.close();
    return Response.json({ success: true });
  } catch (e) {
    console.error('FTP Delete Error:', e);
    await client.close();
    return Response.json({ error: 'Failed to delete file.' }, { status: 500 });
  }
}

export const POST = withAuth(handler); 