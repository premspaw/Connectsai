const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function verify() {
  const connectionString = (process.env.DATABASE_URL || '').replace(/[?&]sslmode=[^&]+/g, '');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL successfully!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'coexistence' ORDER BY table_name;");
    console.log(`\n🎉 Found ${res.rows.length} tables in coexistence schema:`);
    console.log(res.rows.map(r => r.table_name).join('\n'));
    await client.end();
  } catch (err) {
    console.error('Verification error:', err);
  }
}

verify();
