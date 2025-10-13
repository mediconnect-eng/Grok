/**
 * Database Migration Script
 * Run migrations to set up real user system
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log('═══════════════════════════════════════════════════════════');
console.log('   🗄️  MEDICONNECT DATABASE MIGRATIONS');
console.log('═══════════════════════════════════════════════════════════\n');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to PostgreSQL database\n');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found\n');
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration file(s):\n`);

    for (const file of migrationFiles) {
      // Check if migration already executed
      const result = await client.query(
        'SELECT * FROM migrations WHERE name = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  ${file} - Already executed`);
        continue;
      }

      // Read and execute migration
      console.log(`⚙️  Executing: ${file}...`);
      const migrationSQL = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );

      try {
        // Execute migration in a transaction
        await client.query('BEGIN');
        await client.query(migrationSQL);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ ${file} - Completed\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ ${file} - Failed:`, error.message);
        throw error;
      }
    }

    // Display summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   ✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Show created tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 Database Tables:\n');
    tablesResult.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('🚀 Database is ready for real user registration!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
