import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';
import { generateUniqueKey, logActivity, getUserOwnerHierarchy } from '../../../lib/auth.js';

// Get all keys (with role-based filtering)
async function getKeys(req) {
  try {
    const user = req.user;
    let sql, params;
    
    if (user.level === 0) {
      // Dev can see all keys
      sql = 'SELECT * FROM keys_code ORDER BY created_at DESC';
      params = [];
    } else if (user.level === 1) {
      // Owner can see all keys from their hierarchy
      sql = 'SELECT * FROM keys_code WHERE owner = ? ORDER BY created_at DESC';
      params = [user.username];
    } else if (user.level === 2) {
      // Admin can see keys from their owner's hierarchy
      sql = 'SELECT * FROM keys_code WHERE owner = ? ORDER BY created_at DESC';
      params = [user.owner];
    } else {
      // Reseller can only see their own generated keys
      sql = 'SELECT * FROM keys_code WHERE registrator = ? ORDER BY created_at DESC';
      params = [user.username];
    }
    
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
        created_at: key.created_at
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
    const { game, quantity = 1, duration, max_devices = 1 } = data;
    
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
    
    // Generate multiple keys
    for (let i = 0; i < quantity; i++) {
      const userKey = generateUniqueKey();
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() + duration);
      
      const result = await query(
        `INSERT INTO keys_code (game, user_key, duration, expired_date, max_devices, status, registrator, owner, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
        [game, userKey, duration, expiredDate, max_devices, currentUser.username, owner]
      );
      
      generatedKeys.push({
        id: result.insertId,
        user_key: userKey,
        game,
        duration,
        expired_date: expiredDate,
        max_devices,
        owner
      });
      
      // Log activity
      await logActivity(
        result.insertId.toString(),
        currentUser.username,
        `Generated key: ${userKey} for ${game}`,
        owner
      );
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
    const { operation, keyIds, extendHours = 1 } = data;
    
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
      // Dev can operate on all keys
      ownerFilter = '';
      ownerParams = [];
    } else if (currentUser.level === 1) {
      // Owner can operate on their keys
      ownerFilter = 'AND owner = ?';
      ownerParams = [currentUser.username];
    } else if (currentUser.level === 2) {
      // Admin can operate on their owner's keys
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
        const extendResult = await query(
          `UPDATE keys_code SET expired_date = DATE_ADD(expired_date, INTERVAL ? HOUR) WHERE id_keys IN (${keyIds.map(() => '?').join(',')}) ${ownerFilter}`,
          [extendHours, ...keyIds, ...ownerParams]
        );
        affectedRows = extendResult.affectedRows;
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