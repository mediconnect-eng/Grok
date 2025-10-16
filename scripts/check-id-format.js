require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkIdFormat() {
  try {
    const result = await pool.query('SELECT id FROM "user" LIMIT 5');
    
    console.log('\nUser ID samples from database:');
    console.log('='.repeat(60));
    
    result.rows.forEach((row, index) => {
      const id = row.id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      console.log(`${index + 1}. ${id}`);
      console.log(`   Format: ${isUUID ? '✅ UUID' : '❌ NOT UUID (Better Auth format)'}`);
      console.log(`   Length: ${id.length} characters\n`);
    });
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkIdFormat();
