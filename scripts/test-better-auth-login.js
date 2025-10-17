require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testBetterAuthLogin() {
  console.log('🔐 Testing Better Auth Login Flow\n');
  console.log('============================================================\n');
  
  const testEmail = 'doctor@healthhub.com';
  const testPassword = 'Doctor@2024';
  
  try {
    // Step 1: Check user table
    console.log('STEP 1: Checking user table\n');
    const userQuery = await pool.query(
      'SELECT id, email, name, role, "emailVerified" FROM "user" WHERE email = $1',
      [testEmail]
    );
    
    if (userQuery.rows.length === 0) {
      console.log('❌ User not found!\n');
      return;
    }
    
    const user = userQuery.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}\n`);
    
    // Step 2: Check account table (Better Auth uses this for login)
    console.log('STEP 2: Checking account table (Better Auth login check)\n');
    const accountQuery = await pool.query(
      `SELECT * FROM "account" 
       WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [user.id]
    );
    
    if (accountQuery.rows.length === 0) {
      console.log('❌ NO CREDENTIAL ACCOUNT FOUND!');
      console.log('   Better Auth requires an entry in "account" table with providerId="credential"\n');
      console.log('Creating credential account now...\n');
      
      const crypto = require('crypto');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const accountId = crypto.randomUUID();
      
      await pool.query(`
        INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [accountId, user.id, testEmail, 'credential', hashedPassword]);
      
      console.log('✅ Credential account created!\n');
    } else {
      const account = accountQuery.rows[0];
      console.log('✅ Credential account found:');
      console.log(`   Account ID: ${account.id}`);
      console.log(`   User ID: ${account.userId}`);
      console.log(`   Provider: ${account.providerId}`);
      console.log(`   Password Hash: ${account.password ? account.password.substring(0, 30) + '...' : 'NULL'}\n`);
      
      if (!account.password) {
        console.log('❌ Password is NULL! Setting it now...\n');
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await pool.query(
          'UPDATE "account" SET password = $1 WHERE id = $2',
          [hashedPassword, account.id]
        );
        console.log('✅ Password set!\n');
      } else {
        // Test password
        const isValid = await bcrypt.compare(testPassword, account.password);
        console.log(`Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
        
        if (!isValid) {
          console.log('Updating to correct password...\n');
          const hashedPassword = await bcrypt.hash(testPassword, 10);
          await pool.query(
            'UPDATE "account" SET password = $1 WHERE id = $2',
            [hashedPassword, account.id]
          );
          console.log('✅ Password updated!\n');
        }
      }
    }
    
    // Step 3: Simulate Better Auth login check
    console.log('STEP 3: Simulating Better Auth login process\n');
    
    const loginCheck = await pool.query(
      `SELECT 
        u.id, u.email, u.name, u.role, u."emailVerified",
        a.password
       FROM "user" u
       JOIN "account" a ON u.id = a."userId"
       WHERE u.email = $1 
       AND a."providerId" = 'credential'`,
      [testEmail]
    );
    
    if (loginCheck.rows.length === 0) {
      console.log('❌ LOGIN WOULD FAIL: No matching user+credential found\n');
    } else {
      const loginData = loginCheck.rows[0];
      const passwordMatches = await bcrypt.compare(testPassword, loginData.password);
      
      if (passwordMatches) {
        console.log('✅ LOGIN WOULD SUCCEED!\n');
        console.log('User data that would be returned:');
        console.log(`   ID: ${loginData.id}`);
        console.log(`   Email: ${loginData.email}`);
        console.log(`   Name: ${loginData.name}`);
        console.log(`   Role: ${loginData.role}`);
        console.log(`   Email Verified: ${loginData.emailVerified}\n`);
      } else {
        console.log('❌ LOGIN WOULD FAIL: Password mismatch\n');
      }
    }
    
    // Step 4: Check all accounts for this user (debug)
    console.log('STEP 4: Checking ALL accounts for this user\n');
    const allAccounts = await pool.query(
      'SELECT * FROM "account" WHERE "userId" = $1',
      [user.id]
    );
    
    console.log(`Total accounts: ${allAccounts.rows.length}\n`);
    allAccounts.rows.forEach((acc, idx) => {
      console.log(`Account ${idx + 1}:`);
      console.log(`   Provider: ${acc.providerId}`);
      console.log(`   Account ID: ${acc.accountId}`);
      console.log(`   Has Password: ${acc.password ? 'Yes' : 'No'}\n`);
    });
    
    // Step 5: Check for duplicate accounts (common issue)
    console.log('STEP 5: Checking for duplicate credential accounts\n');
    const duplicates = await pool.query(
      `SELECT "userId", COUNT(*) as count
       FROM "account"
       WHERE "providerId" = 'credential'
       GROUP BY "userId"
       HAVING COUNT(*) > 1`
    );
    
    if (duplicates.rows.length > 0) {
      console.log('⚠️  WARNING: Found users with duplicate credential accounts:');
      for (const dup of duplicates.rows) {
        const userInfo = await pool.query('SELECT email FROM "user" WHERE id = $1', [dup.userId]);
        console.log(`   ${userInfo.rows[0]?.email}: ${dup.count} credential accounts\n`);
      }
    } else {
      console.log('✅ No duplicate credential accounts\n');
    }
    
    console.log('============================================================\n');
    console.log('📋 SUMMARY:\n');
    console.log('Login Credentials (USE THESE):');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);
    console.log('URLs:');
    console.log(`   Login: https://www.healthhubinternational.com/gp/login`);
    console.log(`   Signup: https://www.healthhubinternational.com/gp/signup\n`);
    console.log('If login still fails after this fix:');
    console.log('   1. Clear browser cache and cookies');
    console.log('   2. Try incognito/private browsing');
    console.log('   3. Check browser console for errors');
    console.log('   4. Verify BETTER_AUTH_URL in production env vars\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testBetterAuthLogin();
