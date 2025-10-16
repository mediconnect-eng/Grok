const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixOAuthSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing OAuth schema...\n');
    
    // Check if account table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'account'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating account table...');
      await client.query(`
        CREATE TABLE "account" (
          "id" text NOT NULL PRIMARY KEY,
          "accountId" text NOT NULL,
          "providerId" text NOT NULL,
          "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
          "accessToken" text,
          "refreshToken" text,
          "idToken" text,
          "accessTokenExpiresAt" timestamp,
          "refreshTokenExpiresAt" timestamp,
          "scope" text,
          "password" text,
          "createdAt" timestamp NOT NULL DEFAULT NOW(),
          "updatedAt" timestamp NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Account table created');
    } else {
      console.log('Account table exists, checking columns...');
      
      // Check for missing columns
      const columnCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'account'
      `);
      
      const existingColumns = columnCheck.rows.map(r => r.column_name);
      console.log('Existing columns:', existingColumns);
      
      // Add missing columns
      const requiredColumns = {
        'accessTokenExpiresAt': 'timestamp',
        'refreshTokenExpiresAt': 'timestamp',
        'accessToken': 'text',
        'refreshToken': 'text',
        'idToken': 'text',
        'scope': 'text'
      };
      
      for (const [colName, colType] of Object.entries(requiredColumns)) {
        if (!existingColumns.includes(colName)) {
          console.log(`Adding column: ${colName}`);
          await client.query(`
            ALTER TABLE "account" 
            ADD COLUMN "${colName}" ${colType};
          `);
          console.log(`✅ Added ${colName}`);
        }
      }
    }
    
    console.log('\n✅ OAuth schema is ready!');
    console.log('🔄 Please restart your development server.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixOAuthSchema().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
