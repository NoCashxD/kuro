import { withAuth } from '../../../../lib/middleware';
import ftp from 'basic-ftp';

const ftpConfig = {
  host: "147.93.79.55",
  user: "u679703987",
  password: "j5[~H[//TKoqMn>0",
  port: 21,
  secure: false,
  baseDir: "/home/u679703987/domains/nocash.cc/public_html/uploads"
};

async function handler(req) {
  const user = req.user;
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
    const list = await client.list(userDir);
    const files = list.filter(f => f.type === ftp.FileType.File).map(f => ({
      name: f.name,
      size: f.size,
      mtime: f.modifiedAt || f.rawModifiedAt || null,
    }));
    await client.close();
    return Response.json({ files });
  } catch (e) {
    console.error('FTP List Error:', e); // Debug log
    await client.close();
    return Response.json({ error: 'Failed to list files.' }, { status: 500 });
  }
}

export const GET = withAuth(handler); 