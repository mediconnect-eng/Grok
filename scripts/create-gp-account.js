require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Better Auth compatible password hashing (bcrypt-like)
async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, 10);
}

async function createGPAccount() {
  console.log('🔍 Creating GP Test Account\n');
  console.log('============================================================\n');
  
  const testGP = {
    email: 'doctor@healthhub.com',
    password: 'Doctor@2024',
    name: 'Dr. John Smith',
    role: 'gp'
  };
  
  try {
    // Check if user already exists
    const existing = await pool.query(
      'SELECT id, email, role FROM "user" WHERE email = $1',
      [testGP.email]
    );
    
    if (existing.rows.length > 0) {
      console.log('⚠️  User already exists:');
      console.log(`   Email: ${existing.rows[0].email}`);
      console.log(`   Role: ${existing.rows[0].role || '(not set)'}`);
      console.log(`   ID: ${existing.rows[0].id}\n`);
      
      // Update role if not set
      if (existing.rows[0].role !== 'gp') {
        await pool.query(
          'UPDATE "user" SET role = $1 WHERE email = $2',
          ['gp', testGP.email]
        );
        console.log('✅ Updated role to "gp"\n');
      }
      
      console.log('You can now login with:');
      console.log(`   Email: ${testGP.email}`);
      console.log(`   Password: ${testGP.password}`);
      return;
    }
    
    // Create new user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    console.log('Creating new GP user...\n');
    
    await pool.query(`
      INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, testGP.email, true, testGP.name, testGP.role, now, now]);
    
    console.log('✅ User created!\n');
    
    // Create account entry with password
    const hashedPassword = await hashPassword(testGP.password);
    const accountId = crypto.randomUUID();
    
    await pool.query(`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password)
      VALUES ($1, $2, $3, $4, $5)
    `, [accountId, userId, testGP.email, 'credential', hashedPassword]);
    
    console.log('✅ Password set!\n');
    console.log('============================================================');
    console.log('\n🎉 GP Account Created Successfully!\n');
    console.log('Login Details:');
    console.log(`   Email: ${testGP.email}`);
    console.log(`   Password: ${testGP.password}`);
    console.log(`   Role: ${testGP.role}`);
    console.log('\nLogin URL:');
    console.log('   http://localhost:3000/gp/login');
    console.log('   https://www.healthhubinternational.com/gp/login');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

// Install bcryptjs if needed
try {
  require('bcryptjs');
  createGPAccount();
} catch (err) {
  console.log('❌ bcryptjs not found. Installing...\n');
  const { execSync } = require('child_process');
  execSync('npm install bcryptjs', { stdio: 'inherit' });
  console.log('\n✅ bcryptjs installed. Running script...\n');
  createGPAccount();
}
