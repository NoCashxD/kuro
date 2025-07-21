import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { withAuthRoleAndOwner } from '../../../../lib/middleware.js';

async function handleEditKey(req, { params }) {
  if (req.method !== 'PUT') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const { id } = params;
    const user = req.user;
    // Only allow Dev, Owner, Admin
    if (user.level > 2) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const data = await req.json();
    // Only allow updating certain fields
    const allowedFields = ['user_key', 'game', 'duration', 'expired_date', 'max_devices'];
    const updates = [];
    const values = [];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    values.push(id);
    await query(`UPDATE keys_code SET ${updates.join(', ')} WHERE id_keys = ?`, values);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Edit key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAuthRoleAndOwner(2)(handleEditKey); 