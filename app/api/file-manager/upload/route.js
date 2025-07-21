import { withAuth } from '../../../../lib/middleware';
import ftp from 'basic-ftp';
import { Readable } from 'stream';

const ftpConfig = {
  host: "147.93.79.55", // or your domain
  user: "u679703987",
  password: "j5[~H[//TKoqMn>0",
  port: 21,
  secure: false,
  baseDir: "/home/u679703987/domains/nocash.cc/public_html/uploads"
};

const ALLOWED_TYPES = ['.zip', '.json', '.so', '.apk'];
const MAX_SIZE = { '.apk': 100 * 1024 * 1024, 'default': 5 * 1024 * 1024 };

async function handler(req) {
  const user = req.user;
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file) return Response.json({ error: 'No file uploaded.' }, { status: 400 });
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return Response.json({ error: 'Invalid file type.' }, { status: 400 });
  }
  const maxSize = ext === '.apk' ? MAX_SIZE['.apk'] : MAX_SIZE['default'];
  if (file.size > maxSize) {
    return Response.json({ error: 'File too large.' }, { status: 400 });
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
    await client.ensureDir(userDir);
    const filePath = `${userDir}/${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, filePath);
    await client.close();
    return Response.json({ success: true });
  } catch (e) {
    console.error('FTP Upload Error:', e);
    await client.close();
    return Response.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}

export const POST = withAuth(handler); 