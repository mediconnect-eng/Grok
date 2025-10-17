require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    console.log('\n🔍 Checking user database...\n');
    
    // Check if user table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user'
      );
    `);
    console.log('User table exists:', tableCheck.rows[0].exists);
    
    // Check for specific users
    const user1 = await pool.query('SELECT id, email, name, role, "emailVerified" FROM "user" WHERE email = $1', ['1234@gm.com']);
    console.log('\nUser 1234@gm.com:', user1.rows.length > 0 ? user1.rows[0] : 'NOT FOUND');
    
    const user2 = await pool.query('SELECT id, email, name, role, "emailVerified" FROM "user" WHERE email = $1', ['12345@gm.com']);
    console.log('User 12345@gm.com:', user2.rows.length > 0 ? user2.rows[0] : 'NOT FOUND');
    
    // Check all users
    const allUsers = await pool.query('SELECT id, email, name, role, "emailVerified" FROM "user" LIMIT 10');
    console.log('\nAll users in database:', allUsers.rows.length);
    allUsers.rows.forEach(u => console.log(`  - ${u.email} (${u.role || 'no role'})`));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUser();
