-- 111_knowledge_base.sql
-- Knowledge Base system for AI Agents & Gemini Live Phone Calling

CREATE TABLE IF NOT EXISTS coexistence.knowledge_bases (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coexistence.agent_knowledge_bases (
  agent_id INT NOT NULL,
  knowledge_base_id INT NOT NULL REFERENCES coexistence.knowledge_bases(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, knowledge_base_id)
);

CREATE INDEX IF NOT EXISTS idx_kb_category ON coexistence.knowledge_bases(category);
