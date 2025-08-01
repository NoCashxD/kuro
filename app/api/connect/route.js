import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';
import { CONNECT_API_STATIC } from '../../../lib/auth.js';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

// Server private key (should be stored securely in production)
const SERVER_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC24XkiFVXMRjFZ
CXJfZCpS/3DRIAcwnip6cWkrbhhuJ26iJfat+vR3BJfQly6f8pwge9w3xcjsd3/0
5rx9n8vdGyTmb1azrDMe2lZRL2q7zR6+EOvVtKEXCa+e8AV5cNcDhn5WK9bb4yOk
l+FcDTVWvkszOnq7gyGR/U2UOXzczsmG5mrPRUX4E6vO3K6gJbxNDsRlkONYJB7r
bFQztw7Raf5D7SanbuzVjs4doMNkLGl7Cl81juf1BlkRv/uk/K1kHK1pqH1tZe9o
FJu0eX4lWMBI1bVAwDOKLe7yK2dvttqJ5Jx7nwhSXQB/rFPQePp+gDxdu4WOqdzl
LVgM5XhxAgMBAAECggEAL/8c+4T97468hNGl4sM3GHFR+pCdUnUwUNJS98L9Rmuy
7XtpMmAaqOHbtjL3WaMitqPLOBgAk48JVgz4iz/VEUJ+fLvb1WvsPryuyr/XE1LS
Lq/iNUQiwxkXrm7wAN9MjvBNV/BJg4wpXpk93BrbVNi8g8VlULEprlb8dVphGtH5
HR4552yOpWS51+P1qtPRxSFDYhtPX4eilMAQMOCIZ8d+lKFCQbxPhDBuGVLmPBlt
ONAkdA+in88pXiWTisA58gEsn/sk133aLtKlGCOVG6BGaib0gcNtVE3V2/3i/kao
ojfXWZrOg8k0o2aNzhskWqxiF2nkoggl3sDkLwwBwQKBgQDaznMENjTPOPqKPwBc
eYzEHF06j8KYJSServcSst7mUumvPAodGsMtMqh3n4BqwtxEKyTCn2Si7b0FtIck
SsvlRQvZtwBWH/UHVSFltih+hTQRYWaFZHMHX/LYrFlE6Zkv8rHQTJeYBfo8ncms
ZXZpy3Hqet4wnTJD3Y1bHoh1swKBgQDV96/IoJavKBFIqs2XtKAqEPnOXoRyzqMS
RP3f2iLLu/FUkNHJ6/KyDhA3Y62RzGvejSNUmxrt4K5l+qXiTUZh7SEKc+kYBbiP
xhQED89A4zfxMJUSM5SgvP8pp2b8t4FYD+2YP223wt1IGa57xOTC3D4767xKDKm6
RD/5XCSPSwKBgAVMaIaalW7LL233lpemrdz13uATKSAsDhX1oLAIOtOTAGuo5YnM
4xsOFfxHlYGAVHsmHE7GM1aqsSAZPgiH8yYLJP1RrCVpwrI5woRHA/YEXb1qAWSL
iSmNjkDm84Zyra32j42+vREGXAfpvj95eYOYVJrb/NNqixQPomOpep53AoGBAL+N
GSqkUaIHXcnPV3Ub+FMQlYLh7PMW+LhPWXSAxavc2oUZjSaW+9PZcT0VGHsxJdS8
R8fjf607+wVC6iT5hyv97Rl9gUzHOl5ENwEX4jQ19owPMTV1RfbMnCZ/Ply6L6pV
wCAPkLr1UcLNcv5M23tzTqe4N/2W7o/Zr+geTICXAoGBAJaMXVlupe0tC1BNQfio
P9T2SsjUTdWeyUFHdLRZJjfy9mHzeyELYgL6CcwwTAFyMcUfwDznlX9tLYqWvlpR
KWSMRd8EQIjSf4t4GAlGE1o4NcN/C8zOARzqek+iqan8UepVqrh5xFPKDzq6Fw8m
SML7tM0ng970IVzHh+fnUMQ8
-----END PRIVATE KEY-----`;

// Function to decrypt client requests
function decryptRequest(encryptedData) {
  try {
    const privateKey = crypto.createPrivateKey(SERVER_PRIVATE_KEY);
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Function to encrypt server responses
function encryptResponse(responseData) {
  try {
    const responseJson = JSON.stringify(responseData);
    const publicKey = crypto.createPublicKey(SERVER_PRIVATE_KEY);
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(responseJson)
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

async function handleConnect(req) {
  try {
    // Extract owner username from query string
    const url = req.nextUrl || req.url;
    let ownername = null;
    if (url) {
      const parsedUrl = typeof url === 'string' ? new URL(url, 'http://localhost') : url;
      ownername = parsedUrl.searchParams ? parsedUrl.searchParams.get('username') : parsedUrl.searchParams.get('username');
    }
    if (!ownername) {
      return NextResponse.json({ error: 'Owner not specified in query' }, { status: 400 });
    }

    // Parse form data (matching C++ client format)
    const formData = await req.formData();
    const game = formData.get('game');
    const encryptedData = formData.get('user_key'); // Encrypted data from client
    const serial = formData.get('serial');

    console.log('Incoming encrypted POST:', { game, encryptedData: encryptedData ? 'present' : 'missing', serial });

    // Validate required fields
    if (!game || !encryptedData || !serial) {
      console.log('Missing required fields');
      return NextResponse.json({}, { status: 200 });
    }

    // Decrypt the client request
    const decryptedData = decryptRequest(encryptedData);
    if (!decryptedData) {
      console.log('Failed to decrypt request');
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { userKey, uuid, timestamp, nonce } = decryptedData;

    console.log('Decrypted request:', { userKey, uuid, timestamp, nonce });

    // Validate timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) { // 5 minutes tolerance
      console.log('Request timestamp too old or in future');
      return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 });
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
      const errorResponse = {
        status: false,
        reason: functions.Maintenance || 'System offline',
        request_timestamp: timestamp
      };
      const encryptedError = encryptResponse(errorResponse);
      return NextResponse.json({ encrypted_data: encryptedError }, { status: 200 });
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

    // Generate server signature for additional security
    const signatureData = `${token}-${Math.floor(new Date(expiredDate).getTime() / 1000)}-${CONNECT_API_STATIC}`;
    const serverSignature = CryptoJS.SHA256(signatureData).toString();

    // Prepare encrypted response matching C++ client expectations
    const responseData = {
      status: true,
      data: {
        token: token,
        rng: Math.floor(new Date(expiredDate).getTime() / 1000), // Unix timestamp
        EXP: Math.floor(new Date(expiredDate).getTime() / 1000),
        credit: credit,
        modname: modName
      },
      server_signature: serverSignature,
      request_timestamp: timestamp,
      nocashhost: true,
      connect: true
    };

    // Encrypt the response
    const encryptedResponse = encryptResponse(responseData);
    if (!encryptedResponse) {
      console.error('Failed to encrypt response');
      return NextResponse.json({ error: 'Encryption failed' }, { status: 500 });
    }

    console.log('Returning encrypted success response');
    return NextResponse.json({ encrypted_data: encryptedResponse }, { status: 200 });

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

export const POST = handleConnect; 