import { verifyToken } from './auth.js';
import { getUserByUsername } from './auth.js';
import { NextResponse } from 'next/server';
import { getRoleByLevel, hasPermission, ROLES } from '../roles.js';

// Authentication middleware
export function withAuth(handler) {
  return async (req, context) => {
    try {
      const token = req.cookies.get('auth-token')?.value || 
                   req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      
      // Add user info to request
      req.user = decoded;
      
      return handler(req, context);
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

// Role-based access control middleware
export function withRole(requiredLevel) {
  return (handler) => {
    return withAuth(async (req, context) => {
      const user = req.user;
      if (user.level > requiredLevel) {
        return NextResponse.json({ error: 'Insufficient permissions hh' }, { status: 403 });
      }
      return handler(req, context);
    });
  };
}

// Owner-based data access middleware (refactored for new hierarchy)
export function withOwnerAccess(handler) {
  return withAuth(async (req, context) => {
    const user = req.user;
    const role = getRoleByLevel(user.level);

    // Main has full access, no filters
    if (user.level === ROLES.MAIN.level) {
      req.ownerFilter = '';
      req.ownerParams = [];
    } else if (user.level === ROLES.OWNER.level) {
      // Owner: only their hierarchy
      req.ownerFilter = 'AND owner = ?';
      req.ownerParams = [user.username];
    } else if (user.level === ROLES.ADMIN.level) {
      // Admin: only their owner's hierarchy
      req.ownerFilter = 'AND owner = ?';
      req.ownerParams = [user.owner];
    } else if (user.level === ROLES.RESELLER.level) {
      // Reseller: only their own keys/users
      req.ownerFilter = 'AND registrator = ?';
      req.ownerParams = [user.username];
    } else {
      // Default: restrict all
      req.ownerFilter = 'AND 1=0';
      req.ownerParams = [];
    }
    return handler(req, context);
  });
}

// API rate limiting (simple in-memory implementation)
const rateLimitMap = new Map();

export function withRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (handler) => {
    return async (req, context) => {
      const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
      
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, []);
      }
      
      const requests = rateLimitMap.get(ip);
      
      // Remove old requests outside the window
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      rateLimitMap.set(ip, validRequests);
      
      if (validRequests.length >= maxRequests) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
      
      // Add current request
      validRequests.push(now);
      rateLimitMap.set(ip, validRequests);
      
      return handler(req, context);
    };
  };
}

// CORS middleware
export function withCORS(handler) {
  return async (req, context) => {
    const response = await handler(req, context);
    
    if (response) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    return response;
  };
}

// Input validation middleware
export function withValidation(schema) {
  return (handler) => {
    return async (req, context) => {
      try {
        let data;
        
        if (req.method === 'GET') {
          data = Object.fromEntries(req.nextUrl.searchParams);
        } else {
          data = await req.json();
        }
        
        const validation = schema.safeParse(data);
        
        if (!validation.success) {
          return NextResponse.json({ 
            error: 'Validation failed', 
            details: validation.error.errors 
          }, { status: 400 });
        }
        
        req.validatedData = validation.data;
        return handler(req, context);
      } catch (error) {
        console.error('❌ Validation middleware error:', error);
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
      }
    };
  };
}

// Device fingerprinting middleware
export function withDeviceFingerprint(handler) {
  return async (req, context) => {
    const userAgent = req.headers.get('user-agent') || '';
    const deviceFingerprint = generateDeviceFingerprint(userAgent);
    
    req.deviceFingerprint = deviceFingerprint;
    req.userAgent = userAgent;
    
    return handler(req, context);
  };
}

// Helper function to generate device fingerprint
function generateDeviceFingerprint(userAgent) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(userAgent + 'XquxmymXDtWRA66D').digest('hex');
}

// Combine multiple middlewares
export function compose(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Common middleware combinations
export const withAuthAndRole = (requiredLevel) => compose(withAuth, withRole(requiredLevel));
export const withAuthAndOwner = compose(withAuth, withOwnerAccess);
// Role-based + owner-based access control middleware (refactored)
export const withAuthRoleAndOwner = (requiredLevel) => compose(
  withAuth,
  withRole(requiredLevel),
  withOwnerAccess
);
export const withApiProtection = compose(withCORS, withRateLimit(100), withDeviceFingerprint); 