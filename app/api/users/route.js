import { NextResponse } from 'next/server';
import { withAuthRoleAndOwner } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';
import { createUser, getUserOwnerHierarchy, logActivity, deactivateExpiredUsers } from '../../../lib/auth.js';

// Get all users (with role-based filtering)
async function getUsers(req) {
  try {
    const user = req.user;
    let sql, params;
    
    if (user.level === 0) {
      // Dev can see all users
      sql = 'SELECT * FROM users ORDER BY created_at DESC';
      params = [];
    } else if (user.level === 1) {
      // Owner can see their users and admins/resellers they created
      sql = 'SELECT * FROM users WHERE owner = ? OR uplink = ? ORDER BY created_at DESC';
      params = [user.username, user.username];
    } else if (user.level === 2) {
      // Admin can only see resellers under their owner
      sql = 'SELECT * FROM users WHERE owner = ? AND level = 3 ORDER BY created_at DESC';
      params = [user.owner];
    } else {
      // Reseller can't see any users
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const users = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id_users,
        username: user.username,
        fullname: user.fullname,
        level: user.level,
        saldo: user.saldo,
        status: user.status,
        uplink: user.uplink,
        owner: user.owner,
        expiration_date: user.expiration_date,
        created_at: user.created_at
      }))
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new user
async function createNewUser(req) {
  try {
    const body = await req.json();
    console.log('Incoming payload:', body);
    const { fullname, username, password, level, saldo, uplink, expiration_date } = body;
    const currentUser = req.user;
    console.log('Current user:', currentUser);
    
    // Validate required fields
    if (!fullname || !username || !password) {
      console.log('Validation failed:', { fullname, username, password });
      return NextResponse.json({ error: 'Fullname, username, and password are required' }, { status: 400 });
    }
    
    // Check if username already exists
    const existingUser = await query('SELECT id_users FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      console.log('Username already exists:', username);
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }
    
    // Role-based creation permissions
    let allowedLevels = [];
    if (currentUser.level === 0) {
      // Dev can create any role
      allowedLevels = [1, 2, 3];
    } else if (currentUser.level === 1) {
      // Owner can create admins and resellers
      allowedLevels = [2, 3];
    } else if (currentUser.level === 2) {
      // Admin can only create resellers
      allowedLevels = [3];
    } else {
      // Reseller can't create users
      console.log('Insufficient permissions for user:', currentUser);
     // return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.log('Allowed levels for current user:', allowedLevels);
    
    if (!allowedLevels.includes(level)) {
      console.log('Attempted to create user with disallowed level:', level);
      return NextResponse.json({ error: 'Cannot create user with this role' }, { status: 403 });
    }
    
    // Determine owner based on current user
    let owner;
    if (currentUser.level === 0) {
      // Dev creates users under their own ownership
      owner = currentUser.username;
    } else if (currentUser.level === 1) {
      // Owner creates users under their own ownership
      owner = currentUser.username;
    } else {
      // Admin creates users under their owner's hierarchy
      owner = currentUser.owner;
    }
    console.log('Owner for new user:', owner);
    
    // Set uplink to current user
    const userUplink = currentUser.username;
    
    // Create user
    const userId = await createUser({
      fullname,
      username,
      password,
      level: level || 3, // Default to reseller level
      saldo: saldo || 0,
      uplink: userUplink,
      owner,
      expiration_date
    });
    console.log('Created userId:', userId);
    
    // Log activity
    await logActivity(
      userId.toString(),
      currentUser.username,
      `Created user: ${username} with role level ${level}`,
      owner
    );
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete user
async function deleteUser(req) {
  try {
    const { userId } = await req.json();
    const currentUser = req.user;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get user to delete
    const [userToDelete] = await query('SELECT * FROM users WHERE id_users = ?', [userId]);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Role-based deletion permissions
    let canDelete = false;
    
    if (currentUser.level === 0) {
      // Dev can delete anyone
      canDelete = true;
    } else if (currentUser.level === 1) {
      // Owner can delete admins/resellers they created, but not other owners or devs
      canDelete = (userToDelete.level > 1 && (userToDelete.owner === currentUser.username || userToDelete.uplink === currentUser.username));
    } else if (currentUser.level === 2) {
      // Admin can only delete resellers under their owner
      canDelete = (userToDelete.level === 3 && userToDelete.owner === currentUser.owner);
    }
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Cannot delete this user' }, { status: 403 });
    }
    
    // Delete user
    await query('DELETE FROM users WHERE id_users = ?', [userId]);
    
    // Log activity
    await logActivity(
      userId.toString(),
      currentUser.username,
      `Deleted user: ${userToDelete.username}`,
      currentUser.owner || currentUser.username
    );
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Block owner and all sub-users/keys
async function blockOwnerHierarchy(req) {
  try {
    const { ownerUsername } = await req.json();
    const currentUser = req.user;
    if (currentUser.level !== 0) {
      return NextResponse.json({ error: 'Only Main can block an owner hierarchy' }, { status: 403 });
    }
    if (!ownerUsername) {
      return NextResponse.json({ error: 'Owner username is required' }, { status: 400 });
    }
    // Block the owner
    await query('UPDATE users SET status = 0 WHERE username = ?', [ownerUsername]);
    // Block all sub-users
    await query('UPDATE users SET status = 0 WHERE owner = ?', [ownerUsername]);
    // Block all keys belonging to the owner
    await query('UPDATE keys_code SET status = 0 WHERE owner = ?', [ownerUsername]);
    // Log activity
    await logActivity(
      ownerUsername,
      currentUser.username,
      `Blocked owner and all sub-users/keys: ${ownerUsername}`,
      ownerUsername
    );
    return NextResponse.json({ success: true, message: 'Owner and all sub-users/keys blocked.' });
  } catch (error) {
    console.error('Block owner hierarchy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Apply middleware and handle requests
const handler = async (req) => {
  if (req.method === 'GET') {
    return getUsers(req);
  } else if (req.method === 'POST') {
    return createNewUser(req);
  } else if (req.method === 'DELETE') {
    return deleteUser(req);
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
};

// Apply authentication and role-based access control
// Level 2 (Admin) and above can manage users
export const GET = withAuthRoleAndOwner(2)(handler);
export const POST = withAuthRoleAndOwner(2)(async (req, context) => {
  const url = req.nextUrl || req.url;
  if (typeof url === 'string' ? url.includes('block-hierarchy') : url.pathname.includes('block-hierarchy')) {
    return blockOwnerHierarchy(req);
  }
  if (typeof url === 'string' ? url.includes('deactivate-expired') : url.pathname.includes('deactivate-expired')) {
    await deactivateExpiredUsers();
    return NextResponse.json({ success: true, message: 'Expired users deactivated.' });
  }
  return handler(req, context);
});
export const DELETE = withAuthRoleAndOwner(2)(handler); 