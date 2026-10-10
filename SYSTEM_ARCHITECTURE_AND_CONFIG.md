# Connects AI (Forge Growth) — System Architecture, API Keys & Reference Guide

> **Document Purpose:** This document serves as the single source of truth for system architecture, database credentials, API keys, service connections, environment variables, local setup, and cloud deployment procedures. Keep this file updated if credentials or endpoints change.

---

## 1. System Architecture & Topology

Connects AI is an enterprise-grade AI WhatsApp CRM and automation platform built with Node.js, Express, React (Vite), Supabase PostgreSQL, Upstash Redis, Cloudflare R2, Meta WhatsApp Cloud API, and Google Vertex AI / Gemini.

```
                               ┌─────────────────────────────────────────┐
                               │       Meta WhatsApp Cloud API           │
                               └────────────────────┬────────────────────┘
                                                    │
                                         Incoming Webhooks & Replies
                                                    ▼
┌──────────────────────┐               ┌─────────────────────────────────┐               ┌──────────────────────┐
│   Frontend (Vite)    │ ────────────► │   Backend API (Express Node)    │ ────────────► │ Supabase PostgreSQL  │
│  • React SPA (8080)  │  REST / SSE   │   • Webhook Endpoint (/api/...) │   Queries &   │ (Schema: coexistence │
│  • CRM Dashboard     │               │   • BullMQ Queue Workers        │   Persistence │  99 Migrations Applied)│
│  • Live WhatsApp Chat│               │   • AI Agent Orchestrator       │               └──────────────────────┘
└──────────────────────┘               └────────────────┬────────────────┘
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    ▼                   ▼                   ▼
                           ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐
                           │ Upstash Redis   │ │ Google Gemini/   │ │ Cloudflare R2 / │
                           │ Queue & Rates   │ │ Vertex AI        │ │ Media Store     │
                           └─────────────────┘ └──────────────────┘ └─────────────────┘
```

---

## 2. Infrastructure & Connected Cloud Services

### 🐘 2.1 Database (Supabase PostgreSQL)
- **Project Name:** `crmCONNECTS`
- **Project ID:** `jdepbrbujambxvtdiwla`
- **Project Region:** `us-east-1` (N. Virginia)
- **Database Schema:** `coexistence` (99 migration files applied)
- **Pooled Connection String (Transaction Pooler - Port 6543):**
  ```
  postgresql://postgres.jdepbrbujambxvtdiwla:YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Direct Connection String (Port 5432):**
  ```
  postgresql://postgres:YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN@db.jdepbrbujambxvtdiwla.supabase.co:5432/postgres
  ```
- **Supabase Personal Access Token (CLI / Management):** `YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN`
- **Publishable Key:** `sb_publishable_YOUR_KEY`
- **Secret Key:** `sb_secret_YOUR_SUPABASE_SECRET_KEY`
- **Anon JWT Key:**
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZXBicmJ1amFtYnh2dGRpd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NTc5OTQsImV4cCI6MjA2NjIzMzk5NH0.0I-UETvLMqkXpwSgUXPcMLx0jylzJ71RK7rkXxOML50`
- **Service Role JWT Key:**
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZXBicmJ1amFtYnh2dGRpd2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDY1Nzk5NCwiZXhwIjoyMDY2MjMzOTk0fQ.E7k7c-MkAlRuigoaPNmnQvqS8oWTJiyob-TPmcYcFDg`

---

### 🔴 2.2 Redis & Queues (Upstash Serverless Redis)
- **Primary Redis URL (TLS enabled for BullMQ):**
  ```
  rediss://default:gQAAAAAAAw2sAAIgcDE1ZjU2NzQ0OTc1ZWE0YjBhODNiNjlmN2E3Nzg0Nzc2NA@native-guinea-200108.upstash.io:6379
  ```
- **Upstash REST URL:** `https://native-guinea-200108.upstash.io`
- **Upstash REST Token:** `gQAAAAAAAw2sAAIgcDE1ZjU2NzQ0OTc1ZWE0YjBhODNiNjlmN2E3Nzg0Nzc2NA`
- **Active Queues in Backend (`BullMQ`):**
  - `sendQueue`: Manages outbound WhatsApp message sends (rate limited to 60/sec)
  - `mediaQueue`: Background processing and download of inbound images & voice notes
  - `agentQueue`: Asynchronous multi-turn AI reasoning jobs

---

### 🔑 2.3 Bootstrap Admin Account Credentials
- **Admin Email:** `admin@example.com`
- **Admin Password:** `AdminConnectsAI2026!`
- **Password Hash in DB:** `$2b$10$wTkyXJ0q55a00mlyfH6u4.t8k7xY0uE6iW/hLwB4sH8tY0uE6iW/h`

---

