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

// Helper to map duration in hours to price key
function getPriceKey(durationHours) {
  switch (Number(durationHours)) {
    case 1: return 'hr1';
    case 2: return 'hr2';
    case 5: return 'hr5';
    case 24: return 'days1';
    case 72: return 'days3';
    case 168: return 'days7';
    case 720: return 'days30';
    case 1440: return 'days60';
    default: return 'hr1';
  }
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
      sql = `
        SELECT * FROM keys_code
        WHERE owner = ?
        AND (
          registrator = ?
          OR registrator IN (
            SELECT username FROM users WHERE uplink = ? AND level = 3
          )
        )
      `;
      params = [user.owner, user.username, user.username];
    } else {
      // Reseller
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

    // Get prices and currency for the correct owner
    let owner;
    if (user.level === 1) {
      owner = user.username;
    } else {
      owner = user.owner;
    }
    
    const [functionCode] = await query('SELECT * FROM function_code WHERE owner = ? LIMIT 1', [owner]);
    const prices = functionCode ? {
      hr1: Number(functionCode.Hr1) || 1,
      hr2: Number(functionCode.Hr2) || 2,
      hr5: Number(functionCode.Hr5) || 5,
      days1: Number(functionCode.Days1) || 1,
      days3: Number(functionCode.Days3) || 2,
      days7: Number(functionCode.Days7) || 4,
      days30: Number(functionCode.Days30) || 8,
      days60: Number(functionCode.Days60) || 12,
    } : {};
    const currency = functionCode?.Currency || '$';

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
      })),
      prices,
      currency
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
    
    // Always determine the correct owner for price/currency
    let owner;
    if (currentUser.level === 1) {
      owner = currentUser.username;
    } else {
      owner = currentUser.owner;
    }
    
    // Fetch prices and currency from function_code for the correct owner
    const [functionCode] = await query('SELECT * FROM function_code WHERE owner = ? LIMIT 1', [owner]);
    if (!functionCode) {
      return NextResponse.json({ error: 'Owner settings not found. Please configure settings first.' }, { status: 400 });
    }
    
    const prices = {
      hr1: Number(functionCode.Hr1) || 1,
      hr2: Number(functionCode.Hr2) || 2,
      hr5: Number(functionCode.Hr5) || 5,
      days1: Number(functionCode.Days1) || 1,
      days3: Number(functionCode.Days3) || 2,
      days7: Number(functionCode.Days7) || 4,
      days30: Number(functionCode.Days30) || 8,
      days60: Number(functionCode.Days60) || 12,
    };
    const currency = functionCode.Currency || '$';
    
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
    // Determine price per key
    const priceKey = getPriceKey(durationHours);
    const pricePerKey = prices[priceKey] || 1;
    
    // Check balance before generating keys (except for trial)
    if (!trial && (currentUser.level === 1 || currentUser.level === 2)) {
      const [userData] = await query('SELECT saldo FROM users WHERE username = ?', [currentUser.username]);
      if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const totalCost = quantity * pricePerKey;
      if (userData.saldo < totalCost) {
        return NextResponse.json({ 
          error: 'Insufficient balance', 
          required: totalCost, 
          available: userData.saldo 
        }, { status: 400 });
      }
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
      // Set expired_date to NULL for new keys
      const result = await query(
        `INSERT INTO keys_code (game, user_key, duration, expired_date, max_devices, status, registrator, owner, created_at, updated_at) 
         VALUES (?, ?, ?, NULL, ?, 1, ?, ?, NOW(), NOW())`,
        [game, userKey, durationHours, max_devices, currentUser.username, owner]
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
      const cost = quantity * pricePerKey;
      await query('UPDATE users SET saldo = saldo - ? WHERE username = ?', [cost, currentUser.username]);
    }
    
    return NextResponse.json({
      success: true,
      message: `${quantity} key(s) generated successfully`,
      keys: generatedKeys,
      cost: trial ? 0 : quantity * pricePerKey,
      currency
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
        
        // Check balance before extending keys (for Owners/Admins)
        if (currentUser.level === 1 || currentUser.level === 2) {
          const [userData] = await query('SELECT saldo FROM users WHERE username = ?', [currentUser.username]);
          if (!userData) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }
          
          const totalCost = keyIds.length * interval; // 1 saldo per hour per key
          if (userData.saldo < totalCost) {
            return NextResponse.json({ 
              error: 'Insufficient balance for extension', 
              required: totalCost, 
              available: userData.saldo 
            }, { status: 400 });
          }
        }
        
        // Only extend keys that have a non-NULL expired_date (i.e., have been used)
        const extendResult = await query(
          `UPDATE keys_code SET expired_date = DATE_ADD(expired_date, INTERVAL ? HOUR) WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) AND expired_date IS NOT NULL ${ownerFilter}`,
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
export const GET = withAuthRoleAndOwner(3)(handler);
export const POST = withAuthRoleAndOwner(3)(handler); 