import { NextResponse } from 'next/server';
import { verifyToken, verifyPassword, hashPassword } from '../../../../lib/auth.js';
import { getUserById } from '../../../../lib/auth.js';
import { query } from '../../../../lib/db.js';

export async function POST(req) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user = await getUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const isValid = await verifyPassword(oldPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Old password is incorrect' }, { status: 403 });
    }
    const hashed = await hashPassword(newPassword);
    await query('UPDATE users SET password = ? WHERE id_users = ?', [hashed, user.id_users]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Change password error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 