# Ivera Business Consultant

An AI-powered business analysis and strategic consulting chat application built by **Ivera AI Automation Agency**. Powered by Claude (Anthropic), it acts as a CFO + growth advisor — surfacing key business metrics, identifying churn risks, and delivering clear strategic recommendations in plain English.

---

## What It Does

The agent connects to a company's business data (CRM, payments, analytics) and lets executives and operators ask natural-language questions like:

- "Why did MRR drop this month?"
- "Which accounts are most at risk of churning?"
- "Where should I focus sales effort this week?"

The agent responds with specific numbers, root-cause analysis, and a single recommended action — no fluff.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24 |
| Server | Express 4 |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Vercel (serverless Node) |
| Database | Supabase (PostgreSQL) — configured, not yet wired in |

---

## Project Structure

```
ivera-business-consultant/
├── server.js           # Express server + Claude API + system prompt
├── public/
│   └── index.html      # Single-page chat UI (all CSS/JS inline)
├── package.json
├── vercel.json         # Vercel deployment config
├── .env.example        # Template for environment variables
└── .env                # Your local secrets (never committed)
```

---

## Local Development

### Prerequisites
- Node.js 18+
- An Anthropic API key

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd ivera-business-consultant

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY plus the customer's company name

# 4. Start the server
npm start
```

The server starts at `http://localhost:3001` and prints a startup banner confirming your API key and company name.

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

### Customer Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPANY_NAME` | `Acme SaaS` | Client company name — appears in the UI and is injected into the agent's system prompt |
| `AGENT_NAME` | `Ivera Business Consultant` | Display name shown in the chat UI header |
| `AGENT_VERSION` | `1.0` | Version label shown in the UI |
| `PORT` | `3001` | Local server port |

### Integration Keys (configured, not yet wired into core app)

| Variable | Service |
|----------|---------|
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Twilio SMS/Voice |
| `SYNC_SERVICE_SID` | Twilio Sync |
| `SENDGRID_API_KEY` / `SENDER_EMAIL` / `SENDER_NAME` / `REPLY_TO_EMAIL` | SendGrid email |
| `CAL_API_KEY` / `CAL_BOOKING_URL` / `CAL_EVENT_TYPE_ID` | Cal.com scheduling |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase database |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `EXA_API_KEY` | Exa web search |
| `CONVERSATION_RELAY_BASE_URL` / `RELAY_PORT` | Twilio conversation relay |
| `PUBLIC_BASE_URL` | Public deployment URL |
| `ADMIN_API_KEY` | Internal admin auth |
| `OWNER_EMAIL` / `OWNER_PHONE` | Owner contact info |
| `FTP_HOST` / `FTP_USER` / `FTP_PASSWORD` | FTP access |

---

## API Endpoints

### `POST /api/chat`
Streaming chat endpoint. Accepts conversation history and returns a Server-Sent Events stream.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Why did MRR drop this month?" }
  ]
}
```

**Response:** `text/event-stream`
```
data: {"type":"text","text":"MRR fell from $42,300 to..."}
data: {"type":"done"}
```

### `GET /api/config`
Returns safe, non-secret configuration for the frontend to initialise.

**Response:**
```json
{
  "companyName": "Acme SaaS",
  "agentName": "Ivera Business Consultant",
  "agentVersion": "1.0",
  "hasApiKey": true
}
```

---

## How the Agent Works

The agent is configured via a **system prompt** built in `server.js` (`buildSystemPrompt()`). It contains:

1. The agent's role and persona
2. Connected data sources (CRM, Stripe, GA4)
3. The customer's current business metrics — **this is where you inject real or demo data**
4. Response formatting rules (cite numbers, under 250 words, one action per reply)

**Current state:** Metrics are hardcoded example values for demo purposes. To make the agent reflect real data, replace the metrics block in `buildSystemPrompt()` with live API calls to HubSpot, Stripe, and GA4. See [ONBOARDING.md](./ONBOARDING.md) for the step-by-step process of adding a new customer.

---

## Deployment

The app deploys to Vercel via `vercel.json`. All traffic routes to `server.js`, which Express handles — including serving `/public` static files.

```bash
# Deploy to production
npx vercel --prod

# Add/update an environment variable on Vercel
echo "value" | npx vercel env add VARIABLE_NAME production
```

Current production deployment: `https://ivera-business-consultant.vercel.app`

---

## Agent Response Rules

The agent follows these hard rules (defined in the system prompt):

- Always cite specific numbers — never vague language
- Lead with the single most important finding
- End every response with ONE clear action
- Keep responses under 250 words (unless detailed analysis is requested)
- No markdown headers in responses — plain paragraphs only
- Format: `$XX,XXX` for currency, `XX.X%` for percentages
- State explicitly when data is unavailable

---

## Roadmap / Future Work

- Wire Supabase to persist conversation history per company
- Replace hardcoded metrics with live HubSpot / Stripe / GA4 API calls
- Multi-tenant support (one deployment serving multiple customer instances)
- Twilio integration for SMS-based metric alerts
- SendGrid integration for automated weekly digests
- Cal.com integration for booking follow-up strategy calls
