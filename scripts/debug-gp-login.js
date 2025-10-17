require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugGPLogin() {
  console.log('🔍 Debugging GP Login Issues\n');
  console.log('============================================================\n');
  
  const testEmail = 'doctor@healthhub.com';
  const testPassword = 'Doctor@2024';
  
  try {
    console.log(`Testing login for: ${testEmail}\n`);
    
    // 1. Check if user exists
    console.log('1️⃣  Checking user exists...\n');
    const userResult = await pool.query(
      'SELECT * FROM "user" WHERE email = $1',
      [testEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ USER NOT FOUND in database!\n');
      console.log('Creating GP account now...\n');
      
      const crypto = require('crypto');
      const userId = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const now = new Date().toISOString();
      
      await pool.query(`
        INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, testEmail, true, 'Dr. John Smith', 'gp', now, now]);
      
      const accountId = crypto.randomUUID();
      await pool.query(`
        INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [accountId, userId, testEmail, 'credential', hashedPassword, now, now]);
      
      console.log('✅ GP account created!\n');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}\n`);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found in database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}\n`);
    
    // 2. Check account credentials
    console.log('2️⃣  Checking account credentials...\n');
    const accountResult = await pool.query(
      'SELECT * FROM "account" WHERE "userId" = $1',
      [user.id]
    );
    
    if (accountResult.rows.length === 0) {
      console.log('❌ NO ACCOUNT/PASSWORD FOUND for this user!\n');
      console.log('This is why login fails. Creating credential now...\n');
      
      const crypto = require('crypto');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const accountId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      await pool.query(`
        INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [accountId, user.id, testEmail, 'credential', hashedPassword, now, now]);
      
      console.log('✅ Password credential created!\n');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}\n`);
      return;
    }
    
    console.log(`✅ Found ${accountResult.rows.length} account(s):\n`);
    
    for (const account of accountResult.rows) {
      console.log(`   Provider: ${account.providerId}`);
      console.log(`   Account ID: ${account.accountId}`);
      
      if (account.providerId === 'credential') {
        console.log(`   Password Hash: ${account.password ? account.password.substring(0, 30) + '...' : 'NULL'}\n`);
        
        if (!account.password) {
          console.log('❌ Password is NULL! This is why login fails.\n');
          console.log('Setting password now...\n');
          
          const hashedPassword = await bcrypt.hash(testPassword, 10);
          await pool.query(
            'UPDATE "account" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
            [hashedPassword, account.id]
          );
          
          console.log('✅ Password set!\n');
        } else {
          // Test password
          console.log('3️⃣  Testing password...\n');
          const isValid = await bcrypt.compare(testPassword, account.password);
          
          if (isValid) {
            console.log(`✅ PASSWORD IS CORRECT! "${testPassword}" matches the hash.\n`);
            console.log('⚠️  If login still fails, the issue is in the login page code, not the database.\n');
          } else {
            console.log(`❌ PASSWORD MISMATCH! "${testPassword}" does NOT match the stored hash.\n`);
            console.log('Updating password to match...\n');
            
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await pool.query(
              'UPDATE "account" SET password = $1, "updatedAt" = NOW() WHERE id = $2',
              [hashedPassword, account.id]
            );
            
            console.log('✅ Password updated!\n');
          }
        }
      }
    }
    
    // 4. Check sessions
    console.log('4️⃣  Checking recent sessions...\n');
    const sessionResult = await pool.query(
      'SELECT * FROM "session" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 3',
      [user.id]
    );
    
    if (sessionResult.rows.length === 0) {
      console.log('ℹ️  No login sessions found (never logged in successfully)\n');
    } else {
      console.log(`Found ${sessionResult.rows.length} recent sessions:\n`);
      sessionResult.rows.forEach((session, idx) => {
        const expired = new Date(session.expiresAt) < new Date();
        console.log(`${idx + 1}. ${expired ? '❌ Expired' : '✅ Active'}`);
        console.log(`   Created: ${new Date(session.createdAt).toLocaleString()}`);
        console.log(`   Expires: ${new Date(session.expiresAt).toLocaleString()}`);
        console.log(`   IP: ${session.ipAddress || 'unknown'}\n`);
      });
    }
    
    // 5. Final summary
    console.log('============================================================\n');
    console.log('📋 FINAL STATUS:\n');
    console.log('Login Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);
    console.log('Login URL:');
    console.log(`   https://www.healthhubinternational.com/gp/login\n`);
    console.log('What to check if login still fails:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Check Network tab for API response');
    console.log('   3. Try clearing browser cache/cookies');
    console.log('   4. Check if Better Auth URL is correct in .env\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

debugGPLogin();
