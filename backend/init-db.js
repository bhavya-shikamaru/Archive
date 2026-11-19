const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function parseSQL(sql) {
  const lines = sql.split('\n');
  const cleaned = lines
    .map(line => {
      const commentIndex = line.indexOf('--');
      return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    })
    .join('\n');

  const statements = cleaned
    .split(/;\s*(?:\n|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return statements;
}

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    } : undefined
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'placement_db'}\`
      DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database "${process.env.DB_NAME || 'placement_db'}" created/verified`);

    await connection.changeUser({ database: process.env.DB_NAME || 'placement_db' });

    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    const statements = parseSQL(schema);
    for (const stmt of statements) {
      if (stmt.trim()) {
        await connection.query(stmt);
      }
    }
    console.log('✅ Schema applied successfully');

    const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
    const seed = fs.readFileSync(seedPath, 'utf8');
    const seedStatements = parseSQL(seed);
    for (const stmt of seedStatements) {
      if (stmt.trim()) {
        await connection.query(stmt);
      }
    }
    console.log('✅ Seed data applied successfully');

  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();