Client Side for NewsLetter Subscription

# News Letter - RSS Feed to Vector Database Pipeline

This project ingests world news from multiple RSS feeds, deduplicates and enriches articles with embeddings, and stores them in a PostgreSQL vector database for downstream newsletter workflows.

## ETL
<img width="7691" height="3201" alt="ETL" src="https://github.com/user-attachments/assets/a2681533-2445-4d4d-9bb1-441559a48aec" />

## RANKING
<img width="7777" height="2801" alt="Ranking" src="https://github.com/user-attachments/assets/213f06d0-dfa0-440f-9c5e-d8c1b91b1803" />

## WEBSEARCH
<img width="8270" height="3964" alt="WebSearch" src="https://github.com/user-attachments/assets/f1c5a13e-32bb-4bb1-99e8-8af93b40c85d" />

## LLM
<img width="7759" height="3964" alt="LLM" src="https://github.com/user-attachments/assets/61d60195-692f-4844-86f7-2702341d4292" />

## EMAIL
<img width="7765" height="3964" alt="Email" src="https://github.com/user-attachments/assets/0de886e5-bc9d-4c11-a1b7-72fdb95c995e" />

## 📋 Project Overview

This is a **production-ready news aggregation and enrichment pipeline** that:
- Fetches articles from multiple RSS feed sources (news outlets, tech sites, etc.)
- Deduplicates articles using GUID matching against PostgreSQL
- Generates vector embeddings for each article using Voyage AI
- Stores enriched articles in PostgreSQL with vector embeddings
- Removes semantically similar articles using cosine similarity (threshold: 0.80)
- Runs on a scheduled cron pattern with rate limiting

**Tech Stack:**
- **Backend**: Express.js + TypeScript
- **Task Queue**: BullMQ (backed by Redis)
- **Database**: PostgreSQL (with pgvector extension)
- **Embeddings**: Voyage AI (`voyage-4-lite` model)
- **Scheduling**: BullMQ Job Scheduler

---

## 🏗️ Architecture

### Data Flow

```
[Scheduler (every 30 min)]
         ↓
[RSS Publisher] → Queues worldnews + technews jobs
         ↓
[RSS Worker] (per category)
   ├→ handleRssFeed() - fetch from 4+ sources in parallel
   ├→ physicalDedupe() - filter articles already in DB (by GUID)
   └→ createEmbedding() - publish embedding jobs
         ↓
[Embedding Queue] (BullMQ, max 1 per minute)
         ↓
[Embedding Worker]
   ├→ Call Voyage AI embed API (batch of articles)
   ├→ insertIntoCleanTable()
   │  ├→ Insert articles with embeddings to clean_articles table
   │  └→ Semantic deduplication (delete near-duplicate articles)
   └→ Log completion with inserted row count
```

---

## 🔧 What's Implemented

### ✅ Completed Features

#### 1. **Multi-Source RSS Ingestion**
- Fetches from configurable RSS feed URLs
- Supports multiple categories (worldnews, technews, etc.)
- Parallel fetching with Promise.all for speed
- Graceful filtering of malformed articles (null GUIDs)

**Sources:**
- **World News**: Al Jazeera, BBC, Financial Times, NY Times
- **Tech News**: Ars Technica (extensible)

#### 2. **Physical Deduplication (DB-Level)**
- Checks incoming article GUIDs against `clean_articles` table
- Prevents duplicate ingestion
- Reduces unnecessary API calls

#### 3. **Rate-Limited Embedding API**
- BullMQ worker with **1 embedding job per minute** limiter
- Respects Voyage AI free-tier limits (3 RPM, 10K TPM)
- Batch processing: sends multiple articles per API call
- Exponential backoff on failures

#### 4. **Vector Storage & Cleanup**
- Inserts articles with embeddings into PostgreSQL
- Uses pgvector for `embedding` column
- **Semantic Deduplication**: Automatically deletes near-duplicate articles (cosine similarity ≥ 0.80) within last 12 hours
- Transaction-based inserts with automatic rollback on error

