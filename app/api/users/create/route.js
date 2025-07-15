import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { withAuthRoleAndOwner } from '../../../../lib/middleware.js';
import { ROLES } from '../../../../roles.js';

async function createUser(req) {
  try {
    const currentUser = req.user;
    const data = await req.json();
    const { fullname, username, password, level, saldo, expiration_date } = data;

    // Role and hierarchy checks
    if (currentUser.level === ROLES.MAIN.level) {
      if (level !== ROLES.OWNER.level) {
        return NextResponse.json({ error: 'Main can only create Owners' }, { status: 403 });
      }
    } else if (currentUser.level === ROLES.OWNER.level) {
      if (![ROLES.ADMIN.level, ROLES.RESELLER.level].includes(level)) {
        return NextResponse.json({ error: 'Owner can only create Admins or Resellers' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if username exists
    const existing = await query('SELECT id_users FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    // Set owner field
    let owner = currentUser.level === ROLES.MAIN.level ? username : currentUser.username;
    if (currentUser.level === ROLES.OWNER.level) {
      owner = currentUser.username;
    }

    // Set saldo: Main can assign infinite or limited, Owner assigns limited
    let assignedSaldo = saldo;
    if (currentUser.level === ROLES.MAIN.level && saldo === 'infinite') {
      assignedSaldo = 2147483647;
    } else if (!saldo) {
      assignedSaldo = 0;
    }

    // Insert user
    await query(
      `INSERT INTO users (fullname, username, password, level, saldo, status, created_at, updated_at, expiration_date, owner)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), ?, ?)` ,
      [fullname, username, password, level, assignedSaldo, expiration_date, owner]
    );

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuthRoleAndOwner(1)(createUser); // Only Main/Owner can create 