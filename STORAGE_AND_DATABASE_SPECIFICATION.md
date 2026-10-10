# 📊 Complete Data, Storage & Cloudflare Architecture Specification
**ForgeGrowth / Connects AI — WhatsApp Growth CRM, AI Agent Engine & Media Stack**

---

## 📑 Table of Contents
1. [System Architecture & Cloudflare Migration Strategy](#1-system-architecture--cloudflare-migration-strategy)
2. [Complete Model & Entity Catalog Across the Entire App](#2-complete-model--entity-catalog-across-the-entire-app)
   - [WhatsApp Chat & Real-Time Messaging](#21-whatsapp-chat--real-time-messaging)
   - [CRM Leads, Funnel Pipeline & Dynamic Fields](#22-crm-leads-funnel-pipeline--dynamic-fields)
   - [AI Agents, Multimodal Vision & Knowledge Base](#23-ai-agents-multimodal-vision--knowledge-base)
   - [WhatsApp Broadcasts, Sequences & Templates](#24-whatsapp-broadcasts-sequences--templates)
   - [Payments, Razorpay Ledger & E-Commerce](#25-payments-razorpay-ledger--e-commerce)
   - [Voice Calling & Gemini Live Sessions](#26-voice-calling--gemini-live-sessions)
   - [Auth, Users, Roles & MCP Tools](#27-auth-users-roles--mcp-tools)
3. [Exhaustive SQL Schema & Database Tables](#3-exhaustive-sql-schema--database-tables)
4. [File & Media Storage: Cloudflare R2 Integration Guide](#4-file--media-storage-cloudflare-r2-integration-guide)
   - [Current Storage vs. Cloudflare R2](#41-current-storage-vs-cloudflare-r2)
   - [Cloudflare R2 Bucket Directory Structure](#42-cloudflare-r2-bucket-directory-structure)
   - [S3-Compatible Implementation for Cloudflare R2](#43-s3-compatible-implementation-for-cloudflare-r2)
5. [Environment Variables Matrix for Cloudflare R2 & Database](#5-environment-variables-matrix-for-cloudflare-r2--database)

---

## 1. System Architecture & Cloudflare Migration Strategy

The system is a self-hosted, enterprise WhatsApp-native CRM, Autonomous AI Agent, and Funnel Automation platform.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Cloudflare Global Network                │
                  │  (WAF • DDoS Protection • DNS • Zero-Egress CDN Domain)  │
                  └────────────┬───────────────────────────────┬────────────┘
                               │                               │
                      [HTTPS / API Traffic]           [Direct Object Delivery]
                               │                               │
                               ▼                               ▼
    ┌─────────────────────────────────────────┐    ┌────────────────────────┐
    │       Connects AI Backend & UI          │    │   Cloudflare R2        │
    │  (Node.js / Express + React Vite + AI)  │    │   (Zero-Egress Media)  │
    └────────────────────┬────────────────────┘    │ • WhatsApp Voice/Audio │
                         │                         │ • Inbound/Outbound Img │
            ┌────────────┴────────────┐            │ • PDF Invoices/Docs    │
            ▼                         ▼            │ • Marketing Creatives  │
 ┌──────────────────────┐  ┌─────────────────────┐ │ • RAG Knowledge Files  │
 │  PostgreSQL Database │  │ Cloud Vertex AI     │ └────────────────────────┘
 │  (Schema: coexistence│  │ Gemini 3.8 / 2.5    │
 │   Hyperdrive-ready)  │  │ Real-time Vision/TTS│
 └──────────────────────┘  └─────────────────────┘
```

### Why Cloudflare for Storage & Database?
- **Cloudflare R2**: 100% S3-compatible object storage with **$0 egress fees**, global edge caching, and instant public custom domains (e.g. `https://media.connectsai.com/...`). Replaces local disk uploads and MinIO.
- **Cloudflare Hyperdrive / Managed PostgreSQL**: Accelerates database queries globally via edge connection pooling to PostgreSQL.

---

## 2. Complete Model & Entity Catalog Across the Entire App

### 2.1 WhatsApp Chat & Real-Time Messaging
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`message_id`** | `VARCHAR(255)` (PK) | Meta WAMID identifier (`wamid.HBg...`) or outbound generated ID. |
| **`contact_number`** | `VARCHAR(32)` | Clean normalized customer digits (e.g. `918660395136`). |
| **`wa_number`** | `VARCHAR(32)` | The business WhatsApp phone number receiving/sending the chat. |
| **`direction`** | `VARCHAR(16)` | `incoming` / `inbound` or `outgoing` / `outbound`. |
| **`message_type`** | `VARCHAR(32)` | `text`, `image`, `audio`, `voice`, `video`, `document`, `interactive`, `button`, `template`, `reaction`, `location`, `contacts`. |
| **`message_body`** | `TEXT` | Raw text content, image/video caption, or button payload. |
| **`media_url`** | `TEXT` | Meta media ID or external URL. |
| **`media_mime_type`** | `VARCHAR(128)` | MIME type (e.g., `audio/mpeg`, `image/jpeg`, `application/pdf`). |
| **`media_status`** | `VARCHAR(32)` | `pending`, `downloading`, `stored`, `failed`, `expired`. |
| **`media_storage_path`** | `TEXT` | Cloudflare R2 Object Key (e.g., `media/918660395136/202610/wamid_123.mp3`). |
| **`media_size_bytes`** | `BIGINT` | File size in bytes. |
| **`media_duration_seconds`**| `INTEGER` | Audio/Video playback duration for scrub bars. |
| **`status`** | `VARCHAR(32)` | `sent`, `delivered`, `read`, `failed`. |
| **`raw_payload`** | `JSONB` | Full unprocessed JSON webhook from Meta Graph API. |

---

### 2.2 CRM Leads, Funnel Pipeline & Dynamic Fields
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`id`** | `BIGSERIAL` (PK) | Unique Lead ID. |
| **`name`** | `VARCHAR(255)` | Contact name or Meta Profile Name. |
| **`phone`** | `VARCHAR(32)` | Primary phone number (E.164 without `+`). |
| **`email`** | `VARCHAR(255)` | Extracted or submitted email address. |
| **`stage`** | `VARCHAR(64)` | Pipeline Stage: `new`, `contacted`, `engaged`, `hot`, `opportunity`, `converted`, `lost`. |
| **`source`** | `VARCHAR(128)` | `WhatsApp Inbound`, `CTWA Ad`, `Website Form`, `Manual`, `CSV Import`. |
| **`tags`** | `TEXT[]` | Tags array (e.g., `["Live Lead", "Appointment Booked", "VIP"]`). |
| **`custom_fields`** | `JSONB` | Dynamic key-value pairs (e.g., `{"clinic_type": "Dental", "budget": "50k"}`). |
| **`lead_events`** | Table | Immutable audit log of every stage change and trigger source. |
| **`lead_forms` / `submissions`** | Tables | Web forms and interactive multi-step data collectors with instant WhatsApp syncing. |

---

### 2.3 AI Agents, Multimodal Vision & Knowledge Base
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`agents`** | Table | Defines autonomous agent personalities, system prompts, triggers, and handoff rules. |
| **`llm_model`** | `VARCHAR(64)` | Selected AI Model (`gemini-2.5-flash`, `gemini-3.8-flash`, `claude-3-7-sonnet`, `gpt-4o`). |
| **`system_prompt`** | `TEXT` | Core agent instructions, persona, tone, appointment rules, and guidelines. |
| **`context_window_messages`**| `INTEGER` | Memory buffer (e.g., 20 turns) for conversation context. |
| **`accept_images`** | `BOOLEAN` | Multimodal vision flag to analyze incoming customer photos. |
| **`transcribe_audio`** | `BOOLEAN` | Converts incoming voice notes to text before LLM reasoning. |
| **`knowledge_base`** | Table | **RAG Knowledge Base**: FAQs, clinic services, pricing, company facts, and PDF/document knowledge. |

---

### 2.4 WhatsApp Broadcasts, Sequences & Templates
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`message_templates`** | Table | Meta-approved templates with category (`MARKETING`, `UTILITY`, `AUTHENTICATION`), language, and dynamic header/body variables. |
| **`carousel_cards`** | `JSONB` | Multi-product carousel cards with header image (stored in R2) and quick-reply action buttons. |
| **`broadcasts`** | Table | Mass messaging blasts with audience filters, scheduling, and live delivery rate telemetry. |
| **`broadcast_series`** | Table | Automated multi-day drip follow-up sequences. |
| **`ctwa_referrals`** | Table | Meta Click-to-WhatsApp ad attribution: links incoming chats directly to Ad ID, Ad Set, and Campaign. |

---

### 2.5 Payments, Razorpay Ledger & E-Commerce
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`payment_requests`** | Table | In-chat WhatsApp payment links created dynamically with expiration & amounts. |
| **`razorpay_payment_ledger`**| Table | Real-time payment transactions, webhooks, signatures, fees, and order IDs. |
| **`products` / `courses`**| Tables | Catalog items, course modules, default prices, and auto-tagging upon purchase. |

---

### 2.6 Voice Calling & Gemini Live Sessions
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`voice_calls`** | Table | Inbound/Outbound AI phone call records with duration, recording audio path, and full transcript. |
| **`voicelink`** | Table | Real-time bidirectional streaming session configuration (Gemini 3.8 Live API). |

---

### 2.7 Auth, Users, Roles & MCP Tools
| Entity / Field | Type | Description |
| :--- | :--- | :--- |
| **`users`** | Table | Admin, Agent, and Manager logins with bcrypt hashed passwords and JWT sessions. |
| **`mcp_oauth_clients`** | Table | Model Context Protocol (MCP) tool integrations for Anthropic Claude / AI agents. |

---

## 3. Exhaustive SQL Schema & Database Tables

All tables belong to the PostgreSQL schema `coexistence`.

```sql
-- 1. CHAT HISTORY & MESSAGES
CREATE TABLE IF NOT EXISTS coexistence.chat_history (
    id                      BIGSERIAL PRIMARY KEY,
    message_id              VARCHAR(255) UNIQUE NOT NULL,
    contact_number          VARCHAR(32) NOT NULL,
    wa_number               VARCHAR(32) NOT NULL,
    direction               VARCHAR(16) NOT NULL, -- 'incoming' | 'outgoing'
    message_type            VARCHAR(32) NOT NULL, -- 'text' | 'image' | 'audio' | 'voice' | 'video' | 'document' | 'interactive'
    message_body            TEXT,
    media_url               TEXT,                 -- Meta Media ID or source URL
    media_mime_type         VARCHAR(128),
    media_status            VARCHAR(32) DEFAULT 'pending', -- 'pending' | 'stored' | 'failed' | 'expired'
    media_storage_path      TEXT,                 -- Cloudflare R2 Key
    media_filename          VARCHAR(255),
    media_size_bytes        BIGINT,
    media_duration_seconds  INTEGER,
    media_downloaded_at     TIMESTAMPTZ,
    status                  VARCHAR(32) DEFAULT 'sent', -- 'sent' | 'delivered' | 'read' | 'failed'
    context_message_id      VARCHAR(255),
    is_starred              BOOLEAN DEFAULT FALSE,
    reactions               JSONB DEFAULT '[]'::jsonb,
    raw_payload             JSONB,
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_contact ON coexistence.chat_history (contact_number, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chat_media_status ON coexistence.chat_history (media_status) WHERE media_status != 'stored';

-- 2. CRM LEADS & PIPELINE
CREATE TABLE IF NOT EXISTS coexistence.leads (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255),
    phone               VARCHAR(32) UNIQUE NOT NULL,
    whatsapp_number     VARCHAR(32),
    email               VARCHAR(255),
    profession          VARCHAR(128),
    city                VARCHAR(128),
    stage               VARCHAR(64) NOT NULL DEFAULT 'new', -- 'new'|'contacted'|'engaged'|'hot'|'opportunity'|'converted'|'lost'
    source              VARCHAR(128) DEFAULT 'WhatsApp Inbound',
    tags                TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_fields       JSONB DEFAULT '{}'::jsonb,
    assigned_to         BIGINT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON coexistence.leads (phone);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON coexistence.leads (stage);

-- 3. APPEND-ONLY LEAD EVENT LOG
CREATE TABLE IF NOT EXISTS coexistence.lead_events (
    id          BIGSERIAL PRIMARY KEY,
    lead_id     BIGINT REFERENCES coexistence.leads(id) ON DELETE CASCADE,
    event_type  VARCHAR(64) NOT NULL, -- 'stage_change' | 'tag_added' | 'form_submission'
    old_stage   VARCHAR(64),
    new_stage   VARCHAR(64),
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUTONOMOUS AI AGENTS
CREATE TABLE IF NOT EXISTS coexistence.agents (
    id                          BIGSERIAL PRIMARY KEY,
    name                        VARCHAR(255) NOT NULL,
    llm_model                   VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
    system_prompt               TEXT NOT NULL,
    context_window_messages     INTEGER NOT NULL DEFAULT 20,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    accept_images               BOOLEAN NOT NULL DEFAULT TRUE,
    transcribe_audio            BOOLEAN NOT NULL DEFAULT TRUE,
    triggers                    JSONB DEFAULT '[]'::jsonb,
    handoff_config              JSONB DEFAULT '{}'::jsonb,
    test_numbers                TEXT[] DEFAULT ARRAY[]::TEXT[],
    rate_limit_per_minute       INTEGER DEFAULT 60,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GROUNDING KNOWLEDGE BASE (RAG)
CREATE TABLE IF NOT EXISTS coexistence.knowledge_base (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    category            VARCHAR(64) DEFAULT 'General',
    file_attachment_url TEXT,                 -- Cloudflare R2 document URL
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MEDIA LIBRARY (CAMPAIGN CREATIVES & CAROUSELS)
CREATE TABLE IF NOT EXISTS coexistence.media_library (
    id                  BIGSERIAL PRIMARY KEY,
    filename            VARCHAR(255) NOT NULL,
    original_name       VARCHAR(255) NOT NULL,
    name                VARCHAR(255),
    mime_type           VARCHAR(128) NOT NULL,
    size_bytes          BIGINT NOT NULL,
    media_type          VARCHAR(32) NOT NULL, -- 'image' | 'video' | 'audio' | 'document'
    r2_bucket           VARCHAR(128),
    r2_object_key       TEXT NOT NULL,        -- 'library/1741234-banner.png'
    sha256              VARCHAR(64) NOT NULL,
    auto_resync         BOOLEAN DEFAULT TRUE,
    notes               TEXT,
    uploaded_by         BIGINT,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- 7. MEDIA META SYNC (28-DAY CACHE PER WABA)
CREATE TABLE IF NOT EXISTS coexistence.media_meta_sync (
    id              BIGSERIAL PRIMARY KEY,
    media_id        BIGINT REFERENCES coexistence.media_library(id) ON DELETE CASCADE,
    account_id      BIGINT NOT NULL,
    meta_media_id   VARCHAR(255),
    status          VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'syncing' | 'synced' | 'failed' | 'expired'
    synced_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,                            -- Meta caches for ~30 days
    last_error      TEXT,
    attempts        INTEGER DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (media_id, account_id)
);

-- 8. WHATSAPP BUSINESS ACCOUNTS (WABA)
CREATE TABLE IF NOT EXISTS coexistence.whatsapp_accounts (
    id                      BIGSERIAL PRIMARY KEY,
    name                    VARCHAR(255),
    phone_number_id         VARCHAR(64) UNIQUE NOT NULL,
    waba_id                 VARCHAR(64) NOT NULL,
    access_token            TEXT NOT NULL,
    display_phone_number    VARCHAR(32),
    verified_name           VARCHAR(255),
    quality_rating          VARCHAR(32),
    verify_token            VARCHAR(255),
    meta_app_id             VARCHAR(64),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MESSAGE TEMPLATES & BROADCASTS
CREATE TABLE IF NOT EXISTS coexistence.message_templates (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    category            VARCHAR(64) NOT NULL, -- 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
    language            VARCHAR(16) NOT NULL DEFAULT 'en',
    status              VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    meta_template_id    VARCHAR(64),
    components          JSONB NOT NULL DEFAULT '[]'::jsonb,
    carousel_cards      JSONB DEFAULT '[]'::jsonb,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coexistence.broadcasts (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    template_id         BIGINT REFERENCES coexistence.message_templates(id),
    status              VARCHAR(32) DEFAULT 'draft', -- 'draft' | 'scheduled' | 'running' | 'completed' | 'failed'
    total_recipients    INTEGER DEFAULT 0,
    sent_count          INTEGER DEFAULT 0,
    delivered_count     INTEGER DEFAULT 0,
    read_count          INTEGER DEFAULT 0,
    failed_count        INTEGER DEFAULT 0,
    scheduled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAYMENTS & RAZORPAY LEDGER
CREATE TABLE IF NOT EXISTS coexistence.payment_requests (
    id                  BIGSERIAL PRIMARY KEY,
    lead_id             BIGINT REFERENCES coexistence.leads(id),
    amount_paise        BIGINT NOT NULL,
    currency            VARCHAR(8) DEFAULT 'INR',
    description         TEXT,
    razorpay_order_id   VARCHAR(255),
    payment_link_url    TEXT,
    status              VARCHAR(32) DEFAULT 'pending', -- 'pending' | 'paid' | 'expired' | 'failed'
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coexistence.razorpay_payment_ledger (
    id                  BIGSERIAL PRIMARY KEY,
    payment_id          VARCHAR(255) UNIQUE NOT NULL,
    order_id            VARCHAR(255),
    amount              NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(8) DEFAULT 'INR',
    status              VARCHAR(32) NOT NULL,
    method              VARCHAR(32),
    contact_phone       VARCHAR(32),
    contact_email       VARCHAR(255),
    raw_event           JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. File & Media Storage: Cloudflare R2 Integration Guide

### 4.1 Current Storage vs. Cloudflare R2
| Storage Type | Local Disk / MinIO | Cloudflare R2 |
| :--- | :--- | :--- |
| **Egress Bandwidth Cost** | Server network dependent | **$0.00 / GB (Always Free Egress)** |
| **High Availability** | Single container / disk failure risk | **Global 99.999999999% (11 9s) Durability** |
| **Public CDN Domain** | Custom proxy route required | **Direct Edge Caching via Custom Domain** |
| **API Standard** | Custom file paths / S3 | **100% S3 Compatible (AWS SDK / MinIO client)** |

---

### 4.2 Cloudflare R2 Bucket Directory Structure

```
r2://connects-ai-media/
├── media/
│   ├── inbound/
│   │   └── 918660395136/
│   │       └── 202610/
│   │           ├── wamid_HBg...jpg       (Customer sent photo)
│   │           ├── wamid_HBg...mp3       (Transcoded Voice Note)
│   │           └── wamid_HBg...pdf       (Customer sent invoice/doc)
│   └── outbound/
│       └── 918660395136/
│           └── 202610/
│               └── out_msg_123.mp4       (Agent sent video demo)
├── library/
│   ├── 1741238912-summer_sale_banner.png (Broadcast header banner)
│   └── 1741238914-product_brochure.pdf   (Lead attachment)
└── knowledge-base/
    └── studio_pricing_faqs_2026.pdf      (Grounding document for R2 RAG)
```

---

### 4.3 S3-Compatible Implementation for Cloudflare R2

Using `@aws-sdk/client-s3` (or the existing `minio` Node package configured for Cloudflare R2 endpoint):

```javascript
// backend/src/util/r2Storage.js
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'connects-ai-media';
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN; // e.g. 'https://media.connectsai.com'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload binary buffer directly to Cloudflare R2
 */
async function uploadToR2(objectKey, buffer, mimeType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: buffer,
    ContentType: mimeType,
  }));
  return {
    key: objectKey,
    url: R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${objectKey}` : null,
  };
}

/**
 * Fetch object stream / buffer from Cloudflare R2
 */
async function getObjectBuffer(objectKey) {
  const res = await s3Client.send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  }));
  const chunks = [];
  for await (const chunk of res.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete object from Cloudflare R2
 */
async function deleteFromR2(objectKey) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
  }));
}

module.exports = { uploadToR2, getObjectBuffer, deleteFromR2, s3Client };
```

---

## 5. Environment Variables Matrix for Cloudflare R2 & Database

When ready, add these credentials to your `.env` file:

```ini
# ==========================================
# CLOUDFLARE R2 OBJECT STORAGE CREDENTIALS
# ==========================================
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id_here"
CLOUDFLARE_R2_ACCESS_KEY_ID="your_r2_access_key_id_here"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your_r2_secret_access_key_here"
CLOUDFLARE_R2_BUCKET="connects-ai-media"
CLOUDFLARE_R2_PUBLIC_DOMAIN="https://media.yourdomain.com"

# ==========================================
# POSTGRESQL / CLOUDFLARE HYPERDRIVE DATABASE
# ==========================================
POSTGRES_HOST="localhost"
POSTGRES_PORT=5432
POSTGRES_DB="forgecrm"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your_database_password"
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/forgecrm?sslmode=disable"

# ==========================================
# META WHATSAPP CLOUD API & AI AGENTS
# ==========================================
META_PHONE_NUMBER_ID="1299345543269323"
META_ACCESS_TOKEN="EAAkCUR..."
META_VERIFY_TOKEN="your_webhook_verify_token"
GOOGLE_APPLICATION_CREDENTIALS="gcp-service-account.json"
DEFAULT_LLM_MODEL="gemini-2.5-flash"
```

---

## 🚀 Summary of Next Steps
1. **Cloudflare R2 Bucket**: Create the bucket in Cloudflare dashboard (e.g. `connects-ai-media`) and generate an **R2 API Token** (Admin Read & Write permissions).
2. **Provide the 3 Cloudflare Values**:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_R2_ACCESS_KEY_ID`
   - `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
3. **Automatic Switchover**: We will hook the S3 client directly to Cloudflare R2 so all WhatsApp audio recordings, images, documents, and CRM assets automatically stream directly to Cloudflare R2 with zero egress fees!
