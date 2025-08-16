import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { CONNECT_API_STATIC } from '../../../../lib/auth.js';
import CryptoJS from 'crypto-js';

async function handleConnect(req,params) {
  try {
    // Extract owner username from query string
    const ownername = params.username;
    if (!ownername) {
      return NextResponse.json({ error: 'Owner not specified in query' }, { status: 400 });
    }
    // Parse form data (matching C++ client format)
    const formData = await req.formData();
    const game = formData.get('game');
    const userKey = formData.get('user_key');
    const serial = formData.get('serial');

    console.log('Incoming POST:', { game, userKey, serial });

    // Validate required fields
    if (!game || !userKey || !serial) {
      console.log('Missing required fields');
      return NextResponse.json({}, { status: 200 });
    }

    // Check maintenance mode for the specific owner
    const maintenance = await query('SELECT status FROM onoff WHERE owner = ? LIMIT 1', [ownername]);
    if (maintenance.length > 0 && maintenance[0].status === 'off') {
      console.log('System in maintenance mode');
      return NextResponse.json({}, { status: 200 });
    }

    // Find the key and check owner
    const keys = await query(
      'SELECT * FROM keys_code WHERE user_key = ? AND game = ? AND status = 1 AND owner = ?',
      [userKey, game, ownername]
    );
    console.log('Key lookup result:', keys);

    if (keys.length === 0) {
      console.log('Key not found or inactive');
      return NextResponse.json({}, { status: 200 });
    }

    const keyData = keys[0];
    if (keyData.expired_date && new Date(keyData.expired_date) < new Date()) {
      console.log('Key expired');
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
    console.log('Registered devices:', devices);

    // Check if device is already registered
    const deviceExists = devices.includes(serial);
    if (!deviceExists && devices.length >= keyData.max_devices) {
      console.log('Device limit reached');
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
      console.log('Device added:', serial);
    }

    // Get function codes for the specific owner
    const functionCodes = await query('SELECT * FROM function_code WHERE owner = ? LIMIT 1', [ownername]);
    const functions = functionCodes.length > 0 ? functionCodes[0] : {};
    console.log('Function codes:', functions);

    // Check if system is online for the specific owner
    if (functions.Online !== 'true') {
      console.log('System is offline');
      return NextResponse.json({
        status: false,
        reason: functions.Maintenance || 'System offline'
      }, { status: 200 });
    }

    // Get mod name for the specific owner
    const modNameData = await query('SELECT * FROM modname WHERE owner = ? LIMIT 1', [ownername]);
    const modName = modNameData.length > 0 ? modNameData[0].modname : 'NOCASH';

    // Get credit info for the specific owner
    const ftextData = await query('SELECT * FROM _ftext WHERE owner = ? LIMIT 1', [ownername]);
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
      console.log('Expiration date set:', expiredDate);
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
        EXP : Math.floor(new Date(expiredDate).getTime() / 1000),
        credit: credit,
        modname: modName
      }
    };
    console.log('Returning success:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function GET(req) {
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
