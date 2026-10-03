-- Migration 110: VoiceLink AI Phone Calling & Gemini Live Voice Agents
--
-- Adds:
--   1. coexistence.voicelink_config - stores VoiceLink reseller credentials, base URL, webhook secret, default DID, encrypted token
--   2. coexistence.voice_agents     - stores AI voice agent prompts, Gemini Live model, voice type (Puck, Aoede, etc.), temperature
--   3. coexistence.voice_calls      - records outbound/inbound call sessions, duration, status, Gemini transcript & summary

CREATE TABLE IF NOT EXISTS coexistence.voicelink_config (
  id SERIAL PRIMARY KEY,
  api_base_url TEXT NOT NULL DEFAULT 'https://app.voicelink.co.in/api',
  mode TEXT NOT NULL DEFAULT 'live',
  reseller_username TEXT,
  reseller_password_encrypted TEXT,
  access_token_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  did_number TEXT,
  ws_base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  last_test_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coexistence.voice_agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  voice_name TEXT NOT NULL DEFAULT 'Aoede', -- Aoede, Puck, Charon, Fenrir, Kore
  gemini_model TEXT NOT NULL DEFAULT 'gemini-3.1-flash-live-preview',
  temperature NUMERIC NOT NULL DEFAULT 0.7,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coexistence.voice_calls (
  id SERIAL PRIMARY KEY,
  voicelink_call_id TEXT,
  phone_number TEXT NOT NULL,
  did_number TEXT,
  contact_id BIGINT,
  lead_id BIGINT,
  agent_id INTEGER REFERENCES coexistence.voice_agents(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound', -- outbound | inbound
  status TEXT NOT NULL DEFAULT 'queued',      -- queued | dialing | ringing | in-progress | completed | failed | busy | no-answer
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  transcript TEXT,
  summary TEXT,
  recording_url TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_calls_phone_idx ON coexistence.voice_calls(phone_number);
CREATE INDEX IF NOT EXISTS voice_calls_status_idx ON coexistence.voice_calls(status);
CREATE INDEX IF NOT EXISTS voice_calls_created_at_idx ON coexistence.voice_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS voice_calls_vl_id_idx ON coexistence.voice_calls(voicelink_call_id);

-- Insert a default Voice Agent if none exists
INSERT INTO coexistence.voice_agents (name, description, system_prompt, voice_name, gemini_model, is_default)
SELECT 
  'ForgeGrowth Inbound/Outbound Voice Assistant',
  'Real-time voice agent for lead qualification and customer support',
  'You are a helpful, professional, and friendly AI phone agent for ForgeGrowth CRM. You speak concisely and naturally in English or Hindi as appropriate. Keep responses short and conversational, suitable for a real-time phone call. Do not use markdown or bullet points when speaking.',
  'Aoede',
  'gemini-3.1-flash-live-preview',
  true
WHERE NOT EXISTS (SELECT 1 FROM coexistence.voice_agents LIMIT 1);
