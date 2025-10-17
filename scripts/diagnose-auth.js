require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function diagnoseSyste() {
  console.log('🔍 AUTHENTICATION SYSTEM DIAGNOSIS\n');
  console.log('============================================================\n');
  
  try {
    // 1. Check all users with their roles
    console.log('📊 ALL USERS IN DATABASE:\n');
    const allUsers = await pool.query(`
      SELECT id, email, name, role, "emailVerified", "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
      LIMIT 20;
    `);
    
    allUsers.rows.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   Role: ${user.role || '(NO ROLE SET)'}`);
      console.log(`   Name: ${user.name || '(no name)'}`);
      console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    // 2. Check GP users specifically
    console.log('============================================================');
    console.log('\n👨‍⚕️ GP USERS ONLY:\n');
    const gpUsers = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, a."providerId", a.password IS NOT NULL as has_password
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a."userId" AND a."providerId" = 'credential'
      WHERE u.role = 'gp' OR u.role = 'provider'
      ORDER BY u."createdAt" DESC;
    `);
    
    if (gpUsers.rows.length === 0) {
      console.log('❌ NO GP USERS FOUND!\n');
    } else {
      gpUsers.rows.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Has Password: ${user.has_password ? '✅ YES' : '❌ NO'}`);
        console.log(`   Provider: ${user.providerId || '(none)'}`);
        console.log('');
      });
    }
    
    // 3. Check the specific doctor@healthhub.com account
    console.log('============================================================');
    console.log('\n🔍 CHECKING doctor@healthhub.com:\n');
    
    const doctorUser = await pool.query(`
      SELECT * FROM "user" WHERE email = 'doctor@healthhub.com';
    `);
    
    if (doctorUser.rows.length === 0) {
      console.log('❌ doctor@healthhub.com NOT FOUND in user table!\n');
    } else {
      const user = doctorUser.rows[0];
      console.log('User Details:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role || '❌ NO ROLE'}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   ID: ${user.id}\n`);
      
      // Check accounts for this user
      const accounts = await pool.query(`
        SELECT id, "providerId", "accountId", password IS NOT NULL as has_password, "createdAt"
        FROM "account"
        WHERE "userId" = $1;
      `, [user.id]);
      
      console.log(`Account Providers (${accounts.rows.length}):`);
      if (accounts.rows.length === 0) {
        console.log('   ❌ NO ACCOUNTS FOUND - User cannot login!\n');
      } else {
        accounts.rows.forEach(acc => {
          console.log(`   - ${acc.providerId}: ${acc.has_password ? '✅ Has Password' : '⚠️ No Password'}`);
          console.log(`     Account ID: ${acc.accountId}`);
          console.log(`     Created: ${acc.createdAt}`);
        });
        console.log('');
      }
    }
    
    // 4. Check for duplicate emails or test accounts
    console.log('============================================================');
    console.log('\n🔍 CHECKING FOR TEST ACCOUNTS:\n');
    
    const testEmails = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM "user"
      WHERE email LIKE '%test%' OR email LIKE '%demo%' OR email LIKE '%example%'
      GROUP BY email
      HAVING COUNT(*) > 0;
    `);
    
    if (testEmails.rows.length > 0) {
      console.log('Test/Demo accounts found:');
      testEmails.rows.forEach(row => {
        console.log(`   ${row.email} (${row.count}x)`);
      });
      console.log('');
    } else {
      console.log('No test accounts found.\n');
    }
    
    // 5. Check for duplicate emails
    console.log('============================================================');
    console.log('\n🔍 CHECKING FOR DUPLICATE EMAILS:\n');
    
    const duplicates = await pool.query(`
      SELECT email, COUNT(*) as count
      FROM "user"
      GROUP BY email
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('⚠️  DUPLICATE EMAILS FOUND:');
      duplicates.rows.forEach(row => {
        console.log(`   ${row.email}: ${row.count} accounts`);
      });
      console.log('');
    } else {
      console.log('✅ No duplicate emails.\n');
    }
    
    // 6. Role distribution
    console.log('============================================================');
    console.log('\n📊 USER ROLE DISTRIBUTION:\n');
    
    const roleStats = await pool.query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN "emailVerified" = true THEN 1 END) as verified_count
      FROM "user"
      GROUP BY role
      ORDER BY count DESC;
    `);
    
    roleStats.rows.forEach(row => {
      console.log(`   ${row.role || '(no role)'}: ${row.count} total, ${row.verified_count} verified`);
    });
    
    // 7. Recent signups
    console.log('\n============================================================');
    console.log('\n📅 RECENT SIGNUPS (Last 10):\n');
    
    const recent = await pool.query(`
      SELECT email, role, "emailVerified", "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
      LIMIT 10;
    `);
    
    recent.rows.forEach((user, i) => {
      const date = new Date(user.createdAt).toLocaleString();
      console.log(`${i + 1}. ${user.email} (${user.role || 'no role'}) - ${date}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

diagnoseSyste();
