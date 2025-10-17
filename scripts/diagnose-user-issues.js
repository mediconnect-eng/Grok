require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnoseUserIssues() {
  console.log('🔍 Diagnosing User Authentication Issues\n');
  console.log('============================================================\n');
  
  const testEmails = ['1234@gm.com', '1234567@gm.com', 'doctor@healthhub.com'];
  
  try {
    console.log('📊 Checking all users in database...\n');
    
    // Get all users with their roles
    const allUsers = await pool.query(`
      SELECT id, email, name, role, "emailVerified", "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
      LIMIT 20;
    `);
    
    console.log(`Found ${allUsers.rows.length} users:\n`);
    
    allUsers.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role || '❌ NO ROLE SET'}`);
      console.log(`   Name: ${user.name || '(not set)'}`);
      console.log(`   Verified: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    console.log('============================================================\n');
    console.log('🔍 Checking specific test emails...\n');
    
    for (const email of testEmails) {
      console.log(`\n📧 Checking: ${email}`);
      console.log('-----------------------------------------------------------');
      
      const userResult = await pool.query(
        'SELECT * FROM "user" WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        console.log('❌ User NOT FOUND in database');
        continue;
      }
      
      const user = userResult.rows[0];
      console.log('✅ User EXISTS');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || '(not set)'}`);
      console.log(`   Role: ${user.role || '❌ NO ROLE SET'}`);
      console.log(`   Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      
      // Check accounts (credentials)
      const accountsResult = await pool.query(
        'SELECT id, "accountId", "providerId", password FROM "account" WHERE "userId" = $1',
        [user.id]
      );
      
      console.log(`\n   Authentication Methods (${accountsResult.rows.length}):`);
      
      if (accountsResult.rows.length === 0) {
        console.log('   ❌ NO AUTHENTICATION METHOD SET!');
        console.log('   This user cannot login - no password or OAuth connection.');
      } else {
        accountsResult.rows.forEach(account => {
          console.log(`   - Provider: ${account.providerId}`);
          console.log(`     Account ID: ${account.accountId}`);
          if (account.providerId === 'credential') {
            console.log(`     Password Hash: ${account.password ? '✅ Set' : '❌ Not set'}`);
          }
        });
      }
      
      // Check sessions
      const sessionsResult = await pool.query(
        'SELECT id, "expiresAt", "ipAddress", "userAgent" FROM "session" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 3',
        [user.id]
      );
      
      console.log(`\n   Recent Sessions (${sessionsResult.rows.length}):`);
      if (sessionsResult.rows.length === 0) {
        console.log('   No login sessions found');
      } else {
        sessionsResult.rows.forEach((session, idx) => {
          const expired = new Date(session.expiresAt) < new Date();
          console.log(`   ${idx + 1}. ${expired ? '❌ Expired' : '✅ Active'} - ${session.ipAddress || 'unknown IP'}`);
        });
      }
    }
    
    console.log('\n============================================================\n');
    console.log('📊 Role Distribution:\n');
    
    const roleStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verified_count
      FROM "user"
      GROUP BY role
      ORDER BY count DESC;
    `);
    
    roleStats.rows.forEach(stat => {
      console.log(`${stat.role || '(no role)'}: ${stat.count} users (${stat.verified_count} verified)`);
    });
    
    console.log('\n============================================================\n');
    console.log('🔍 Authentication Issues Found:\n');
    
    // Find users without roles
    const noRole = await pool.query(`
      SELECT email, "createdAt"
      FROM "user"
      WHERE role IS NULL OR role = ''
      ORDER BY "createdAt" DESC
      LIMIT 5;
    `);
    
    if (noRole.rows.length > 0) {
      console.log(`❌ ${noRole.rows.length} users without roles:`);
      noRole.rows.forEach(u => console.log(`   - ${u.email}`));
      console.log('');
    }
    
    // Find users without credentials
    const noAuth = await pool.query(`
      SELECT u.email, u.role
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a."userId"
      WHERE a.id IS NULL
      LIMIT 5;
    `);
    
    if (noAuth.rows.length > 0) {
      console.log(`❌ ${noAuth.rows.length} users without authentication methods:`);
      noAuth.rows.forEach(u => console.log(`   - ${u.email} (${u.role || 'no role'})`));
      console.log('');
    }
    
    // Test password for GP account
    console.log('============================================================\n');
    console.log('🔐 Testing GP Account Password:\n');
    
    const gpUser = await pool.query(
      'SELECT id, email, role FROM "user" WHERE email = $1',
      ['doctor@healthhub.com']
    );
    
    if (gpUser.rows.length > 0) {
      const gpAccount = await pool.query(
        'SELECT password FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
        [gpUser.rows[0].id, 'credential']
      );
      
      if (gpAccount.rows.length > 0 && gpAccount.rows[0].password) {
        const testPassword = 'Doctor@2024';
        const isValid = await bcrypt.compare(testPassword, gpAccount.rows[0].password);
        console.log(`Testing password: ${testPassword}`);
        console.log(`Result: ${isValid ? '✅ PASSWORD CORRECT' : '❌ PASSWORD INCORRECT'}`);
        
        if (!isValid) {
          console.log('\n⚠️  The stored password does not match "Doctor@2024"');
          console.log('   This is why GP login is failing!');
        }
      } else {
        console.log('❌ No password found for GP account!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

diagnoseUserIssues();