#### 5. **Structured Job Scheduling**
- Runs every 30 minutes via cron pattern (`*/30 * * * *`)
- Automatic retries (up to 5 attempts) with exponential backoff
- Job cleanup after 1000ms on failure

#### 6. **Comprehensive Logging**
- Stage-prefixed logs: `[RSS/FETCH]`, `[RSS/DEDUPE]`, `[EMBED/WORKER]`, `[DB/INSERT]`, etc.
- Separator bars for visual clarity in terminal
- Logs include:
  - Job IDs and categories
  - Article titles and counts
  - Inserted/deleted row counts
  - Error tracebacks

---
## ⚙️ Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+ (with pgvector extension installed)
- Redis 6+
- Voyage AI API key

### Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newsletter_db
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# Voyage AI
VOYAGE_API_KEY=your_voyage_api_key

# Server
NODE_ENV=development
PORT=3000
```

### Install Dependencies

```bash
npm install
```

---

## 🚀 Running the Project

### Development Mode (with hot reload)

```bash
npm run dev
```

This watches `server.ts` and restarts on changes.

### Production Mode

```bash
npx tsx server.ts
```

### Test RSS Feed Fetch

To test RSS fetching without scheduling:

```bash
npx tsx services/rssFeed.ts
```

---

## 📈 Rate Limiting & Quotas

### Voyage AI Free Tier
- **Limit**: 3 API calls per minute, 10K tokens per minute
- **Model**: `voyage-4-lite` (1024-dim embeddings)
- **Current Config**: 1 embedding job per minute (conservative)
- **Upgrade**: Add payment method in Voyage dashboard to unlock standard limits

### BullMQ Queue Limiter (Embedding Worker)
```typescript
limiter: {
  max: 1,           // 1 job per period
  duration: 1000*60 // 60 seconds
}
```

---

## 📝 Logging Guide

All logs are prefixed with stage tags for easy tracking:

| Tag | Stage | Purpose |
|-----|-------|---------|
| `[SCHEDULER]` | Scheduler trigger | Every 30 minutes |
| `[RSS/PUBLISHER]` | RSS job enqueue | Publishes worldnews + technews |
| `[RSS/WORKER]` | RSS fetch worker | Fetches from sources |
| `[RSS/FETCH]` | Feed parsing | Article fetching & structuring |
| `[RSS/DEDUPE]` | Deduplication | GUID-based filtering |
| `[RSS/QUEUE]` | Embedding queue | Publishing to embed queue |
| `[EMBED/WORKER]` | Embedding worker | Voyage AI calls |
| `[DB/INSERT]` | DB insertion | Article + embedding storage |
| `[DB/CLEANUP]` | Semantic cleanup | Duplicate removal |
| `[ERROR]` | Any stage | Error tracebacks |

**Example Log Output:**
```
[SCHEDULER] ----------------------------------------
[SCHEDULER] Initiated next pull phase of news
[RSS/PUBLISHER] ----------------------------------------
[RSS/PUBLISHER] Queueing worldnews and technews pull jobs
[RSS/WORKER] ----------------------------------------
[RSS/WORKER] Started job: worldnews (id: 1-abc123)
[RSS/WORKER] Category: worldnews, sources: 4
[RSS/FETCH] ----------------------------------------
[RSS/FETCH] Feed fetch completed and structured format created
[RSS/DEDUPE] ----------------------------------------
[RSS/DEDUPE] Physical deduplication completed
[RSS/DEDUPE] Articles after dedupe: 45 before dedupe: 120
[RSS/QUEUE] ----------------------------------------
[RSS/QUEUE] Publishing embedding job with article count: 45
[EMBED/WORKER] ----------------------------------------
[EMBED/WORKER] Started embedding job: createEmbedding (id: 2-def456) with 45 items
[EMBED/WORKER] Embedding titles: ["Breaking: ...", "Update: ...", ...]
[DB/INSERT] ----------------------------------------
[DB/INSERT] Starting clean_articles insert for rows: 45
[DB/INSERT] Article titles being inserted: ["Breaking: ...", "Update: ...", ...]
[DB/INSERT] Inserted 38 new News into clean_articles table
[DB/CLEANUP] Deleted 2 items from clean_articles that may be similar
[RSS/WORKER] Completed job: worldnews (id: 1-abc123) with 45 deduped articles
```

---

## 🔄 Pipeline Steps (Detailed)

### 1. **Scheduling** (Every 30 minutes)
- BullMQ scheduler triggers `pollRssFeed()`
- Logs: `[SCHEDULER]`, `[RSS/PUBLISHER]`

### 2. **RSS Fetching** (Per Category)
- Worker receives job with sources array
- Fetches all sources in parallel
- Filters out articles with null/empty GUIDs
- Logs: `[RSS/WORKER]`, `[RSS/FETCH]`

### 3. **Physical Deduplication**
- Queries DB for all GUIDs from current batch
- Filters out any articles already in DB
- Logs reduction count
- Logs: `[RSS/DEDUPE]`

### 4. **Embedding Queue Publication**
- Creates embedding job with article batch
- Publishes to BullMQ queue
- Logs article titles for tracking
- Logs: `[RSS/QUEUE]`

### 5. **Embedding Worker Processing**
- Dequeued from BullMQ (max 1 per minute)
- Calls Voyage AI with batch of articles
- Maps embeddings back to articles
- Inserts to DB
- Logs: `[EMBED/WORKER]`, `[DB/INSERT]`

### 6. **Semantic Cleanup** (Optional)
- After insert, queries for near-duplicates
- Uses cosine similarity: `1 - (embedding1 <=> embedding2) >= 0.80`
- Scoped to articles from last 12 hours
- Deletes older duplicate
- Logs: `[DB/CLEANUP]`

---

## 🛠️ Project Structure

```
.
├── server.ts                          # Express app + scheduler setup
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
│
├── connections/
│   ├── db_connection.ts               # PostgreSQL client
│   ├── reddis_connection.ts           # Redis config
│   └── vogaye_connection.ts           # Voyage AI client
│
├── services/
│   └── rssFeed.ts                     # RSS fetch, dedupe, embed queue logic
│       ├── handleRssFeed()            # Parse RSS sources
│       ├── physicalDedupe()           # Filter by GUID
│       └── createEmbedding()          # Publish to queue
│
├── queues/
│   ├── rss_feed_job.ts               # RSS worker + publisher
│   │   ├── RssQueue/Worker            # Fetch + dedupe orchestration
│   │   └── pullRssFeed()              # Entry point
│   │
│   └── embedding_queue.ts             # Embedding worker
│       └── EmbeddingWorker            # Voyage API calls + DB insert
│
├── sql/
│   └── insert_into_clean_table.ts    # DB insert + semantic cleanup
│
├── utils/
│   └── embeddingsGen.ts               # Unused embedding helper
│
├── Types/
│   └── Api_Types.ts                   # TypeScript interfaces
│
└── Sources.md                         # RSS feed source list
```

---

## 🚨 Known Limitations & TODOs

### Current Limitations
- **Token budget**: Free-tier Voyage AI limits to 10K tokens/min
  - *Solution*: Add payment method or batch articles smaller
- **Single-process deployment**: Queue and workers in same process
  - *Upgrade*: Separate worker processes for horizontal scaling
- **No error dashboard**: Errors logged to console only
  - *Future*: Add error monitoring (Sentry, DataDog, etc.)

### Potential Enhancements
- [ ] Add semantic search endpoint (vector similarity queries)
- [ ] Add article curation/filtering by topic
- [ ] Add subscriber newsletter generation
- [ ] Add Kafka integration for event streaming
- [ ] Add metrics/observability (Prometheus, Grafana)
- [ ] Add API authentication (JWT, API keys)
- [ ] Horizontal scaling (separate worker containers)
- [ ] Add article preview images/thumbnails

---

## 🔗 Resources

- [Voyage AI Docs](https://docs.voyageai.com/)
- [BullMQ Docs](https://docs.bullmq.io/)
- [PostgreSQL pgvector](https://github.com/pgvector/pgvector)
- [RSS Parser Docs](https://www.npmjs.com/package/rss-parser)

---

## 📄 License

ISC

---


**Maintainer**: Bhusal-Ravi

