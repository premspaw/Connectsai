const { Router } = require('express');
const pool = require('../db');
const { adminOnly } = require('../middleware/access');

const router = Router();

// In-memory fallback if DB table not yet created
let memoryKBs = [
  {
    id: 1,
    title: 'Company Overview & Services',
    category: 'general',
    content: 'Connects AI is an AI-powered WhatsApp CRM and telephony platform designed to help businesses automate sales funnels, lead qualification, and customer support with Google Cloud Vertex AI and Gemini.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Business Hours & Support Policy',
    category: 'support',
    content: 'Our official support hours are Monday to Saturday, 9:00 AM to 7:00 PM IST. Emergency inquiries received outside business hours are automatically queued and addressed first thing the next morning.',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// GET /api/knowledge-bases
router.get('/knowledge-bases', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM coexistence.knowledge_bases ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    // Fallback to memory if table hasn't migrated yet
    res.json(memoryKBs);
  }
});

// POST /api/knowledge-bases
router.post('/knowledge-bases', adminOnly, async (req, res) => {
  const { title, category = 'general', content, is_active = true } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO coexistence.knowledge_bases (title, category, content, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title.trim(), category.trim(), content.trim(), !!is_active]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    const newDoc = {
      id: Date.now(),
      title: title.trim(),
      category: category.trim(),
      content: content.trim(),
      is_active: !!is_active,
      created_at: new Date().toISOString(),
    };
    memoryKBs.unshift(newDoc);
    res.status(201).json(newDoc);
  }
});

// PUT /api/knowledge-bases/:id
router.put('/knowledge-bases/:id', adminOnly, async (req, res) => {
  const { title, category, content, is_active } = req.body || {};
  const id = parseInt(req.params.id, 10);

  try {
    const { rows } = await pool.query(
      `UPDATE coexistence.knowledge_bases
          SET title = COALESCE($1, title),
              category = COALESCE($2, category),
              content = COALESCE($3, content),
              is_active = COALESCE($4, is_active),
              updated_at = NOW()
        WHERE id = $5
        RETURNING *`,
      [title?.trim(), category?.trim(), content?.trim(), is_active, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Knowledge base article not found' });
    res.json(rows[0]);
  } catch (err) {
    const item = memoryKBs.find(k => k.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (title !== undefined) item.title = title.trim();
    if (category !== undefined) item.category = category.trim();
    if (content !== undefined) item.content = content.trim();
    if (is_active !== undefined) item.is_active = is_active;
    res.json(item);
  }
});

// DELETE /api/knowledge-bases/:id
router.delete('/knowledge-bases/:id', adminOnly, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM coexistence.knowledge_bases WHERE id = $1`,
      [id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Knowledge base article not found' });
    res.json({ success: true });
  } catch (err) {
    memoryKBs = memoryKBs.filter(k => k.id !== id);
    res.json({ success: true });
  }
});

module.exports = router;