### 💬 2.4 Meta WhatsApp Cloud API Integration
- **Webhook Endpoint:** `http://localhost:3010/api/webhook/whatsapp` (Local) / `https://your-domain.com/api/webhook/whatsapp` (Production)
- **Webhook Verify Token:** Set in `.env` under `META_WEBHOOK_VERIFY_TOKEN`
- **Supported Webhook Events:** `messages`, `message_deliveries`, `message_reads`, `statuses`
- **Meta API Base URL:** `https://graph.facebook.com/v21.0`

---

### 🧠 2.5 Vertex AI / Google Gemini LLM Integration
- **Default LLM Model:** `gemini-2.5-flash`
- **Service Account Credentials:** Configured via `gcp-service-account.json` at root
- **System Features:** Context windowing (up to 20 messages), grounded Knowledge Base retrieval, multimodal image & voice note comprehension.

---

## 3. Local Development Guide

### 3.1 Prerequisites
- Node.js `v20+`
- npm `v10+`

### 3.2 Running the Application Locally

#### 1️⃣ Start Backend API (Port 3010)
```bash
cd backend
npm install
npm run dev
```
- Healthcheck URL: `http://localhost:3010/health`

#### 2️⃣ Start Frontend UI (Port 8080)
```bash
cd frontend
npm install
npm run dev
```
- Local Web App: `http://localhost:8080`

---

## 4. Environment Variables Reference (`.env`)

The project uses `.env` in the root directory (and `.env` inside `backend/`). Below is the complete required structure:

```env
# ─── Environment & Ports ──────────────────────────────────────────────────
NODE_ENV=development
PORT=3010
WEB_PORT=8080
CORS_ORIGIN=http://localhost:8080

# ─── Security Secrets ──────────────────────────────────────────────────────
FORGECRM_JWT_SECRET=c38e910fa4d1b82e90f11902882ad5b922d3e5625c110901e523fbf889104fa2
FORGECRM_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=AdminConnectsAI2026!

# ─── Supabase PostgreSQL ──────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres.jdepbrbujambxvtdiwla:YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:YOUR_SUPABASE_PERSONAL_ACCESS_TOKEN@db.jdepbrbujambxvtdiwla.supabase.co:5432/postgres
POSTGRES_SCHEMA=coexistence

# ─── Upstash Redis ────────────────────────────────────────────────────────
REDIS_URL=rediss://default:gQAAAAAAAw2sAAIgcDE1ZjU2NzQ0OTc1ZWE0YjBhODNiNjlmN2E3Nzg0Nzc2NA@native-guinea-200108.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://native-guinea-200108.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAw2sAAIgcDE1ZjU2NzQ0OTc1ZWE0YjBhODNiNjlmN2E3Nzg0Nzc2NA

# ─── Meta WhatsApp Cloud API ──────────────────────────────────────────────
META_WEBHOOK_VERIFY_TOKEN=zerolens_connectsai_verify_2026
META_API_VERSION=v21.0
```

---

## 5. Cloud Deployment Guide (Railway / Render / VPS)

### 5.1 Deploying Backend on Railway
1. Create a New Service from repository on [Railway.app](https://railway.app).
2. Set Root Directory: `backend`
3. Set Start Command: `npm start`
4. Add all Environment Variables from Section 4.
5. Railway will assign a domain: `https://your-backend.up.railway.app`.

### 5.2 Meta Webhook Configuration
1. Go to **[Meta Developer Portal](https://developers.facebook.com)** -> Your App -> WhatsApp -> Configuration.
2. Callback URL: `https://your-backend.up.railway.app/api/webhook/whatsapp`
3. Verify Token: `zerolens_connectsai_verify_2026` (matches `META_WEBHOOK_VERIFY_TOKEN`).
4. Click **Verify and Save**, then subscribe to `messages`.

---

## 6. Troubleshooting & Recovery Playbook

| Issue | Potential Cause | Fix / Remediation |
|---|---|---|
| **Backend error: `ECONNREFUSED` on startup** | Supabase database connection down or wrong SSL parameter | Verify `DATABASE_URL` has `?pgbouncer=true` and check Supabase project status at `supabase.com` |
| **BullMQ Redis Connection Error** | Upstash Redis connection failing or non-TLS scheme used | Ensure `REDIS_URL` uses `rediss://` (with double 's' for TLS) |
| **Admin Login Fails (`Invalid credentials`)** | Admin user missing or password mismatch | Run `node backend/scripts/seed-admin.js` to re-seed `admin@example.com` |
| **Meta Webhook Verification Fails** | `META_WEBHOOK_VERIFY_TOKEN` mismatch | Ensure token in Meta portal matches `META_WEBHOOK_VERIFY_TOKEN` in `.env` exactly |
| **Frontend API Proxy Error (`500` / `502`)** | Backend on port 3010 is stopped | Restart backend with `cd backend && npm run dev` |

---

*Last Updated: October 5, 2026*
