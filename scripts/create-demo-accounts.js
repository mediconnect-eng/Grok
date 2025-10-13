const Database = require('better-sqlite3');
const crypto = require('crypto');

// Hash password using a simple method (Better Auth will use its own hashing)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const db = new Database('./sqlite.db');

// Create demo accounts
const accounts = [
  {
    email: 'patient@mediconnect.com',
    password: 'Patient@2024',
    name: 'Jane Doe',
  },
  {
    email: 'gp@mediconnect.com',
    password: 'GP@2024',
    name: 'Dr. Michael Chen',
  },
  {
    email: 'specialist@mediconnect.com',
    password: 'Specialist@2024',
    name: 'Dr. Sarah Johnson',
  },
  {
    email: 'pharmacy@mediconnect.com',
    password: 'Pharmacy@2024',
    name: 'MediPharm Central',
  },
  {
    email: 'diagnostics@mediconnect.com',
    password: 'Diagnostics@2024',
    name: 'MedLab Diagnostics',
  },
];

try {
  // Check if user table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user'
  `).get();

  if (!tableExists) {
    console.log('❌ User table does not exist yet.');
    console.log('💡 Start the server first (npm run dev) to create the database schema.');
    console.log('   Then run this script again.');
    process.exit(1);
  }

  console.log('📝 Creating demo accounts...\n');

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO user (id, email, emailVerified, name, image, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Note: Better Auth handles password separately in the 'account' table
  // We'll just create the user records here
  // Users will need to go through the actual signup flow to set passwords properly

  for (const account of accounts) {
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = insertStmt.run(
      userId,
      account.email,
      1, // emailVerified
      account.name,
      null, // image
      now,
      now
    );

    if (result.changes > 0) {
      console.log(`✅ Created: ${account.email} (${account.name})`);
    } else {
      console.log(`ℹ️  Already exists: ${account.email}`);
    }
  }

  console.log('\n⚠️  IMPORTANT:');
  console.log('User accounts created, but passwords are NOT set.');
  console.log('You must still SIGN UP through the web interface to set passwords.');
  console.log('\nAlternatively, use the signup pages:');
  console.log('  - http://localhost:3000/patient/signup');
  console.log('  - http://localhost:3000/auth/gp/signup');
  console.log('  - http://localhost:3000/auth/specialist/signup');
  console.log('  - http://localhost:3000/auth/pharmacy/signup');
  console.log('  - http://localhost:3000/auth/diagnostics/signup');

} catch (error) {
  console.error('❌ Error creating demo accounts:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   1. The server has been started at least once (npm run dev)');
  console.log('   2. The sqlite.db file exists');
  console.log('   3. better-sqlite3 is installed (npm install)');
} finally {
  db.close();
}
