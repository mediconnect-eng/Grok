import Database from "better-sqlite3";

// Initialize SQLite database with Better Auth tables
const db = new Database("./sqlite.db");

// Core tables required by Better Auth
const createTables = () => {
  // User table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      emailVerified INTEGER DEFAULT 0,
      name TEXT,
      image TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      role TEXT DEFAULT 'patient',
      phone TEXT,
      dateOfBirth TEXT,
      address TEXT
    );
  `);

  // Session table
  db.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expiresAt INTEGER NOT NULL,
      ipAddress TEXT,
      userAgent TEXT,
      userId TEXT NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );
  `);

  // Account table (for OAuth and password auth)
  db.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      userId TEXT NOT NULL,
      accessToken TEXT,
      refreshToken TEXT,
      idToken TEXT,
      expiresAt INTEGER,
      password TEXT,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE
    );
  `);

  // Verification table
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  console.log("Database tables created successfully!");
};

createTables();
db.close();