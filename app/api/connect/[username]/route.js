import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { CONNECT_API_STATIC } from '../../../../lib/auth.js';
import CryptoJS from 'crypto-js';
import crypto from 'crypto';

// AES encryption key (should be stored securely in production)
const AES_KEY = "nocashhost_secret_key_32_bytes_long!!"; // Same key as client

// Function to decrypt client requests using AES-256-GCM
function decryptRequest(encryptedData) {
  try {
    console.log('Attempting to decrypt AES data:', encryptedData ? encryptedData.substring(0, 50) + '...' : 'null');
    
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipher('aes-256-gcm', AES_KEY);
    
    // Extract IV (first 12 bytes) and tag (last 16 bytes)
    const iv = buffer.slice(0, 12);
    const tag = buffer.slice(buffer.length - 16);
    const ciphertext = buffer.slice(12, buffer.length - 16);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    const result = JSON.parse(decrypted);
    console.log('✅ Successfully decrypted AES request:', result);
    return result;
  } catch (error) {
    console.error('AES decryption failed:', error.message);
    return null;
  }
}

// Function to encrypt server responses using AES-256-GCM
function encryptResponse(responseData) {
  try {
    console.log('Encrypting AES response:', responseData);
    const responseJson = JSON.stringify(responseData);
    
    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipher('aes-256-gcm', AES_KEY);
    
    let encrypted = cipher.update(responseJson, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get the auth tag
    const tag = cipher.getAuthTag();
    
    // Combine encrypted data with tag
    const result = encrypted + tag.toString('base64');
    console.log('Successfully encrypted AES response, length:', result.length);
    return result;
  } catch (error) {
    console.error('AES encryption failed:', error.message);
    return null;
  }
}

async function handleConnect(req, { params }) {
  try {
    console.log('=== CONNECT API CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Extract owner username from URL params
    const ownername = params.username;
    console.log('Owner name:', ownername);
    
    if (!ownername) {
      console.log('ERROR: Owner not specified in URL path');
      return NextResponse.json({ 
        status: false, 
        error: 'Owner not specified in URL path',
        debug: 'Missing username in path'
      }, { status: 400 });
    }

    // Parse form data (matching C++ client format)
    const formData = await req.formData();
    const game = formData.get('game');
    const encryptedData = formData.get('user_key'); // Encrypted data from client
    const serial = formData.get('serial');
    
    // Debug: Log all form fields
    console.log('All form fields:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    console.log('Form data received:', { 
      game: game || 'MISSING', 
      encryptedData: encryptedData ? 'PRESENT (' + encryptedData.length + ' chars)' : 'MISSING', 
      serial: serial || 'MISSING' 
    });

    // Validate required fields
    if (!game || !encryptedData || !serial) {
      console.log('ERROR: Missing required fields');
      
      // Get all form fields for debugging
      const allFields = {};
      for (const [key, value] of formData.entries()) {
        allFields[key] = value;
      }
      
      return NextResponse.json({ 
        status: false, 
        error: 'Missing required fields',
        debug: { 
          game: !!game, 
          encryptedData: !!encryptedData, 
          serial: !!serial,
          allFields: allFields,
          receivedGame: game,
          receivedSerial: serial,
          encryptedDataLength: encryptedData ? encryptedData.length : 0
        }
      }, { status: 200 });
    }

    // Decrypt the client request
    const decryptedData = decryptRequest(encryptedData);
    if (!decryptedData) {
      console.log('ERROR: Failed to decrypt request');
      
      // Get all form fields for debugging
      const allFields = {};
      for (const [key, value] of formData.entries()) {
        allFields[key] = value;
      }
      
      return NextResponse.json({ 
        status: false, 
        error: 'Invalid request format',
        debug: 'Decryption failed',
        serverDebug: {
          encryptedDataLength: encryptedData ? encryptedData.length : 0,
          encryptedDataPreview: encryptedData ? encryptedData.substring(0, 50) + '...' : 'null',
          allFields: allFields,
          hasSerial: !!formData.get('serial'),
          hasGame: !!formData.get('game'),
          hasUserKey: !!formData.get('user_key')
        }
      }, { status: 400 });
    }

    const { userKey, uuid, timestamp, nonce } = decryptedData;
    console.log('Decrypted request data:', { userKey, uuid, timestamp, nonce });

    // Validate timestamp (prevent replay attacks)
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - timestamp) > 300) { // 5 minutes tolerance
      console.log('ERROR: Request timestamp too old or in future');
      return NextResponse.json({ 
        status: false, 
        error: 'Invalid timestamp',
        debug: { currentTime, timestamp, difference: Math.abs(currentTime - timestamp) }
      }, { status: 400 });
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
    console.log('Key lookup result:', keys.length > 0 ? 'FOUND' : 'NOT FOUND');

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
        request_timestamp: timestamp,
        debug: 'System offline'
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
      connect: true,
      debug: 'Success response'
    };

    // Encrypt the response
    const encryptedResponse = encryptResponse(responseData);
    if (!encryptedResponse) {
      console.error('Failed to encrypt response');
      return NextResponse.json({ 
        status: false, 
        error: 'Encryption failed',
        debug: 'Server encryption error'
      }, { status: 500 });
    }

    console.log('Returning encrypted success response');
    return NextResponse.json({ encrypted_data: encryptedResponse }, { status: 200 });

  } catch (error) {
    console.error('Connect API error:', error);
    return NextResponse.json({ 
      status: false, 
      error: 'Server error',
      debug: error.message
    }, { status: 200 });
  }
}

export async function GET(req, { params }) {
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