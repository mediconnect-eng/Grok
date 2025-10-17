require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function changeUserRole() {
  const email = '1234@gm.com';
  const newRole = 'gp';
  
  console.log('🔧 Changing User Role\n');
  console.log('============================================================\n');
  console.log(`Email: ${email}`);
  console.log(`New Role: ${newRole}\n`);
  
  try {
    // Get current user info
    const userResult = await pool.query(
      'SELECT id, email, name, role FROM "user" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Current user info:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Current Role: ${user.role}\n`);
    
    // Update role
    await pool.query(
      'UPDATE "user" SET role = $1, "updatedAt" = NOW() WHERE email = $2',
      [newRole, email]
    );
    
    console.log('✅ Role updated successfully!\n');
    console.log('New user info:');
    console.log(`  Email: ${email}`);
    console.log(`  Role: ${newRole}`);
    console.log('\nYou can now login at:');
    console.log('  https://www.healthhubinternational.com/gp/login');
    console.log('\nWith your existing password.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

changeUserRole();
