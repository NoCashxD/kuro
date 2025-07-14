import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || "srv609.hstgr.io",
  port: process.env.DB_PORT || "3306",
  user: process.env.DB_USER || "u679703987_testk",
  password: process.env.DB_PASSWORD || "3KmBzjkoHb|",
  database: process.env.DB_NAME || "u679703987_testk",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute query with parameters
export async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

// Execute transaction
export async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Close pool (call this when shutting down the app)
export async function closePool() {
  await pool.end();
}

export default pool; 