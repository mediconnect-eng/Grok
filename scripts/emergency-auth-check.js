require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function emergencyAuthCheck() {
  console.log('🚨 EMERGENCY AUTH CHECK\n');
  console.log('============================================================\n');
  
  try {
    // 1. Check database connection
    console.log('1️⃣  Testing database connection...\n');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection OK\n');
    
    // 2. Check all user accounts
    console.log('2️⃣  Checking ALL user accounts...\n');
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u."emailVerified",
             (SELECT COUNT(*) FROM "account" WHERE "userId" = u.id) as account_count
      FROM "user" u
      ORDER BY u."createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`Found ${usersResult.rows.length} recent users:\n`);
    usersResult.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Role: ${user.role || 'NO ROLE'}`);
      console.log(`   Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Accounts: ${user.account_count}`);
      console.log('');
    });
    
    // 3. Check patient accounts specifically
    console.log('3️⃣  Checking PATIENT accounts with credentials...\n');
    const patientsResult = await pool.query(`
      SELECT u.email, u.role, a.password IS NOT NULL as has_password
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a."userId" AND a."providerId" = 'credential'
      WHERE u.role = 'patient'
      LIMIT 5
    `);
    
    if (patientsResult.rows.length === 0) {
      console.log('❌ NO PATIENT ACCOUNTS FOUND!\n');
    } else {
      console.log('Patient accounts:\n');
      patientsResult.rows.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.email}`);
        console.log(`   Has Password: ${p.has_password ? 'Yes' : 'NO - BROKEN!'}`);
        console.log('');
      });
    }
    
    // 4. Check for accounts without passwords
    console.log('4️⃣  Checking for BROKEN accounts (no password)...\n');
    const brokenResult = await pool.query(`
      SELECT u.email, u.role, u.id
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a."userId" AND a."providerId" = 'credential'
      WHERE a.password IS NULL OR a.id IS NULL
      LIMIT 10
    `);
    
    if (brokenResult.rows.length > 0) {
      console.log(`❌ FOUND ${brokenResult.rows.length} BROKEN ACCOUNTS:\n`);
      brokenResult.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email} (${user.role})`);
        console.log(`   User ID: ${user.id}`);
        console.log('   Issue: No password credential\n');
      });
    } else {
      console.log('✅ All accounts have passwords\n');
    }
    
    // 5. Check Google OAuth accounts
    console.log('5️⃣  Checking Google OAuth accounts...\n');
    const oauthResult = await pool.query(`
      SELECT u.email, u.role
      FROM "user" u
      JOIN "account" a ON u.id = a."userId"
      WHERE a."providerId" = 'google'
      LIMIT 5
    `);
    
    if (oauthResult.rows.length === 0) {
      console.log('ℹ️  No Google OAuth accounts found\n');
    } else {
      console.log(`Found ${oauthResult.rows.length} Google OAuth accounts:\n`);
      oauthResult.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.email} (${user.role})`);
      });
      console.log('');
    }
    
    // 6. Test a specific patient account
    console.log('6️⃣  Testing specific patient account...\n');
    const testEmail = '1234@gm.com';
    const testResult = await pool.query(`
      SELECT u.*, a.password
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a."userId" AND a."providerId" = 'credential'
      WHERE u.email = $1
    `, [testEmail]);
    
    if (testResult.rows.length === 0) {
      console.log(`❌ Account ${testEmail} not found\n`);
    } else {
      const user = testResult.rows[0];
      console.log(`✅ Found account: ${testEmail}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'NO - BROKEN!'}`);
      console.log('');
    }
    
    // 7. Check Better Auth tables
    console.log('7️⃣  Checking Better Auth tables...\n');
    const tables = ['user', 'account', 'session', 'verification'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT COUNT(*) FROM "${table}"
      `);
      console.log(`   ${table}: ${result.rows[0].count} records`);
    }
    console.log('');
    
    console.log('============================================================\n');
    console.log('🔧 WORKING TEST ACCOUNTS:\n');
    
    const workingAccounts = await pool.query(`
      SELECT u.email, u.role
      FROM "user" u
      JOIN "account" a ON u.id = a."userId"
      WHERE a."providerId" = 'credential' AND a.password IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT 5
    `);
    
    if (workingAccounts.rows.length === 0) {
      console.log('❌ NO WORKING ACCOUNTS FOUND!\n');
    } else {
      console.log('These accounts should work:\n');
      workingAccounts.rows.forEach((acc, idx) => {
        console.log(`${idx + 1}. ${acc.email} (${acc.role})`);
      });
      console.log('\nNote: You need to know the password you used when creating them.\n');
    }
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

emergencyAuthCheck();
