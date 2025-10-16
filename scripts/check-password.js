// Check password hash in database
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkPassword() {
  try {
    console.log('\n🔐 CHECKING PASSWORD FOR: abcd@gm.com\n');
    console.log('='.repeat(60));

    // Get user
    const userQuery = await pool.query(
      'SELECT id, email, name FROM "user" WHERE email = $1',
      ['abcd@gm.com']
    );

    if (userQuery.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }

    const user = userQuery.rows[0];
    console.log('✅ User found:', user.email);

    // Check account table for password
    const accountQuery = await pool.query(
      `SELECT "accountId", "providerId", password FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [user.id]
    );

    if (accountQuery.rows.length === 0) {
      console.log('\n❌ NO PASSWORD FOUND!');
      console.log('   This means the account was created without a password.');
      console.log('   User needs to sign up again.');
    } else {
      const account = accountQuery.rows[0];
      console.log('\n✅ Password record exists!');
      console.log('   Provider:', account.providerId);
      console.log('   Password hash:', account.password ? account.password.substring(0, 20) + '...' : 'NULL');
      
      if (!account.password) {
        console.log('\n❌ PASSWORD IS NULL!');
        console.log('   The password field exists but is empty.');
        console.log('   This is why login fails.');
      } else {
        console.log('\n✅ Password hash exists and looks valid!');
        console.log('   Length:', account.password.length, 'characters');
        console.log('   Format:', account.password.startsWith('$') ? 'Bcrypt/Argon2' : 'Unknown');
      }
    }

    // Check all columns in account table
    const schemaQuery = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'account' ORDER BY ordinal_position`
    );

    console.log('\n📋 Account table columns:');
    schemaQuery.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

checkPassword();
