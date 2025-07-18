import { NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, generateToken, updateUserDevice, generateDeviceFingerprint } from '../../../../lib/auth.js';
import { query } from '../../../../lib/db.js';
import { withRateLimit } from '../../../../lib/middleware.js';

// Progressive login handler
async function handleLogin(req) {
  try {
    const { username, password, step = 1 } = await req.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    
    // Step 1: Check if username exists
    if (step === 1) {
      const user = await getUserByUsername(username);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      if (user.status !== 1) {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
      }
      
      // Check account expiration
      if (user.expiration_date && new Date(user.expiration_date) < new Date()) {
        return NextResponse.json({ error: 'Account has expired' }, { status: 403 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Username verified',
        user: {
          username: user.username,
          fullname: user.fullname,
          level: user.level
        }
      });
    }
    
    // Step 2: Verify password and complete login
    if (step === 2) {
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }
      
      const user = await getUserByUsername(username);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      const isValidPassword = await verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
      
      // Device fingerprinting
      const userAgent = req.headers.get('user-agent') || '';
      const deviceFingerprint = generateDeviceFingerprint(userAgent);
      
      // Check device binding
      if (user.loginDevices && user.loginDevices !== deviceFingerprint) {
        // Allow device reset (limited to 3 attempts)
        const resetAttempts = parseInt(user.loginRsetTime) || 0;
        
        if (resetAttempts >= 3) {
          return NextResponse.json({ 
            error: 'Device not authorized. Maximum reset attempts reached.' 
          }, { status: 403 });
        }
        
        // Update reset attempts
        await query(
          'UPDATE users SET loginRsetTime = ? WHERE username = ?',
          [resetAttempts + 1, username]
        );
        
        return NextResponse.json({ 
          error: 'Device not authorized. Please contact administrator.',
          resetAttempts: resetAttempts + 1
        }, { status: 403 });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Update device info
      await updateUserDevice(username, deviceFingerprint);
      
      // Reset reset attempts on successful login
      await query(
        'UPDATE users SET loginRsetTime = 0 WHERE username = ?',
        [username]
      );
      
      // Create response with token
      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id_users,
          username: user.username,
          fullname: user.fullname,
          level: user.level,
          saldo: user.saldo,
          owner: user.owner || user.username
        }
      });
      
      // Set HTTP-only cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      
      return response;
    }
    
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply rate limiting to login attempts
export const POST = withRateLimit(5, 15 * 60 * 1000)(handleLogin); 