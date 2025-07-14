import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth.js';
import { getUserById } from '../../../../lib/auth.js';

export async function GET(req) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const user = await getUserById(decoded.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.status !== 1) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id_users,
        username: user.username,
        fullname: user.fullname,
        level: user.level,
        saldo: user.saldo,
        owner: user.owner || user.username,
        expiration_date: user.expiration_date
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 