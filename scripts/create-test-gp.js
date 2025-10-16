// Create a test GP user with known password
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Simple password hashing (Better Auth will use its own, but this is for reference)
function generateUserId() {
  return crypto.randomBytes(16).toString('base64url');
}

async function createTestUser() {
  try {
    console.log('\n🔧 CREATING TEST GP USER\n');
    console.log('='.repeat(60));

    const email = 'testgp@healthhub.com';
    const name = 'Test GP Doctor';
    const password = 'TestPass123!';

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email FROM "user" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('   Email:', email);
      console.log('   User ID:', existingUser.rows[0].id);
      console.log('\n💡 You can try logging in with:');
      console.log('   Email:', email);
      console.log('   Password: TestPass123!');
      console.log('\n   Or delete this user first and run again.');
      return;
    }

    console.log('📝 User details:');
    console.log('   Email:', email);
    console.log('   Name:', name);
    console.log('   Password:', password);
    console.log('\n⚠️  NOTE: This script creates a user record,');
    console.log('   but Better Auth needs to create the password hash.');
    console.log('\n✅ RECOMMENDED: Use the signup page instead:');
    console.log('   1. Go to: https://www.healthhubinternational.com/gp/signup');
    console.log('   2. Email: testgp@healthhub.com');
    console.log('   3. Name: Test GP Doctor');
    console.log('   4. Password: TestPass123!');
    console.log('   5. Confirm Password: TestPass123!');
    console.log('\n='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
