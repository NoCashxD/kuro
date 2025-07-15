import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import CryptoJS from 'crypto-js';

// Security constants from README
const SALT = 'XquxmymXDtWRA66D';
const CONNECT_API_STATIC = 'Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E';
const CONNECTXX_API_STATIC = 'FuckPro3qw00easdDYFShzxhHDcAhjtFEWQDQicw';
const TOKEN_SUFFIX = 'A-Dek-Kon-Aya-BATICHOD';

// Password hashing with custom salt
export async function hashPassword(password) {
  const saltedPassword = password + SALT;
  return await bcrypt.hash(saltedPassword, 12);
}

// Password verification
export async function verifyPassword(password, hashedPassword) {
  const saltedPassword = password + SALT;
  return await bcrypt.compare(saltedPassword, hashedPassword);
}

// Generate JWT token
export function generateToken(user) {
  const payload = {
    id: user.id_users,
    username: user.username,
    level: user.level,
    owner: user.owner || user.username,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
  } catch (error) {
    return null;
  }
}

// Device fingerprinting
export function generateDeviceFingerprint(userAgent) {
  return CryptoJS.SHA256(userAgent + SALT).toString();
}

// Multi-layer base64 encoding for API responses (from README)
export function encodeApiResponse(data) {
  const Result0 = JSON.stringify(data);
  const Result1 = Buffer.from(Result0).toString('base64');
  const Result2 = Buffer.from('.' + Result1).toString('base64');
  const Result3 = Buffer.from('HI> $FUcKUNLiMTAkWFIHARGyAFHHF0aD' + Result2).toString('base64');
  const Result4 = Buffer.from('USER> $FUcKUNLiMITEdkWOQLSTjGjSEYTF0aD' + Result3).toString('base64');
  const Result5 = Buffer.from('NoCashxD ==WTFSDIKiUAJrDHiDEMmXVkWFN0W' + Result4).toString('base64');
  
  return Result5;
}

// Generate unique key
export function generateUniqueKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) result += '-';
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate referral code
export function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Check user permissions
export function hasPermission(userLevel, requiredLevel) {
  // Level 1 = Owner (highest), Level 2 = Admin, Level 3 = Reseller (lowest)
  return userLevel <= requiredLevel;
}

// Get user by username
export async function getUserByUsername(username) {
  const users = await query('SELECT * FROM users WHERE username = ?', [username]);
  return users[0] || null;
}

// Get user by ID
export async function getUserById(id) {
  const users = await query('SELECT * FROM users WHERE id_users = ?', [id]);
  return users[0] || null;
}

// Create user
export async function createUser(userData) {
  const {
    fullname,
    username,
    password,
    level = 3,
    saldo = 0,
    uplink,
    owner,
    expiration_date
  } = userData;

  const hashedPassword = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (fullname, username, password, level, saldo, uplink, owner, expiration_date, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [fullname, username, hashedPassword, level, saldo, uplink, owner, expiration_date]
  );
  
  return result.insertId;
}

// Update user device info
export async function updateUserDevice(username, deviceInfo) {
  await query(
    'UPDATE users SET loginDevices = ?, updated_at = NOW() WHERE username = ?',
    [deviceInfo, username]
  );
}

// Get user's owner hierarchy
export async function getUserOwnerHierarchy(username) {
  const user = await getUserByUsername(username);
  if (!user) return null;
  
  // If user is owner (level 1), return their username as owner
  if (user.level === 1) {
    return user.username;
  }
  
  // Otherwise, return their uplink (the person who created them)
  return user.uplink;
}

// Log activity
export async function logActivity(keysId, userDo, info, owner) {
  await query(
    'INSERT INTO history (keys_id, user_do, info, owner, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [keysId, userDo, info, owner]
  );
}

// Check if user can access data (owner-based filtering)
export async function canAccessData(username, targetOwner) {
  const user = await getUserByUsername(username);
  if (!user) return false;
  
  // Owner (level 1) can access all data
  if (user.level === 1) return true;
  
  // Admin/Reseller can only access data from their owner hierarchy
  const userOwner = await getUserOwnerHierarchy(username);
  return userOwner === targetOwner;
}

// Get all data for user (with owner filtering)
export async function getDataForUser(username, table, additionalWhere = '') {
  const user = await getUserByUsername(username);
  if (!user) return [];
  
  let ownerFilter = '';
  let params = [];
  
  if (user.level === 1) {
    // Owner can see all data
    ownerFilter = '';
  } else {
    // Admin/Reseller can only see their owner's data
    const userOwner = await getUserOwnerHierarchy(username);
    ownerFilter = 'WHERE owner = ?';
    params = [userOwner];
  }
  
  if (additionalWhere) {
    ownerFilter = ownerFilter ? ownerFilter + ' AND ' + additionalWhere : 'WHERE ' + additionalWhere;
  }
  
  const sql = `SELECT * FROM ${table} ${ownerFilter} ORDER BY created_at DESC`;
  return await query(sql, params);
}

// Deactivate expired users
export async function deactivateExpiredUsers() {
  await query('UPDATE users SET status = 0 WHERE expiration_date IS NOT NULL AND expiration_date < NOW() AND status = 1');
}

export {
  SALT,
  CONNECT_API_STATIC,
  CONNECTXX_API_STATIC,
  TOKEN_SUFFIX
}; 