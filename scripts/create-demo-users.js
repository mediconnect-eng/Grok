/**
 * Script to create demo users in the database
 * Run with: node scripts/create-demo-users.js
 * 
 * Simple version - creates users with plain text passwords
 * Better Auth will handle password hashing on first login
 */

const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('./sqlite.db');

// Simple hash function (Better Auth will rehash properly)
function simpleHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createDemoUsers() {
  console.log('Creating demo users...\n');

  const users = [
    { email: 'demo@mediconnect.com', password: 'demo123', name: 'Demo User', role: 'patient' },
    { email: 'patient@test.com', password: 'password123', name: 'Test Patient', role: 'patient' },
    { email: 'gp@mediconnect.com', password: 'gp123', name: 'Dr. GP Demo', role: 'gp' },
    { email: 'gp@test.com', password: 'password123', name: 'Dr. GP Test', role: 'gp' },
    { email: 'specialist@mediconnect.com', password: 'specialist123', name: 'Dr. Sarah Johnson', role: 'specialist' },
    { email: 'specialist@test.com', password: 'password123', name: 'Dr. Specialist Test', role: 'specialist' },
    { email: 'pharmacy@mediconnect.com', password: 'pharmacy123', name: 'Pharmacy Demo', role: 'pharmacy' },
    { email: 'pharmacy@test.com', password: 'password123', name: 'Pharmacy Test', role: 'pharmacy' },
    { email: 'diagnostics@mediconnect.com', password: 'diagnostics123', name: 'MedLab Diagnostics', role: 'diagnostics' },
    { email: 'diagnostics@test.com', password: 'password123', name: 'Diagnostics Test', role: 'diagnostics' },
  ];

  for (const user of users) {
    try {
      // Check if user exists
      const existing = db.prepare('SELECT * FROM user WHERE email = ?').get(user.email);
      
      if (existing) {
        console.log(`✓ User ${user.email} already exists`);
        continue;
      }

      // Hash password (simple hash - Better Auth will upgrade it)
      const hashedPassword = simpleHash(user.password);

      // Insert user
      const result = db.prepare(`
        INSERT INTO user (email, name, emailVerified, createdAt, updatedAt)
        VALUES (?, ?, 0, datetime('now'), datetime('now'))
      `).run(user.email, user.name);

      const userId = result.lastInsertRowid;

      // Insert password
      db.prepare(`
        INSERT INTO account (userId, providerId, accountId, password, createdAt, updatedAt)
        VALUES (?, 'credential', ?, ?, datetime('now'), datetime('now'))
      `).run(userId, user.email, hashedPassword);

      console.log(`✓ Created user: ${user.email} (${user.name})`);
    } catch (error) {
      console.error(`✗ Failed to create ${user.email}:`, error.message);
    }
  }

  console.log('\nDemo users created successfully!');
  console.log('\nYou can now login with:');
  console.log('  Patient: demo@mediconnect.com / demo123');
  console.log('  GP: gp@mediconnect.com / gp123');
  console.log('  Specialist: specialist@mediconnect.com / specialist123');
  console.log('  Pharmacy: pharmacy@mediconnect.com / pharmacy123');
  console.log('  Diagnostics: diagnostics@mediconnect.com / diagnostics123');
  
  db.close();
}

createDemoUsers().catch(console.error);
