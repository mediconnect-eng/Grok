require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testConsultationFlow() {
  console.log('🧪 Testing Consultation Flow End-to-End\n');
  console.log('============================================================\n');
  
  try {
    // 1. Find a patient account
    console.log('1️⃣  Finding patient account...\n');
    const patientQuery = await pool.query(`
      SELECT id, email, name, role
      FROM "user"
      WHERE role = 'patient'
      LIMIT 1
    `);
    
    if (patientQuery.rows.length === 0) {
      console.log('❌ No patient account found!');
      return;
    }
    
    const patient = patientQuery.rows[0];
    console.log(`✅ Found patient: ${patient.email} (${patient.name})`);
    console.log(`   Patient ID: ${patient.id}\n`);
    
    // 2. Find a GP account
    console.log('2️⃣  Finding GP account...\n');
    const gpQuery = await pool.query(`
      SELECT id, email, name, role
      FROM "user"
      WHERE role = 'gp'
      LIMIT 1
    `);
    
    if (gpQuery.rows.length === 0) {
      console.log('❌ No GP account found!');
      return;
    }
    
    const gp = gpQuery.rows[0];
    console.log(`✅ Found GP: ${gp.email} (${gp.name})`);
    console.log(`   GP ID: ${gp.id}\n`);
    
    // 3. Check if consultations table exists
    console.log('3️⃣  Checking consultations table...\n');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'consultations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Consultations table does not exist!');
      console.log('   Run migrations: npm run db:migrate\n');
      return;
    }
    
    console.log('✅ Consultations table exists\n');
    
    // 4. Check table structure
    console.log('4️⃣  Checking table columns...\n');
    const columnsQuery = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'consultations'
      ORDER BY ordinal_position;
    `);
    
    console.log('Table columns:');
    columnsQuery.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? '🔒 Required' : '✅ Optional'}`);
    });
    console.log('');
    
    // 5. Check existing consultations
    console.log('5️⃣  Checking existing consultations...\n');
    const existingQuery = await pool.query(`
      SELECT 
        c.id,
        c.status,
        c.provider_type,
        c.chief_complaint,
        p.name as patient_name,
        g.name as gp_name,
        c.created_at
      FROM consultations c
      JOIN "user" p ON c.patient_id = p.id
      LEFT JOIN "user" g ON c.provider_id = g.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    if (existingQuery.rows.length === 0) {
      console.log('ℹ️  No existing consultations found\n');
    } else {
      console.log(`Found ${existingQuery.rows.length} recent consultations:\n`);
      existingQuery.rows.forEach((c, idx) => {
        console.log(`${idx + 1}. Status: ${c.status} | Patient: ${c.patient_name} | GP: ${c.gp_name || 'Unassigned'}`);
        console.log(`   Complaint: ${c.chief_complaint.substring(0, 60)}...`);
        console.log(`   Created: ${new Date(c.created_at).toLocaleString()}\n`);
      });
    }
    
    // 6. Check pending consultations for GP
    console.log('6️⃣  Checking pending consultations (what GP would see)...\n');
    const pendingQuery = await pool.query(`
      SELECT 
        c.id,
        c.chief_complaint,
        c.urgency,
        p.name as patient_name,
        c.created_at
      FROM consultations c
      JOIN "user" p ON c.patient_id = p.id
      WHERE c.status = 'pending'
      AND c.provider_type = 'gp'
      AND c.provider_id IS NULL
      ORDER BY c.created_at DESC
    `);
    
    if (pendingQuery.rows.length === 0) {
      console.log('ℹ️  No pending consultations waiting for GP\n');
    } else {
      console.log(`✅ ${pendingQuery.rows.length} pending consultations waiting for GP:\n`);
      pendingQuery.rows.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.patient_name} - ${c.chief_complaint.substring(0, 50)}...`);
        console.log(`   Urgency: ${c.urgency} | Created: ${new Date(c.created_at).toLocaleString()}\n`);
      });
    }
    
    // 7. Test accounts summary
    console.log('============================================================\n');
    console.log('📋 TEST ACCOUNTS SUMMARY:\n');
    console.log('Patient Account:');
    console.log(`  Email: ${patient.email}`);
    console.log(`  ID: ${patient.id}`);
    console.log(`  Name: ${patient.name}\n`);
    
    console.log('GP Account:');
    console.log(`  Email: ${gp.email}`);
    console.log(`  ID: ${gp.id}`);
    console.log(`  Name: ${gp.name}\n`);
    
    console.log('============================================================\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Login as PATIENT:');
    console.log(`   - Go to: https://www.healthhubinternational.com/patient/login`);
    console.log(`   - Email: ${patient.email}`);
    console.log(`   - Request consultation at: /patient/consultations/request\n`);
    
    console.log('2. Login as GP:');
    console.log(`   - Go to: https://www.healthhubinternational.com/gp/login`);
    console.log(`   - Email: ${gp.email}`);
    console.log(`   - View requests at: /gp/consultations\n`);
    
    console.log('3. Expected Flow:');
    console.log(`   ✅ Patient creates consultation request`);
    console.log(`   ✅ GP sees request in "Pending" tab`);
    console.log(`   ✅ GP clicks "Accept" button`);
    console.log(`   ✅ Consultation moves to "My Consultations" tab`);
    console.log(`   ✅ Patient receives notification`);
    console.log(`   ✅ Both can access video/chat consultation\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

testConsultationFlow();
