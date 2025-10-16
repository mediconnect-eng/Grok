require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupSessions() {
  try {
    console.log('🔍 Checking sessions...\n');
    
    // Get all sessions
    const allSessions = await pool.query('SELECT COUNT(*) FROM session');
    console.log('Total sessions:', allSessions.rows[0].count);
    
    // Get expired sessions
    const expiredSessions = await pool.query(
      'SELECT COUNT(*) FROM session WHERE "expiresAt" < NOW()'
    );
    console.log('Expired sessions:', expiredSessions.rows[0].count);
    
    // Delete expired sessions
    const deleted = await pool.query(
      'DELETE FROM session WHERE "expiresAt" < NOW() RETURNING id'
    );
    console.log('\n✅ Deleted', deleted.rows.length, 'expired sessions');
    
    // Show active sessions
    const activeSessions = await pool.query(`
      SELECT s.*, u.email 
      FROM session s 
      JOIN "user" u ON s."userId" = u.id 
      WHERE s."expiresAt" > NOW()
      ORDER BY s."createdAt" DESC
      LIMIT 10
    `);
    
    console.log('\n📋 Active sessions:', activeSessions.rows.length);
    activeSessions.rows.forEach(s => {
      const expires = new Date(s.expiresAt);
      const daysLeft = Math.floor((expires - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`- ${s.email}: expires in ${daysLeft} days`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupSessions();
