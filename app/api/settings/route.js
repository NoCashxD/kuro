import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

// Get system settings
async function getSettings(req) {
  try {
    const user = req.user;
    
    // Get function codes for the specific owner
    const functionCodes = await query('SELECT * FROM function_code WHERE owner = ? LIMIT 1', [user.username]);
    const functions = functionCodes.length > 0 ? functionCodes[0] : {};
    
    // Get system status for the specific owner
    const systemStatus = await query('SELECT * FROM onoff WHERE owner = ? LIMIT 1', [user.username]);
    const status = systemStatus.length > 0 ? systemStatus[0] : { status: 'on', myinput: '' };
    
    // Get mod name for the specific owner
    const modName = await query('SELECT * FROM modname WHERE owner = ? LIMIT 1', [user.username]);
    const mod = modName.length > 0 ? modName[0] : { modname: 'NOCASH' };
    
    return NextResponse.json({
      success: true,
      settings: {
        functions: {
          online: functions.Online === 'true',
          bullet: functions.Bullet === 'true',
          aimbot: functions.Aimbot === 'true',
          memory: functions.Memory === 'true',
          modName: functions.ModName || 'NOCASH',
          maintenance: functions.Maintenance || '',
          currency: functions.Currency || '$',
          prices: {
            hr1: functions.Hr1 || '1',
            hr2: functions.Hr2 || '2',
            hr5: functions.Hr5 || '5',
            days1: functions.Days1 || '1',
            days3: functions.Days3 || '2',
            days7: functions.Days7 || '4',
            days30: functions.Days30 || '8',
            days60: functions.Days60 || '12'
          }
        },
        system: {
          status: status.status,
          maintenanceMessage: status.myinput
        },
        modName: mod.modname
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update system settings
async function updateSettings(req) {
  try {
    const { functions, system, modName } = await req.json();
    const user = req.user;
    
    // Check if settings exist for this owner, if not create them
    const existingFunctionCode = await query('SELECT id_path FROM function_code WHERE owner = ?', [user.username]);
    const existingOnOff = await query('SELECT id FROM onoff WHERE owner = ?', [user.username]);
    const existingModName = await query('SELECT id FROM modname WHERE owner = ?', [user.username]);
    
    // Update or insert function codes
    if (existingFunctionCode.length > 0) {
      await query(
        `UPDATE function_code SET 
         Online = ?, Bullet = ?, Aimbot = ?, Memory = ?, 
         ModName = ?, Maintenance = ?, Currency = ?,
         Hr1 = ?, Hr2 = ?, Hr5 = ?, Days1 = ?, Days3 = ?, Days7 = ?, Days30 = ?, Days60 = ?
         WHERE owner = ?`,
        [
          functions.online ? 'true' : 'false',
          functions.bullet ? 'true' : 'false',
          functions.aimbot ? 'true' : 'false',
          functions.memory ? 'true' : 'false',
          modName,
          functions.maintenance,
          functions.currency,
          functions.prices.hr1,
          functions.prices.hr2,
          functions.prices.hr5,
          functions.prices.days1,
          functions.prices.days3,
          functions.prices.days7,
          functions.prices.days30,
          functions.prices.days60,
          user.username
        ]
      );
    } else {
      await query(
        `INSERT INTO function_code (Online, Bullet, Aimbot, Memory, ModName, Maintenance, Currency,
         Hr1, Hr2, Hr5, Days1, Days3, Days7, Days30, Days60, owner, NoCASH) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          functions.online ? 'true' : 'false',
          functions.bullet ? 'true' : 'false',
          functions.aimbot ? 'true' : 'false',
          functions.memory ? 'true' : 'false',
          functions.modName,
          functions.maintenance,
          functions.currency,
          functions.prices.hr1,
          functions.prices.hr2,
          functions.prices.hr5,
          functions.prices.days1,
          functions.prices.days3,
          functions.prices.days7,
          functions.prices.days30,
          functions.prices.days60,
          user.username,
          user.username
        ]
      );
    }
    
    // Update or insert system status
    if (existingOnOff.length > 0) {
      await query(
        'UPDATE onoff SET status = ?, myinput = ? WHERE owner = ?',
        [system.status, system.maintenanceMessage, user.username]
      );
    } else {
      await query(
        'INSERT INTO onoff (status, myinput, owner) VALUES ( ?, ?, ?)',
        [system.status, system.maintenanceMessage, user.username]
      );
    }
    
    // Update or insert mod name
    if (existingModName.length > 0) {
      await query(
        'UPDATE modname SET modname = ? WHERE owner = ?',
        [modName, user.username]
      );
    } else {
      await query(
        'INSERT INTO modname (modname, owner) VALUES (?, ?)',
        [modName, user.username]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply middleware and handle requests
const handler = async (req) => {
  if (req.method === 'GET') {
    return getSettings(req);
  } else if (req.method === 'POST') {
    return updateSettings(req);
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

// Apply authentication and role-based access control
// Level 1 (Owner) can manage settings
export const GET = withAuthRoleAndOwner(1)(handler);
export const POST = withAuthRoleAndOwner(1)(handler); 