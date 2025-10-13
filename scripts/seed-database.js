const Database = require('better-sqlite3');
const crypto = require('crypto');
const { hash } = require('@node-rs/argon2');
const path = require('path');

// Check if production mode
const isProductionMode = process.env.PRODUCTION_MODE === 'true';

if (isProductionMode) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   ❌ SEEDING DISABLED IN PRODUCTION MODE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.error('Demo account seeding is not allowed in production.');
  console.error('Set PRODUCTION_MODE=false in .env.local to enable seeding.\n');
  process.exit(1);
}

// Database path
const dbPath = path.join(process.cwd(), 'sqlite.db');

console.log('═══════════════════════════════════════════════════════════');
console.log('   🌱 MEDICONNECT DATABASE SEEDING SCRIPT');
console.log('═══════════════════════════════════════════════════════════\n');

async function seedDatabase() {
  let db;
  
  try {
    db = new Database(dbPath);
    console.log('✅ Connected to database:', dbPath);
    
    // Check if tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    console.log('📋 Existing tables:', tables.map(t => t.name).join(', ') || 'None');
    
    if (tables.length === 0) {
      console.log('\n❌ Database schema not initialized!');
      console.log('💡 Please start the server first (npm run dev) to create tables.');
      console.log('   Then run this seed script again.\n');
      process.exit(1);
    }
    
    // Define demo accounts with secure random passwords
    // IMPORTANT: Store these passwords securely after seeding!
    const generateSecurePassword = () => {
      // Generate a secure 16-character password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      const array = new Uint8Array(16);
      crypto.webcrypto.getRandomValues(array);
      
      // Ensure password has mix of character types
      password += 'A'; // Uppercase
      password += 'a'; // Lowercase
      password += '0'; // Number
      password += '!'; // Special
      
      // Fill remaining characters randomly
      for (let i = 4; i < 16; i++) {
        password += chars[array[i] % chars.length];
      }
      
      // Shuffle password
      return password.split('').sort(() => 0.5 - Math.random()).join('');
    };
    
    const accounts = [
      {
        email: 'patient@mediconnect.com',
        password: generateSecurePassword(),
        name: 'Jane Doe',
        role: 'patient'
      },
      {
        email: 'gp@mediconnect.com',
        password: generateSecurePassword(),
        name: 'Dr. Michael Chen',
        role: 'gp'
      },
      {
        email: 'specialist@mediconnect.com',
        password: generateSecurePassword(),
        name: 'Dr. Sarah Johnson',
        role: 'specialist'
      },
      {
        email: 'pharmacy@mediconnect.com',
        password: generateSecurePassword(),
        name: 'MediPharm Central',
        role: 'pharmacy'
      },
      {
        email: 'diagnostics@mediconnect.com',
        password: generateSecurePassword(),
        name: 'MedLab Diagnostics',
        role: 'diagnostics'
      }
    ];
    
    console.log('\n🔐 Creating user accounts...\n');
    
    // Check if user table exists
    const userTableInfo = db.prepare(`
      PRAGMA table_info(user)
    `).all();
    
    if (userTableInfo.length === 0) {
      console.log('❌ User table does not exist!');
      process.exit(1);
    }
    
    console.log('📊 User table columns:', userTableInfo.map(c => c.name).join(', '));
    
    // Create accounts
    for (const account of accounts) {
      try {
        const userId = crypto.randomUUID();
        const now = Date.now();
        
        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM user WHERE email = ?').get(account.email);
        
        if (existingUser) {
          console.log(`ℹ️  User already exists: ${account.email} (${account.name})`);
          continue;
        }
        
        // Insert user
        const insertUser = db.prepare(`
          INSERT INTO user (id, email, emailVerified, name, image, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertUser.run(
          userId,
          account.email,
          1, // emailVerified
          account.name,
          null, // image
          now,
          now
        );
        
        // Hash password using Better Auth's method
        const hashedPassword = await hash(account.password, {
          memoryCost: 19456,
          timeCost: 2,
          outputLen: 32,
          parallelism: 1,
        });
        
        // Check if account table exists
        const accountTableInfo = db.prepare(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='account'
        `).get();
        
        if (accountTableInfo) {
          // Insert account with hashed password
          const insertAccount = db.prepare(`
            INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          const accountId = crypto.randomUUID();
          insertAccount.run(
            accountId,
            userId,
            account.email, // accountId = email for email/password provider
            'credential', // providerId for email/password
            hashedPassword,
            now,
            now
          );
        }
        
        console.log(`✅ Created: ${account.email} (${account.name})`);
        
      } catch (err) {
        console.error(`❌ Error creating ${account.email}:`, err.message);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   ✅ DATABASE SEEDING COMPLETED!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📧 Demo Accounts Created:\n');
    console.log('⚠️  IMPORTANT: Save these credentials securely!\n');
    accounts.forEach(acc => {
      console.log(`   ${acc.role.toUpperCase().padEnd(12)} → ${acc.email}`);
      console.log(`                      Password: ${acc.password}\n`);
    });
    
    console.log('🔒 These passwords are randomly generated and secure.');
    console.log('   Copy them now - they will not be shown again!');
    console.log('\n🚀 Ready to use! Start the server and login with these credentials.');
    console.log('   Server: npm run dev');
    console.log('   Login:  http://localhost:3000\n');
    
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
      console.log('✅ Database connection closed\n');
    }
  }
}

// Run the seeding
seedDatabase().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
