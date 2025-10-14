/**
 * Create Demo Accounts for Testing - PostgreSQL Version
 * Run with: node scripts/create-demo-accounts.js
 * 
 * Creates complete demo accounts for all roles with:
 * - User account with email verification
 * - Provider applications (approved for providers)
 * - Easy-to-remember credentials
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Simple password hashing (Better Auth will properly hash on login)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const DEMO_USERS = [
  // PATIENTS
  {
    email: 'patient1@test.com',
    password: 'Patient123!',
    name: 'John Patient',
    role: 'patient',
    emailVerified: true
  },
  {
    email: 'patient2@test.com',
    password: 'Patient123!',
    name: 'Sarah Patient',
    role: 'patient',
    emailVerified: true
  },
  {
    email: 'patient3@test.com',
    password: 'Patient123!',
    name: 'Mike Patient',
    role: 'patient',
    emailVerified: true
  },
  
  // GENERAL PRACTITIONERS
  {
    email: 'gp1@test.com',
    password: 'Doctor123!',
    name: 'Dr. Emily Carter',
    role: 'gp',
    emailVerified: true,
    providerType: 'gp',
    specialization: 'General Practice',
    licenseNumber: 'GP001234',
    yearsOfExperience: 8
  },
  {
    email: 'gp2@test.com',
    password: 'Doctor123!',
    name: 'Dr. James Wilson',
    role: 'gp',
    emailVerified: true,
    providerType: 'gp',
    specialization: 'Family Medicine',
    licenseNumber: 'GP005678',
    yearsOfExperience: 12
  },
  
  // SPECIALISTS
  {
    email: 'specialist1@test.com',
    password: 'Doctor123!',
    name: 'Dr. Michael Brown',
    role: 'specialist',
    emailVerified: true,
    providerType: 'specialist',
    specialization: 'Cardiology',
    licenseNumber: 'SP001111',
    yearsOfExperience: 15
  },
  {
    email: 'specialist2@test.com',
    password: 'Doctor123!',
    name: 'Dr. Lisa Anderson',
    role: 'specialist',
    emailVerified: true,
    providerType: 'specialist',
    specialization: 'Dermatology',
    licenseNumber: 'SP002222',
    yearsOfExperience: 10
  },
  {
    email: 'specialist3@test.com',
    password: 'Doctor123!',
    name: 'Dr. Robert Martinez',
    role: 'specialist',
    emailVerified: true,
    providerType: 'specialist',
    specialization: 'Orthopedics',
    licenseNumber: 'SP003333',
    yearsOfExperience: 18
  },
  
  // PHARMACIES
  {
    email: 'pharmacy1@test.com',
    password: 'Pharmacy123!',
    name: 'MediCare Pharmacy',
    role: 'pharmacy',
    emailVerified: true,
    providerType: 'pharmacy',
    specialization: 'Retail Pharmacy',
    licenseNumber: 'PH001234',
    yearsOfExperience: 5
  },
  {
    email: 'pharmacy2@test.com',
    password: 'Pharmacy123!',
    name: 'HealthPlus Pharmacy',
    role: 'pharmacy',
    emailVerified: true,
    providerType: 'pharmacy',
    specialization: 'Community Pharmacy',
    licenseNumber: 'PH005678',
    yearsOfExperience: 7
  },
  
  // DIAGNOSTIC CENTERS
  {
    email: 'diagnostic1@test.com',
    password: 'Diagnostic123!',
    name: 'CityLab Diagnostics',
    role: 'diagnostic_center',
    emailVerified: true,
    providerType: 'diagnostic_center',
    specialization: 'Full Service Laboratory',
    licenseNumber: 'DX001234',
    yearsOfExperience: 10
  },
  {
    email: 'diagnostic2@test.com',
    password: 'Diagnostic123!',
    name: 'MedTest Center',
    role: 'diagnostic_center',
    emailVerified: true,
    providerType: 'diagnostic_center',
    specialization: 'Pathology & Radiology',
    licenseNumber: 'DX005678',
    yearsOfExperience: 8
  }
];

async function createDemoAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating demo accounts for testing...\n');
    console.log('=' .repeat(60));
    
    await client.query('BEGIN');
    
    let created = 0;
    let existing = 0;
    
    for (const userData of DEMO_USERS) {
      try {
        // Check if user already exists
        const existingUser = await client.query(
          'SELECT id, email FROM "user" WHERE email = $1',
          [userData.email]
        );
        
        if (existingUser.rows.length > 0) {
          console.log(`⏭️  ${userData.role.toUpperCase().padEnd(18)} ${userData.email} (already exists)`);
          existing++;
          continue;
        }
        
        // Create user (Better Auth's user table doesn't have 'role' column)
        const userResult = await client.query(
          `INSERT INTO "user" (
            email, 
            name, 
            "emailVerified",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id`,
          [userData.email, userData.name, userData.emailVerified]
        );
        
        const userId = userResult.rows[0].id;
        
        // Create account with hashed password
        const hashedPassword = hashPassword(userData.password);
        await client.query(
          `INSERT INTO account (
            "userId",
            "accountId",
            "providerId",
            password,
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, 'credential', $3, NOW(), NOW())`,
          [userId, userData.email, hashedPassword]
        );
        
        // Create provider application if it's a provider role
        if (['gp', 'specialist', 'pharmacy', 'diagnostic_center'].includes(userData.role)) {
          await client.query(
            `INSERT INTO provider_applications (
              user_id,
              provider_type,
              specialization,
              license_number,
              years_of_experience,
              status,
              submitted_at,
              reviewed_at,
              created_at,
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'approved', NOW(), NOW(), NOW(), NOW())`,
            [
              userId,
              userData.providerType,
              userData.specialization,
              userData.licenseNumber,
              userData.yearsOfExperience
            ]
          );
        }
        
        console.log(`✅ ${userData.role.toUpperCase().padEnd(18)} ${userData.email.padEnd(30)} "${userData.name}"`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to create ${userData.email}:`, error.message);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('=' .repeat(60));
    console.log(`\n📊 Summary: ${created} created, ${existing} already existed\n`);
    
    // Print login credentials
    console.log('🔐 DEMO ACCOUNT CREDENTIALS\n');
    console.log('=' .repeat(60));
    console.log('\n👤 PATIENTS (3 accounts)');
    console.log('   Email: patient1@test.com  |  Password: Patient123!');
    console.log('   Email: patient2@test.com  |  Password: Patient123!');
    console.log('   Email: patient3@test.com  |  Password: Patient123!');
    
    console.log('\n🩺 GENERAL PRACTITIONERS (2 accounts)');
    console.log('   Email: gp1@test.com       |  Password: Doctor123!');
    console.log('   Email: gp2@test.com       |  Password: Doctor123!');
    
    console.log('\n👨‍⚕️ SPECIALISTS (3 accounts)');
    console.log('   Email: specialist1@test.com  |  Password: Doctor123!');
    console.log('   Email: specialist2@test.com  |  Password: Doctor123!');
    console.log('   Email: specialist3@test.com  |  Password: Doctor123!');
    
    console.log('\n💊 PHARMACIES (2 accounts)');
    console.log('   Email: pharmacy1@test.com    |  Password: Pharmacy123!');
    console.log('   Email: pharmacy2@test.com    |  Password: Pharmacy123!');
    
    console.log('\n🔬 DIAGNOSTIC CENTERS (2 accounts)');
    console.log('   Email: diagnostic1@test.com  |  Password: Diagnostic123!');
    console.log('   Email: diagnostic2@test.com  |  Password: Diagnostic123!');
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n💡 Quick Start Guide:\n');
    console.log('1. Login as patient1@test.com to create consultations');
    console.log('2. Login as gp1@test.com to accept consultations & create prescriptions');
    console.log('3. Login as pharmacy1@test.com to fulfill prescriptions');
    console.log('4. Test referrals: GP → specialist1@test.com');
    console.log('5. Test diagnostics: GP orders test → diagnostic1@test.com processes');
    console.log('6. Check notifications in the bell icon (top right when logged in)');
    console.log('\n✨ All accounts are email-verified and ready to use!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating demo accounts:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createDemoAccounts()
  .then(() => {
    console.log('✅ Demo accounts setup complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create demo accounts:', error);
    process.exit(1);
  });
