require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// This script targets your PRODUCTION database (Neon PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function checkAndCreateProductionGP() {
  console.log('🔍 Checking PRODUCTION Database (Neon PostgreSQL)\n');
  console.log('============================================================\n');
  
  const dbUrl = process.env.DATABASE_URL || '';
  const dbHost = dbUrl.includes('neon.tech') ? '✅ Neon (Production)' : '⚠️  Not Neon';
  console.log(`Database: ${dbHost}`);
  console.log(`Connection: ${dbUrl.substring(0, 60)}...\n`);
  
  const testGP = {
    email: 'doctor@healthhub.com',
    password: 'Doctor@2024',
    name: 'Dr. John Smith',
    role: 'gp'
  };
  
  try {
    // First, check all users to see the current state
    console.log('Checking current users in production...\n');
    
    const allUsers = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM "user"
      GROUP BY role
      ORDER BY count DESC;
    `);
    
    console.log('Current User Distribution:');
    allUsers.rows.forEach(row => {
      console.log(`  ${row.role || '(no role)'}: ${row.count}`);
    });
    console.log('');
    
    // Check if GP user exists
    const existing = await pool.query(
      'SELECT id, email, role, "emailVerified" FROM "user" WHERE email = $1',
      [testGP.email]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists in production:');
      console.log(`   Email: ${existing.rows[0].email}`);
      console.log(`   Role: ${existing.rows[0].role || '(not set)'}`);
      console.log(`   Email Verified: ${existing.rows[0].emailVerified ? 'Yes' : 'No'}`);
      console.log(`   ID: ${existing.rows[0].id}\n`);
      
      const userId = existing.rows[0].id;
      
      // Update role if not set
      if (existing.rows[0].role !== 'gp') {
        await pool.query(
          'UPDATE "user" SET role = $1 WHERE id = $2',
          ['gp', userId]
        );
        console.log('✅ Updated role to "gp"\n');
      }
      
      // Check if password/credential account exists
      const accountCheck = await pool.query(
        'SELECT id, "providerId" FROM "account" WHERE "userId" = $1',
        [userId]
      );
      
      console.log(`Found ${accountCheck.rows.length} account(s) for this user:`);
      accountCheck.rows.forEach(acc => {
        console.log(`  - Provider: ${acc.providerId}`);
      });
      console.log('');
      
      const hasCredential = accountCheck.rows.some(acc => acc.providerId === 'credential');
      
      if (!hasCredential) {
        console.log('⚠️  No password credential found. Creating...\n');
        const hashedPassword = await hashPassword(testGP.password);
        const accountId = crypto.randomUUID();
        
        await pool.query(`
          INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [accountId, userId, testGP.email, 'credential', hashedPassword]);
        
        console.log('✅ Password credential created!\n');
      } else {
        console.log('✅ Password credential already exists.\n');
        console.log('⚠️  If login still fails, the password might be incorrect.');
        console.log('    Consider updating the password...\n');
        
        // Update password
        const hashedPassword = await hashPassword(testGP.password);
        await pool.query(`
          UPDATE "account" 
          SET password = $1, "updatedAt" = NOW()
          WHERE "userId" = $2 AND "providerId" = 'credential'
        `, [hashedPassword, userId]);
        
        console.log('✅ Password updated to: Doctor@2024\n');
      }
      
      console.log('============================================================');
      console.log('\n🎉 Production GP Account Ready!\n');
      console.log('Login Credentials:');
      console.log(`   📧 Email: ${testGP.email}`);
      console.log(`   🔑 Password: ${testGP.password}`);
      console.log('\n🌐 Login URL:');
      console.log('   https://www.healthhubinternational.com/gp/login');
      console.log('\n⏱️  If using Vercel, wait 30-60 seconds for connection pool refresh.');
      console.log('   Then try logging in again.');
      return;
    }
    
    // Create new user
    console.log('Creating NEW GP user in production...\n');
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await pool.query(`
      INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, testGP.email, true, testGP.name, testGP.role, now, now]);
    
    console.log('✅ User created!\n');
    
    // Create password credential
    const hashedPassword = await hashPassword(testGP.password);
    const accountId = crypto.randomUUID();
    
    await pool.query(`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [accountId, userId, testGP.email, 'credential', hashedPassword]);
    
    console.log('✅ Password credential created!\n');
    console.log('============================================================');
    console.log('\n🎉 Production GP Account Created Successfully!\n');
    console.log('Login Credentials:');
    console.log(`   📧 Email: ${testGP.email}`);
    console.log(`   🔑 Password: ${testGP.password}`);
    console.log(`   👤 Role: ${testGP.role}`);
    console.log('\n🌐 Production Login:');
    console.log('   https://www.healthhubinternational.com/gp/login');
    console.log('\n⏱️  Wait 30-60 seconds, then try logging in.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 The database table might not exist in production.');
      console.log('   Run migrations on production first.');
    }
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

checkAndCreateProductionGP();
