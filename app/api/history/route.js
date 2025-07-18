import { NextResponse } from 'next/server';
import { withAuthAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

async function getHistory(req) {
  try {
    const user = req.user;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;
    
    let sql, countSql, params;
    
    if (user.level === 1) {
      // Owner can see all history - optimized query with proper indexing
      sql = 'SELECT id_history, keys_id, user_do, info, owner, created_at FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?';
      countSql = 'SELECT COUNT(*) as total FROM history';
      params = [limit, offset];
    } else {
      // Admin/Reseller can only see history from their owner hierarchy - optimized query
      sql = 'SELECT id_history, keys_id, user_do, info, owner, created_at FROM history WHERE owner = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      countSql = 'SELECT COUNT(*) as total FROM history WHERE owner = ?';
      params = [user.owner, limit, offset];
    }
    
    // Execute queries in parallel for better performance
    const [history, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, user.level === 1 ? [] : [user.owner])
    ]);
    
    const total = countResult[0].total;
    
    return NextResponse.json({
      success: true,
      history: history.map(h => ({
        id: h.id_history,
        keys_id: h.keys_id,
        user_do: h.user_do,
        info: h.info,
        owner: h.owner,
        created_at: h.created_at
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuthAndOwner(getHistory); 