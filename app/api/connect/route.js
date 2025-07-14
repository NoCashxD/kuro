import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';
import { CONNECT_API_STATIC } from '../../../lib/auth.js';
import CryptoJS from 'crypto-js';

async function handleConnect(req) {
  try {
    // Parse form data (matching C++ client format)
    const formData = await req.formData();
    const game = formData.get('game');
    const userKey = formData.get('user_key');
    const serial = formData.get('serial');
    
    // Validate required fields
    if (!game || !userKey || !serial) {
      return NextResponse.json({}, { status: 200 });
    }
    
    // Check maintenance mode
    const maintenance = await query('SELECT status FROM onoff WHERE id = 11 LIMIT 1');
    if (maintenance.length > 0 && maintenance[0].status === 'off') {
      return NextResponse.json({}, { status: 200 });
    }
    
    // Find the key
    const keys = await query(
      'SELECT * FROM keys_code WHERE user_key = ? AND game = ? AND status = 1',
      [userKey, game]
    );
    
    if (keys.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }
    
    const keyData = keys[0];
    
    // Check if key is expired
    if (keyData.expired_date && new Date(keyData.expired_date) < new Date()) {
      return NextResponse.json({}, { status: 200 });
    }
    
    // Check device limit
    let devices = [];
    if (keyData.devices) {
      try {
        devices = keyData.devices.split(',').filter(d => d.trim());
      } catch (e) {
        devices = [];
      }
    }
    
    // Check if device is already registered
    const deviceExists = devices.includes(serial);
    
    if (!deviceExists && devices.length >= keyData.max_devices) {
      return NextResponse.json({}, { status: 200 });
    }
    
    // Add device if not already registered
    if (!deviceExists) {
      devices.push(serial);
      const devicesString = devices.join(',');
      await query(
        'UPDATE keys_code SET devices = ? WHERE id_keys = ?',
        [devicesString, keyData.id_keys]
      );
    }
    
    // Get function codes
    const functionCodes = await query('SELECT * FROM function_code WHERE NoCASH = "NoCASH" AND id_path = 1 LIMIT 1');
    const functions = functionCodes.length > 0 ? functionCodes[0] : {};
    
    // Check if system is online
    if (functions.Online !== 'true') {
      return NextResponse.json({
        status: false,
        reason: functions.Maintenance || 'System offline'
      }, { status: 200 });
    }
    
    // Get mod name and credit info
    const modNameData = await query('SELECT * FROM modname WHERE id = 1 LIMIT 1');
    const modName = modNameData.length > 0 ? modNameData[0].modname : 'NOCASH';
    
    const ftextData = await query('SELECT * FROM _ftext WHERE id = 1 LIMIT 1');
    const credit = ftextData.length > 0 ? ftextData[0].credit || '0' : '0';
    
    // Calculate expiration date if not set
    let expiredDate = keyData.expired_date;
    if (!expiredDate) {
      const duration = keyData.duration || 24; // Default 24 hours
      expiredDate = new Date(Date.now() + (duration * 60 * 60 * 1000));
      await query(
        'UPDATE keys_code SET expired_date = ? WHERE id_keys = ?',
        [expiredDate, keyData.id_keys]
      );
    }
    
    // Generate token using the same logic as C++ client
    const authString = `${game}-${userKey}-${serial}-${CONNECT_API_STATIC}`;
    const token = CryptoJS.MD5(authString).toString();
    
    // Prepare response matching C++ client expectations
    const responseData = {
      status: true,
      data: {
        token: token,
        rng: Math.floor(new Date(expiredDate).getTime() / 1000), // Unix timestamp
        credit: credit,
        modname: modName
      }
    };
    
    return NextResponse.json(responseData, { status: 200 });
    
  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json({}, { status: 200 });
  }
}

// Handle both GET and POST requests
export async function GET(req) {
  // Return web info for GET requests (matching PHP behavior)
  const webInfo = {
    web_info: {
      _client: "Kuro Panel",
      version: "1.5.0"
    },
    web__dev: {
      author: "NoCash",
      Website: "https://t.me/NOCASH_XD"
    }
  };
  
  return NextResponse.json(webInfo);
}

export const POST = handleConnect; 