import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';
import { generateReferralCode } from '../../../lib/auth.js';

// Get all referral codes (with owner filtering)
async function getReferrals(req) {
  try {
    const user = req.user;
    let sql, params;
    
    if (user.level === 1) {
      // Owner can see all referral codes
      sql = 'SELECT * FROM referral_code ORDER BY created_at DESC';
      params = [];
    } else {
      // Admin/Reseller can only see referral codes from their owner hierarchy
      sql = 'SELECT * FROM referral_code WHERE owner = ? ORDER BY created_at DESC';
      params = [user.owner];
    }
    
    const referrals = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      referrals: referrals.map(ref => ({
        id: ref.id_reff,
        code: ref.code,
        referral: ref.Referral,
        level: ref.level,
        set_saldo: ref.set_saldo,
        used_by: ref.used_by,
        created_by: ref.created_by,
        owner: ref.owner,
        created_at: ref.created_at,
        acc_expiration: ref.acc_expiration
      }))
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new referral code
async function createReferral(req) {
  try {
    const { level = 3, set_saldo = 100, acc_expiration } = await req.json();
    const currentUser = req.user;
    
    // Determine owner based on current user
    let owner;
    if (currentUser.level === 1) {
      owner = currentUser.username;
    } else {
      owner = currentUser.owner;
    }
    
    // Generate unique referral code
    const code = generateReferralCode();
    
    // Create referral code
    const result = await query(
      `INSERT INTO referral_code (code, Referral, level, set_saldo, used_by, created_by, owner, acc_expiration, created_at, updated_at) 
       VALUES (?, ?, ?, ?, '', ?, ?, ?, NOW(), NOW())`,
      [code, owner.toUpperCase(), level, set_saldo, currentUser.username, owner, acc_expiration]
    );
    
    return NextResponse.json({
      success: true,
      message: 'Referral code created successfully',
      referralId: result.insertId,
      code: code
    });
  } catch (error) {
    console.error('Create referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply middleware and handle requests
const handler = async (req) => {
  if (req.method === 'GET') {
    return getReferrals(req);
  } else if (req.method === 'POST') {
    return createReferral(req);
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

// Apply authentication and role-based access control
// Level 2 (Admin) can manage referral codes
export const GET = withAuthRoleAndOwner(2)(handler);
export const POST = withAuthRoleAndOwner(2)(handler); 