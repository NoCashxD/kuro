import { NextResponse } from 'next/server';
import { withAuthAndOwner } from "@/lib/middleware.js";
import { query } from '@/lib/db.js';

// Helper to safely add additional conditions
function appendCondition(base, condition) {
  if (base.includes('WHERE')) return `${base} AND ${condition}`;
  return `${base} WHERE ${condition}`;
}

async function getStats(req) {
  try {
    const user = req.user;
    let ownerFilter = '';
    let ownerParams = [];
    let targetOwner = '';
    
    // Determine which owner's data to show
    if (user.level === 1) {
      // Owner sees their own data
      targetOwner = user.username;
      ownerFilter = 'WHERE owner = ?';
      ownerParams = [targetOwner];
    } else if (user.level === 0) {
      // Main can see all data (no filter)
      targetOwner = 'ALL';
      ownerFilter = '';
      ownerParams = [];
    } else {
      // Admin/Reseller sees their owner's data
      targetOwner = user.owner;
      ownerFilter = 'WHERE owner = ?';
      ownerParams = [targetOwner];
    }

    // Total keys
    const totalKeysResult = await query(
      `SELECT COUNT(*) as total FROM keys_code ${ownerFilter}`,
      ownerParams
    );
    const totalKeys = totalKeysResult[0].total;

    // Active keys
    const activeKeysSQL = appendCondition(`SELECT COUNT(*) as active FROM keys_code ${ownerFilter}`, 'status = 1');
    const activeKeysResult = await query(activeKeysSQL, ownerParams);
    const activeKeys = activeKeysResult[0].active;

    // Expired keys
    const expiredKeysSQL = appendCondition(`SELECT COUNT(*) as expired FROM keys_code ${ownerFilter}`, 'expired_date < NOW()');
    const expiredKeysResult = await query(expiredKeysSQL, ownerParams);
    const expiredKeys = expiredKeysResult[0].expired;

    // Total users
    const totalUsersResult = await query(
      `SELECT COUNT(*) as total FROM users ${ownerFilter}`,
      ownerParams
    );
    const totalUsers = totalUsersResult[0].total;

    // Active users
    const activeUsersSQL = appendCondition(`SELECT COUNT(*) as active FROM users ${ownerFilter}`, 'status = 1');
    const activeUsersResult = await query(activeUsersSQL, ownerParams);
    const activeUsers = activeUsersResult[0].active;

    // Users by level
    const usersByLevelResult = await query(
      `SELECT level, COUNT(*) as count FROM users ${ownerFilter} GROUP BY level`,
      ownerParams
    );
    
    const usersByLevel = {
      owners: 0,
      admins: 0,
      resellers: 0
    };
    
    usersByLevelResult.forEach(row => {
      if (row.level === 1) usersByLevel.owners = row.count;
      else if (row.level === 2) usersByLevel.admins = row.count;
      else if (row.level === 3) usersByLevel.resellers = row.count;
    });

    // Recent activity
    const recentActivitySQL = appendCondition(
      `SELECT COUNT(*) as count FROM history ${ownerFilter}`,
      'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    const recentActivityResult = await query(recentActivitySQL, ownerParams);
    const recentActivity = recentActivityResult[0].count;

    // Keys by game
    const keysByGameResult = await query(
      `SELECT game, COUNT(*) as count FROM keys_code ${ownerFilter} GROUP BY game`,
      ownerParams
    );

    // System status - get the correct owner's status
    let systemStatus = 'on';
    if (targetOwner !== 'ALL') {
      const systemStatusResult = await query('SELECT status FROM onoff WHERE owner = ? LIMIT 1', [targetOwner]);
      systemStatus = systemStatusResult.length > 0 ? systemStatusResult[0].status : 'on';
    }

    // Function codes - get the correct owner's settings
    let functionCodes = {};
    if (targetOwner !== 'ALL') {
      const functionCodesResult = await query('SELECT * FROM function_code WHERE owner = ? LIMIT 1', [targetOwner]);
      functionCodes = functionCodesResult.length > 0 ? functionCodesResult[0] : {};
    } else {
      // For main user, get the first available settings as default
      const functionCodesResult = await query('SELECT * FROM function_code LIMIT 1');
      functionCodes = functionCodesResult.length > 0 ? functionCodesResult[0] : {};
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        keys: {
          total: totalKeys,
          active: activeKeys,
          expired: expiredKeys,
          byGame: keysByGameResult
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          byLevel: usersByLevel
        },
        activity: {
          recent: recentActivity
        },
        system: {
          status: systemStatus,
          functions: {
            online: functionCodes.Online === 'true',
            bullet: functionCodes.Bullet === 'true',
            aimbot: functionCodes.Aimbot === 'true',
            memory: functionCodes.Memory === 'true'
          },
          modName: functionCodes.ModName || 'NOCASH'
        },
        owner: targetOwner
      }
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuthAndOwner(getStats);
