# Creator Analytics Dashboard

A real-time YouTube creator analytics dashboard for brand partnership teams. Discover top-performing creators by niche, analyze engagement metrics, identify outreach contacts, and flag problematic channels ? all from live YouTube Data API data.

---

## What It Does

1. **Select a niche** (travel, food, makeup, fitness, tech, etc.)
2. **Click "Fetch from YouTube"** ? the backend searches YouTube for that topic, pulls channel stats and video data, computes engagement metrics, and stores everything
3. **Explore the dashboard** ? sortable creator table, engagement charts, top-performer rankings
4. **Click any creator** ? modal with full profile: engagement rate, avg views/likes/comments, recent videos, extracted contact emails, alert flags

---

## Quick Start (Under 5 Minutes)

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [YouTube Data API v3 key](https://console.cloud.google.com/) (free, 10,000 quota units/day)

### 1. Clone & set up environment

```bash
git clone <repo>
cd creator-analytics

# Backend
cd backend
cp .env.example .env
# Edit .env and add your YOUTUBE_API_KEY
```

### 2. Start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Fetch your first data

1. Click a topic (e.g., **Travel**)
2. Click **"Fetch from YouTube"**
3. Wait ~5 seconds for data to populate
4. Explore creators, sort by engagement, click to see profiles

---

## Docker (Alternative)

```bash
# Create backend/.env with your API key first
docker-compose up --build
```

Frontend at `http://localhost:5173`, backend at `http://localhost:8000`.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/topics` | GET | List all topic categories |
| `/api/creators` | GET | List creators with filters |
| `/api/creators/{id}` | GET | Full creator profile + videos |
| `/api/analytics` | GET | Aggregated stats, top performers, alerts |
| `/api/creators/fetch` | POST | Trigger YouTube data pull |
| `/api/fetch/status` | GET | Check in-progress fetches |

### Creator Filters

```
GET /api/creators?topic=travel&min_engagement=2.0&min_subscribers=10000&has_email=true&sort_by=engagement_rate&order=desc&page=1&limit=20
```

---

## Data Source

**YouTube Data API v3** ? official Google API, real-time data.

**How data flows:**
1. `POST /api/creators/fetch?topic=travel` triggers a background task
2. Backend calls `search.list` (100 quota) ? gets 25 top videos for the topic
3. Extracts unique channel IDs ? calls `channels.list` (1 quota) for channel stats
4. Calls `videos.list` (1 quota) for video engagement stats
5. Computes engagement rate: `(avg_likes + avg_comments) / avg_views � 100`
6. Extracts business emails via regex from channel descriptions
7. Stores in SQLite, flags anomalies

**Total cost per topic fetch:** ~102 quota units (well within 10,000/day free tier)

---

## Engagement Rate

```
Engagement Rate = (avg_likes + avg_comments) / avg_views � 100
```

Industry benchmarks:
- **< 1%** ? Low (flagged as alert)
- **1?2%** ? Average
- **2?5%** ? Good
- **> 5%** ? Excellent

---

## Alert Flags

| Flag | Condition | Meaning |
|---|---|---|
| Low Engagement | Rate < 1% with > 1K views | Audience isn't engaged ? verify before spending |
| Suspicious Subs | Avg views < 5% of sub count | Possible fake/bought subscribers |
| Inactive | No videos in 90 days | Channel may be abandoned |

---

## Architecture

```
+-----------------+     +-----------------------------+
|  React Frontend |---->|  FastAPI Backend             |
|  (TypeScript)   |<----|  - /api/creators             |
|  Recharts       |     |  - /api/analytics            |
|  Tailwind CSS   |     |  - /api/creators/fetch       |
+-----------------+     |                             |
                        |  SQLite (via SQLAlchemy)    |
                        |  APScheduler (polling)      |
                        +-------------+---------------+
                                      |
                              +-------v--------+
                              | YouTube Data   |
                              | API v3         |
                              +----------------+
```

---

## Tech Decisions & Tradeoffs

### Why FastAPI over Django/Flask?
Async support, automatic OpenAPI docs, Pydantic validation. For a data-heavy analytics API, the type safety and auto-docs matter.

### Why SQLite over PostgreSQL?
Zero-config local setup satisfies the "run in 5 minutes" requirement. The schema is ready for Postgres ? just change `DATABASE_URL` in `.env`. For production, I'd use Postgres with proper indexing on `topic`, `engagement_rate`, and `subscriber_count`.

### Why compute engagement from search results instead of fetching all channel videos?
YouTube search API returns the most-viewed/recent videos for a channel, which are more representative than averaging all-time content. Fetching all videos would cost 100x the quota. The sample we get is a reasonable signal.

### Why SQLite for snapshots instead of a time-series DB?
Simplicity. For production scale I'd use TimescaleDB or InfluxDB for the engagement snapshots table.

### What I'd build next with more time
1. **Scheduled pulls** ? APScheduler to re-fetch each topic every 6 hours automatically
2. **Multi-platform** ? Instagram Graph API, TikTok Research API (same schema, different fetchers)
3. **Campaign tracking** ? manually tag a creator as "in campaign", track performance over time
4. **Webhook alerts** ? Slack/email notification when a creator's engagement drops > 20% week-over-week
5. **Audience demographics** ? use YouTube Analytics API (requires OAuth, not just API key)
6. **Similarity matching** ? given a brand brief, rank creators by fit score

---

## Understanding the Data

This tool is designed for brand partnership managers who need to answer:
- *"Which travel creators have the best engagement for the budget?"*
- *"Do they have a contact email?"*
- *"Are their subscribers real?"*
- *"Have they been consistent?"*

The dashboard surfaces those answers without requiring anyone to manually check 50 YouTube channels.
