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

async function handler(req) {
  const user = req.user;
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename');
    if (!filename || !filename.endsWith('.json') || filename.includes('..') || filename.startsWith('/')) {
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
      // Download file to buffer
      let content = '';
      const writable = new (require('stream').Writable)();
      let chunks = [];
      writable._write = (chunk, enc, next) => { chunks.push(chunk); next(); };
      await client.downloadTo(writable, filePath);
      content = Buffer.concat(chunks).toString('utf8');
      await client.close();
      return Response.json({ content });
    } catch (e) {
      console.error('FTP JSON Read Error:', e);
      await client.close();
      return Response.json({ error: 'Failed to read file.' }, { status: 500 });
    }
  } else if (req.method === 'POST') {
    const { filename, content } = await req.json();
    if (!filename || !filename.endsWith('.json') || filename.includes('..') || filename.startsWith('/')) {
      return Response.json({ error: 'Invalid filename.' }, { status: 400 });
    }
    try {
      JSON.parse(content);
    } catch {
      return Response.json({ error: 'Invalid JSON.' }, { status: 400 });
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
      const buffer = Buffer.from(content, 'utf8');
      const stream = Readable.from(buffer);
      await client.uploadFrom(stream, filePath);
      await client.close();
      return Response.json({ success: true });
    } catch (e) {
      console.error('FTP JSON Write Error:', e);
      await client.close();
      return Response.json({ error: 'Failed to save file.' }, { status: 500 });
    }
  } else {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler); 