/**
 * Create Admin User Script
 * 
 * Creates an admin user in the database for accessing the admin dashboard.
 * Run this script once to set up your initial admin account.
 * 
 * Usage: node scripts/create-admin-user.js
 */

const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function createAdminUser() {
  const client = await pool.connect();

  try {
    console.log('🔧 Creating admin user...\n');

    // Admin credentials
    const adminEmail = 'admin@mediconnect.com';
    const adminName = 'System Administrator';
    const adminId = crypto.randomUUID();

    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT id, email, role FROM "user" WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      const existing = existingAdmin.rows[0];
      
      if (existing.role === 'admin') {
        console.log('✅ Admin user already exists');
        console.log(`   Email: ${existing.email}`);
        console.log(`   ID: ${existing.id}`);
        console.log('\n⚠️  To set/reset password, use the Better Auth password reset flow');
        return;
      } else {
        // Update existing user to admin
        await client.query(
          'UPDATE "user" SET role = $1 WHERE id = $2',
          ['admin', existing.id]
        );
        console.log('✅ Updated existing user to admin role');
        console.log(`   Email: ${existing.email}`);
        console.log(`   ID: ${existing.id}`);
        return;
      }
    }

    // Create new admin user
    // Note: Better Auth handles password hashing, so we create the user
    // and they need to set password through the signup/reset flow
    await client.query(
      `INSERT INTO "user" (
        id, email, name, role, "emailVerified", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, 'admin', true, NOW(), NOW())`,
      [adminId, adminEmail, adminName]
    );

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email: admin@mediconnect.com');
    console.log('🆔 ID:', adminId);
    console.log('\n⚠️  IMPORTANT: Set admin password');
    console.log('   1. Go to: http://localhost:3000/auth/signup');
    console.log('   2. Sign up with email: admin@mediconnect.com');
    console.log('   3. Set a strong password (min 12 chars, upper, lower, number, special)');
    console.log('   4. Or use password reset flow if you prefer\n');
    console.log('🔐 Then login at: http://localhost:3000/admin/login\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Alternative: Create admin from existing user by email
async function promoteToAdmin(email) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      'UPDATE "user" SET role = $1 WHERE email = $2 RETURNING id, email, name, role',
      ['admin', email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ User not found with email: ${email}`);
      return;
    }

    const user = result.rows[0];
    console.log('✅ User promoted to admin:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`\n🔐 Login at: http://localhost:3000/admin/login\n`);

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === '--promote') {
  // Promote existing user
  const email = args[1];
  if (!email) {
    console.error('❌ Error: Please provide email address');
    console.log('Usage: node scripts/create-admin-user.js --promote user@example.com');
    process.exit(1);
  }
  promoteToAdmin(email);
} else {
  // Create default admin
  createAdminUser();
}
