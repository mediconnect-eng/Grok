require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow...\n');

  // Test credentials
  const testAccounts = [
    { email: 'doctor@healthhub.com', password: 'Doctor@2024', expectedRole: 'gp' },
    { email: '12345@gm.com', password: '12345', expectedRole: 'patient' },
    { email: '1234@gm.com', password: '1234', expectedRole: 'gp' },
  ];

  for (const testAccount of testAccounts) {
    console.log(`\n📧 Testing: ${testAccount.email}`);
    console.log('─'.repeat(50));

    try {
      // Step 1: Find user
      const userResult = await pool.query(
        'SELECT * FROM "user" WHERE email = $1',
        [testAccount.email]
      );

      if (userResult.rows.length === 0) {
        console.log('❌ User not found');
        continue;
      }

      const user = userResult.rows[0];
      console.log(`✅ User found: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.name}`);

      // Step 2: Find account
      const accountResult = await pool.query(
        'SELECT * FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
        [user.id, 'credential']
      );

      if (accountResult.rows.length === 0) {
        console.log('❌ No credential account found (might be OAuth only)');
        continue;
      }

      const account = accountResult.rows[0];
      console.log(`✅ Account found`);

      // Step 3: Get password from account
      const passwordHash = account.password;
      if (!passwordHash) {
        console.log('❌ No password hash in account');
        continue;
      }

      console.log(`   Password hash: ${passwordHash.substring(0, 20)}...`);

      // Step 4: Verify password
      const passwordMatch = await bcrypt.compare(testAccount.password, passwordHash);
      
      if (passwordMatch) {
        console.log(`✅ Password matches!`);
        
        // Step 5: Check role
        if (user.role === testAccount.expectedRole) {
          console.log(`✅ Role correct: ${user.role}`);
          console.log(`\n🎉 LOGIN WOULD SUCCEED for ${testAccount.email}`);
        } else {
          console.log(`⚠️  Role mismatch: got ${user.role}, expected ${testAccount.expectedRole}`);
        }

        // Step 6: Check for existing sessions
        const sessionResult = await pool.query(
          'SELECT * FROM "session" WHERE "userId" = $1 ORDER BY "expiresAt" DESC LIMIT 1',
          [user.id]
        );

        if (sessionResult.rows.length > 0) {
          const session = sessionResult.rows[0];
          const expiresAt = new Date(session.expiresAt);
          const now = new Date();
          
          if (expiresAt > now) {
            console.log(`   Active session exists (expires: ${expiresAt.toISOString()})`);
          } else {
            console.log(`   Last session expired: ${expiresAt.toISOString()}`);
          }
        } else {
          console.log(`   No sessions found for this user`);
        }
      } else {
        console.log(`❌ Password does not match`);
        console.log(`   Expected password: ${testAccount.password}`);
        console.log(`   Hash in DB: ${passwordHash.substring(0, 30)}...`);
      }

    } catch (error) {
      console.error('❌ Error testing account:', error.message);
    }
  }

  // Test Google OAuth account
  console.log('\n\n🔐 Google OAuth Accounts:');
  console.log('─'.repeat(50));

  try {
    const oauthResult = await pool.query(`
      SELECT u.*, a."providerId", a."accountId"
      FROM "user" u
      JOIN "account" a ON u.id = a."userId"
      WHERE a."providerId" = 'google'
    `);

    if (oauthResult.rows.length === 0) {
      console.log('No Google OAuth accounts found');
    } else {
      oauthResult.rows.forEach(row => {
        console.log(`\n✅ ${row.email}`);
        console.log(`   Role: ${row.role}`);
        console.log(`   Provider ID: ${row.providerId}`);
        console.log(`   Account ID: ${row.accountId}`);
        console.log(`   ⚠️  This account CANNOT use email/password login`);
        console.log(`   ✅ Must use "Continue with Google" button`);
      });
    }
  } catch (error) {
    console.error('Error checking OAuth accounts:', error.message);
  }

  // Check environment
  console.log('\n\n⚙️  Environment Check:');
  console.log('─'.repeat(50));
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? '✅ Set' : '❌ Not set'}`);
  console.log(`BETTER_AUTH_URL: ${process.env.BETTER_AUTH_URL || '❌ Not set'}`);
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);

  await pool.end();
}

testLoginFlow().catch(console.error);
