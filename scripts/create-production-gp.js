require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Use production DATABASE_URL from .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function createProductionGP() {
  console.log('🔍 Creating GP Account in PRODUCTION Database\n');
  console.log('============================================================\n');
  console.log('Database:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');
  
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
      console.log('⚠️  User already exists in production:');
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
      
      // Check if account exists
      const accountCheck = await pool.query(
        'SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = $2',
        [existing.rows[0].id, 'credential']
      );
      
      if (accountCheck.rows.length === 0) {
        console.log('⚠️  No password set for this user. Creating credential account...\n');
        const hashedPassword = await hashPassword(testGP.password);
        const accountId = crypto.randomUUID();
        
        await pool.query(`
          INSERT INTO "account" (id, "userId", "accountId", "providerId", password)
          VALUES ($1, $2, $3, $4, $5)
        `, [accountId, existing.rows[0].id, testGP.email, 'credential', hashedPassword]);
        
        console.log('✅ Password created!\n');
      }
      
      console.log('============================================================');
      console.log('\n🎉 Production GP Account Ready!\n');
      console.log('Login Details:');
      console.log(`   Email: ${testGP.email}`);
      console.log(`   Password: ${testGP.password}`);
      console.log('\nProduction Login URL:');
      console.log('   https://www.healthhubinternational.com/gp/login');
      return;
    }
    
    // Create new user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    console.log('Creating new GP user in production...\n');
    
    await pool.query(`
      INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, testGP.email, true, testGP.name, testGP.role, now, now]);
    
    console.log('✅ User created in production!\n');
    
    // Create account entry with password
    const hashedPassword = await hashPassword(testGP.password);
    const accountId = crypto.randomUUID();
    
    await pool.query(`
      INSERT INTO "account" (id, "userId", "accountId", "providerId", password)
      VALUES ($1, $2, $3, $4, $5)
    `, [accountId, userId, testGP.email, 'credential', hashedPassword]);
    
    console.log('✅ Password set in production!\n');
    console.log('============================================================');
    console.log('\n🎉 Production GP Account Created Successfully!\n');
    console.log('Login Details:');
    console.log(`   Email: ${testGP.email}`);
    console.log(`   Password: ${testGP.password}`);
    console.log(`   Role: ${testGP.role}`);
    console.log('\nProduction Login URL:');
    console.log('   https://www.healthhubinternational.com/gp/login');
    console.log('\n⏱️  Wait 1-2 minutes for the database connection to refresh on Vercel.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
  
  console.log('\n============================================================');
}

createProductionGP();
