import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

// Get system settings
async function getSettings(req) {
  try {
    // Get function codes
    const functionCodes = await query('SELECT * FROM function_code LIMIT 1');
    const functions = functionCodes.length > 0 ? functionCodes[0] : {};
    
    // Get system status
    const systemStatus = await query('SELECT * FROM onoff WHERE id = 11 LIMIT 1');
    const status = systemStatus.length > 0 ? systemStatus[0] : { status: 'on', myinput: '' };
    
    // Get mod name
    const modName = await query('SELECT * FROM modname LIMIT 1');
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
    
    // Update function codes
    await query(
      `UPDATE function_code SET 
       Online = ?, Bullet = ?, Aimbot = ?, Memory = ?, 
       ModName = ?, Maintenance = ?, Currency = ?,
       Hr1 = ?, Days1 = ?, Days3 = ?, Days7 = ?, Days30 = ?, Days60 = ?
       WHERE id_path = 1`,
      [
        functions.online ? 'true' : 'false',
        functions.bullet ? 'true' : 'false',
        functions.aimbot ? 'true' : 'false',
        functions.memory ? 'true' : 'false',
        functions.modName,
        functions.maintenance,
        functions.currency,
        functions.prices.hr1,
        functions.prices.days1,
        functions.prices.days3,
        functions.prices.days7,
        functions.prices.days30,
        functions.prices.days60
      ]
    );
    
    // Update system status
    await query(
      'UPDATE onoff SET status = ?, myinput = ? WHERE id = 11',
      [system.status, system.maintenanceMessage]
    );
    
    // Update mod name
    await query(
      'UPDATE modname SET modname = ? WHERE id = 1',
      [modName]
    );
    
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