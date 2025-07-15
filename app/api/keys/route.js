import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';
import { generateUniqueKey, logActivity, getUserOwnerHierarchy } from '../../../lib/auth.js';

// Helper to generate random suffix
function randomSuffix(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get all keys (with role-based filtering)
async function getKeys(req) {
  try {
    const user = req.user;
    const url = req.nextUrl || req.url;
    let search = '';
    if (typeof url === 'string') {
      const u = new URL(url, 'http://localhost');
      search = u.searchParams.get('q') || '';
    } else if (url && url.searchParams) {
      search = url.searchParams.get('q') || '';
    }
    let sql, params;
    if (user.level === 0) {
      sql = 'SELECT * FROM keys_code';
      params = [];
    } else if (user.level === 1) {
      sql = 'SELECT * FROM keys_code WHERE owner = ?';
      params = [user.username];
    } else if (user.level === 2) {
      sql = 'SELECT * FROM keys_code WHERE owner = ?';
      params = [user.owner];
    } else {
      sql = 'SELECT * FROM keys_code WHERE registrator = ?';
      params = [user.username];
    }
    // Add search filter if present
    if (search) {
      const like = `%${search}%`;
      if (params.length > 0) {
        sql += ' AND (user_key LIKE ? OR game LIKE ? OR owner LIKE ?)';
        params.push(like, like, like);
      } else {
        sql += ' WHERE (user_key LIKE ? OR game LIKE ? OR owner LIKE ?)';
        params = [like, like, like];
      }
    }
    sql += ' ORDER BY created_at DESC';
    const keys = await query(sql, params);
    return NextResponse.json({
      success: true,
      keys: keys.map(key => ({
        id: key.id_keys,
        game: key.game,
        user_key: key.user_key,
        duration: key.duration,
        expired_date: key.expired_date,
        max_devices: key.max_devices,
        devices: key.devices,
        status: key.status,
        registrator: key.registrator,
        owner: key.owner,
        created_at: key.created_at,
        generated_by: key.registrator
      }))
    });
  } catch (error) {
    console.error('❌ Get keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate new keys
async function generateKeys(data, currentUser) {
  try {
    const { game, quantity = 1, duration, max_devices = 1, prefix = '', durationUnit = 'hours', trial = false, useOnlyPrefix = false } = data;
    // Validate required fields
    if (!game || !duration) {
      return NextResponse.json({ error: 'Game and duration are required' }, { status: 400 });
    }
    // Determine owner based on current user
    let owner;
    if (currentUser.level === 1) {
      owner = currentUser.username;
    } else {
      owner = currentUser.owner;
    }
    const generatedKeys = [];
    // Calculate duration in hours
    let durationHours = Number(duration);
    if (durationUnit === 'days') {
      durationHours = Number(duration) * 24;
    }
    // For trial key, force 1 hour
    if (trial) {
      durationHours = 1;
    }
    // Bulk generation
    for (let i = 0; i < quantity; i++) {
      let userKey;
      if (useOnlyPrefix) {
        userKey = prefix || 'KEY';
      } else {
        const suffix = randomSuffix();
        userKey = `${prefix || 'KEY'}-${suffix}`;
      }
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() + durationHours);
      const result = await query(
        `INSERT INTO keys_code (game, user_key, duration, expired_date, max_devices, status, registrator, owner, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
        [game, userKey, durationHours, expiredDate, max_devices, currentUser.username, owner]
      );
      generatedKeys.push(userKey);
      // Log activity
      await logActivity(
        result.insertId.toString(),
        currentUser.username,
        `Generated key: ${userKey} for ${game}`,
        owner
      );
    }
    // Deduct balance for Owners/Admins (except trial)
    if (!trial && (currentUser.level === 1 || currentUser.level === 2)) {
      const cost = quantity * durationHours; // Example: 1 saldo per hour per key
      await query('UPDATE users SET saldo = saldo - ? WHERE username = ?', [cost, currentUser.username]);
    }
    return NextResponse.json({
      success: true,
      message: `${quantity} key(s) generated successfully`,
      keys: generatedKeys
    });
  } catch (error) {
    console.error('❌ Generate keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Bulk operations on keys
async function bulkOperation(data, currentUser) {
  try {
    const { operation, keyIds, extendHours = 1, extendUnit = 'hours' } = data;
    if (!operation || !keyIds || !Array.isArray(keyIds)) {
      return NextResponse.json({ error: 'Operation and key IDs are required' }, { status: 400 });
    }
    // Resellers can't perform bulk operations
    if (currentUser.level === 3) {
      return NextResponse.json({ error: 'Insufficient permissions for bulk operations' }, { status: 403 });
    }
    // Determine owner filter based on role
    let ownerFilter = '';
    let ownerParams = [];
    if (currentUser.level === 0) {
      ownerFilter = '';
      ownerParams = [];
    } else if (currentUser.level === 1) {
      ownerFilter = 'AND owner = ?';
      ownerParams = [currentUser.username];
    } else if (currentUser.level === 2) {
      ownerFilter = 'AND owner = ?';
      ownerParams = [currentUser.owner];
    }
    let affectedRows = 0;
    switch (operation) {
      case 'delete':
        const deleteResult = await query(
          `DELETE FROM keys_code WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) ${ownerFilter}`,
          [...keyIds, ...ownerParams]
        );
        affectedRows = deleteResult.affectedRows;
        break;
        
      case 'activate':
        const activateResult = await query(
          `UPDATE keys_code SET status = 1 WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) ${ownerFilter}`,
          [...keyIds, ...ownerParams]
        );
        affectedRows = activateResult.affectedRows;
        break;
        
      case 'deactivate':
        const deactivateResult = await query(
          `UPDATE keys_code SET status = 0 WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) ${ownerFilter}`,
          [...keyIds, ...ownerParams]
        );
        affectedRows = deactivateResult.affectedRows;
        break;
        
      case 'extend':
        let interval = extendHours;
        if (extendUnit === 'days') interval = extendHours * 24;
        const extendResult = await query(
          `UPDATE keys_code SET expired_date = DATE_ADD(expired_date, INTERVAL ? HOUR) WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) ${ownerFilter}`,
          [interval, ...keyIds, ...ownerParams]
        );
        affectedRows = extendResult.affectedRows;
        // Deduct balance for Owners/Admins
        if (currentUser.level === 1 || currentUser.level === 2) {
          const cost = keyIds.length * interval; // Example: 1 saldo per hour per key
          await query('UPDATE users SET saldo = saldo - ? WHERE username = ?', [cost, currentUser.username]);
        }
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }
    
    // Log activity
    await logActivity(
      keyIds.join(','),
      currentUser.username,
      `Bulk ${operation} operation on ${affectedRows} keys`,
      currentUser.owner || currentUser.username
    );
    
    return NextResponse.json({
      success: true,
      message: `${operation} operation completed on ${affectedRows} key(s)`,
      affectedRows
    });
  } catch (error) {
    console.error('❌ Bulk operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply middleware and handle requests
const handler = async (req) => {
  if (req.method === 'GET') {
    return getKeys(req);
  } else if (req.method === 'POST') {
    try {
      // Read the request body once
      const data = await req.json();
      const { operation } = data;
      
      if (operation && ['delete', 'activate', 'deactivate', 'extend'].includes(operation)) {
        return bulkOperation(data, req.user);
      } else {
        return generateKeys(data, req.user);
      }
    } catch (error) {
      console.error('❌ Request parsing error:', error);
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

// Apply authentication and role-based access control
// Level 2 (Admin) can manage keys
export const GET = withAuthRoleAndOwner(2)(handler);
export const POST = withAuthRoleAndOwner(2)(handler); 