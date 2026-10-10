require('../backend/node_modules/dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const pool = require('../backend/src/db');

async function run() {
  try {
    const res = await pool.query(
      `UPDATE coexistence.forgecrm_users
       SET username = $1, email = $2, display_name = $3, role = $4
       WHERE id = 1
       RETURNING id, username, email, display_name, role`,
      ['premspaw', 'premspaw@gmail.com', 'Prem Spawar', 'admin']
    );
    console.log('Main Admin successfully updated:', res.rows[0]);
  } catch (err) {
    console.error('Failed to update admin:', err.message);
  } finally {
    await pool.end();
  }
}

run();
