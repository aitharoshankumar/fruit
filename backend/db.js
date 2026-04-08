const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,  // ✅ keep connections alive
  queueLimit: 0,
  connectTimeout: 10000
});

// ✅ Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ DB Connection failed:", err.message);
  } else {
    console.log("✅ DB Connected!");
    connection.release();
  }
});

module.exports = pool;