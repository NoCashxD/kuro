import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { withAuthRoleAndOwner } from '../../../../lib/middleware.js';
import { ROLES } from '../../../../roles.js';

async function transferBalance(req) {
  try {
    const currentUser = req.user;
    const data = await req.json();
    const { to_username, amount } = data;
    if (!to_username || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid transfer data' }, { status: 400 });
    }

    // Get recipient
    const users = await query('SELECT id_users, saldo, owner FROM users WHERE username = ?', [to_username]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }
    const recipient = users[0];

    // Role logic
    if (currentUser.level === ROLES.OWNER.level) {
      // Owner: no deduction, can transfer to anyone in their hierarchy
      if (recipient.owner !== currentUser.username && recipient.username !== currentUser.username) {
        return NextResponse.json({ error: 'Recipient not in your hierarchy' }, { status: 403 });
      }
      await query('UPDATE users SET saldo = saldo + ? WHERE username = ?', [amount, to_username]);
    } else if (currentUser.level === ROLES.ADMIN.level) {
      // Admin: deduction from own saldo, can only transfer to users in their hierarchy
      if (recipient.owner !== currentUser.owner && recipient.username !== currentUser.username) {
        return NextResponse.json({ error: 'Recipient not in your hierarchy' }, { status: 403 });
      }
      // Check admin's saldo
      const adminSaldo = currentUser.saldo;
      if (adminSaldo < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
      await query('UPDATE users SET saldo = saldo + ? WHERE username = ?', [amount, to_username]);
      await query('UPDATE users SET saldo = saldo - ? WHERE username = ?', [amount, currentUser.username]);
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Balance transferred successfully' });
  } catch (error) {
    console.error('Transfer balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuthRoleAndOwner(2)(transferBalance); // Only Owner/Admin can transfer 