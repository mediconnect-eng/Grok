require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkGPUsers() {
  console.log('🔍 Checking GP Users in Database\n');
  console.log('============================================================\n');
  
  try {
    // Check if user table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ User table does not exist!');
      return;
    }
    
    console.log('✅ User table exists\n');
    
    // Get all GP users
    const gpUsers = await pool.query(`
      SELECT id, email, name, role, "emailVerified", "createdAt"
      FROM "user"
      WHERE role = 'gp' OR role = 'provider'
      ORDER BY "createdAt" DESC;
    `);
    
    console.log(`Found ${gpUsers.rows.length} GP/Provider users:\n`);
    
    if (gpUsers.rows.length === 0) {
      console.log('⚠️  NO GP USERS FOUND!');
      console.log('This is likely why login fails - there are no GP accounts to log into.\n');
    } else {
      gpUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Name: ${user.name || '(not set)'}`);
        console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }
    
    // Check all users to see their roles
    const allUsers = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM "user"
      GROUP BY role
      ORDER BY count DESC;
    `);
    
    console.log('User Distribution by Role:');
    allUsers.rows.forEach(row => {
      console.log(`  ${row.role || '(no role)'}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

checkGPUsers();
