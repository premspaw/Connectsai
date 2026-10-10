require('dotenv').config({ path: '../.env' });
const pool = require('./src/db');
const { encrypt } = require('./src/util/crypto');

async function seed() {
  console.log('[seed] Connecting to PostgreSQL to restore ACCT-001 WhatsApp & Chat data...');

  const token = 'EAAkCURx3dQEBSqy41a0XbvLNGKQNwZBabHEZAn5I5mhMS6iJ7D48P0AKJ9yr6VvW6hIWdYHnFWUtK0cHNxUtNViApMK5SAJAB4pFyn96hnHuKMZC4LTivLKXxoFuMrdi6quDf2ND1NcB5UwBNBSrvGULCrvlcfwyrPdiOBs8t7ncsp85VeEMlaB3amCewZDZD';
  const verifyToken = 'zylo_webhook_secret_2026';
  const encToken = encrypt(token);
  const encVerify = encrypt(verifyToken);

  // 1. WhatsApp Account (Zerolens AI Studio for Prem Spawar ACCT-001)
  const existingWa = await pool.query("SELECT * FROM coexistence.whatsapp_accounts WHERE phone_number_id = '1299345543269323'");
  if (existingWa.rows.length === 0) {
    await pool.query(`
      INSERT INTO coexistence.whatsapp_accounts
        (display_name, display_phone_number, phone_number_id, waba_id, meta_app_id,
         access_token_encrypted, verify_token_encrypted, is_default, is_active, health_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, 'healthy')
    `, [
      'Zerolens AI Studio',
      '918660395136',
      '1299345543269323',
      '972769282557039',
      '2535822183593217',
      encToken,
      encVerify
    ]);
    console.log('[seed] Inserted Zerolens AI Studio WhatsApp Account (918660395136)');
  } else {
    await pool.query(`
      UPDATE coexistence.whatsapp_accounts
      SET is_default = true, is_active = true, health_status = 'healthy'
      WHERE phone_number_id = '1299345543269323'
    `);
    console.log('[seed] Updated existing Zerolens AI Studio WhatsApp Account');
  }

  // 2. User assignment for Prem Spawar (id = 1)
  const assign = await pool.query("SELECT * FROM coexistence.user_wa_assignments WHERE user_id = 1 AND wa_number = '918660395136'");
  if (assign.rows.length === 0) {
    await pool.query("INSERT INTO coexistence.user_wa_assignments (user_id, wa_number) VALUES (1, '918660395136')");
    console.log('[seed] Assigned 918660395136 to user 1 (Prem Spawar)');
  }

  // 3. Contact (Hemanth +91 81231 33382)
  const contact = await pool.query("SELECT * FROM coexistence.contacts WHERE contact_number = '918123133382'");
  if (contact.rows.length === 0) {
    await pool.query(`
      INSERT INTO coexistence.contacts
        (wa_number, contact_number, name, profile_name, tags, lead_score)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      '918660395136',
      '918123133382',
      'Hemanth (+91 81231 33382)',
      'Hemanth',
      JSON.stringify(['WhatsApp Inbound', 'Live Lead']),
      85
    ]);
    console.log('[seed] Inserted contact Hemanth (918123133382)');
  }

  // 4. Chat History
  const msgCount = await pool.query("SELECT COUNT(*) FROM coexistence.chat_history WHERE contact_number = '918123133382'");
  if (parseInt(msgCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO coexistence.chat_history
        (message_id, phone_number_id, wa_number, contact_number, to_number, direction, message_type, message_body, status, timestamp)
      VALUES
        ($1, $2, $3, $4, $5, 'incoming', 'text', 'Hi', 'delivered', NOW() - INTERVAL '1 hour'),
        ($6, $2, $3, $4, $4, 'outgoing', 'text', 'Hello from Zerolens AI Studio! How can we assist you today?', 'delivered', NOW() - INTERVAL '55 minutes')
    `, [
      'wamid.inbound_1',
      '1299345543269323',
      '918660395136',
      '918123133382',
      '918660395136',
      'wamid.HBgMOTE4MTIzMTMzMzgyFQIAERgSRUJGRjgxODNGMjI4RjlGM0M3AA=='
    ]);
    console.log('[seed] Inserted 2 messages for chat history with 918123133382');
  }

  // 5. Chatbots / Automations
  const bots = await pool.query("SELECT COUNT(*) FROM coexistence.chatbots");
  if (parseInt(bots.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO coexistence.chatbots
        (name, description, status, trigger_type, config)
      VALUES ($1, $2, 'active', 'inbound_message', $3)
    `, [
      'Zerolens AI Studio Smart Booking Assistant',
      'Multi-turn AI Assistant for appointment booking, service inquiries, and Google Vertex AI 2-way replies',
      JSON.stringify({
        model: 'gemini-2.0-flash-001',
        active: true,
        channel: '918660395136',
        services: ['Dental/Medical Clinic', 'Ecommerce', 'Real Estate', 'Video Production', 'WhatsApp Automation']
      })
    ]);
    console.log('[seed] Inserted Zerolens AI Smart Chatbot');
  }

  console.log('[seed] Seeding completed successfully!');
  process.exit();
}

seed().catch(e => {
  console.error('[seed error]:', e);
  process.exit(1);
});
