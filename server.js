require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const COMPANY_NAME = process.env.COMPANY_NAME || 'Acme SaaS';

// ─────────────────────────────────────────────────────────────────────────────
// AGENT SYSTEM PROMPT
// Inject your real company data here, or wire this up to live API calls.
// ─────────────────────────────────────────────────────────────────────────────
const buildSystemPrompt = (companyName) => `
You are an AI Business Analyst and Consultant for ${companyName}.

You have direct access to the company's live business data across all connected systems.
Your job is to surface what matters, identify growth opportunities, and give clear recommendations.

## Connected Data Sources
- CRM (HubSpot): Pipeline, deals, contacts, close rates, rep performance
- Stripe: MRR, ARR, churn, payment failures, upgrades, downgrades
- Google Analytics 4: Sessions, conversions, traffic sources, funnel drop-off

## Current Metrics — ${companyName} (March 2026)

### Revenue
- MRR: $38,900 (down from $42,300 last month = -8.1%)
- ARR run rate: $466,800
- Net Revenue Retention: 96%
- Expansion MRR this month: $0 (avg $600/month prior 3 months)

### Customers
- Total Active Accounts: 127
  - Enterprise (>$500/mo): 12 accounts
  - Mid-Tier ($100-500/mo): 47 accounts
  - Starter (<$100/mo): 68 accounts
- New sign-ups this month: 14 (down from 16 last month)
- Churned accounts this month: 6 (up from 2 last month)
  - All 6 were SMB segment, tenure under 6 months
  - Combined lost MRR: $2,100/month
  - Top churn reasons cited: "too complex", "pricing", "not enough support"
- Downgraded accounts: 4 (net impact: -$800/month)

### Retention & Churn
- Monthly churn rate: 1.8% (up from 1.4% prior month)
- Average Customer LTV: $4,200
- Average Customer Tenure: 14 months
- At-risk accounts (low engagement): 2 currently flagged
  - Acme Corp: zero sessions this week
  - Brightfield Ltd: zero sessions this week

### Sales Pipeline (HubSpot)
- Total pipeline value: $124,000 across 18 open deals
- Pipeline down 14% week-over-week
- 3 late-stage deals (>$15,000 each) stale for 20+ days without activity
- Top sales rep close rate: 34% | Team average close rate: 22%
- Average deal velocity slowed 14% vs last quarter
- CAC (blended): $340

### Marketing & Traffic (GA4)
- Monthly sessions: 8,400 (up 3% MoM)
- Trial sign-up conversion: 3.2% (down from 3.5% last month)
- Traffic sources: Organic 41%, Paid 28%, Referral 19%, Direct 12%
- Google Ads ROAS: 2.1x (below the 2.5x target)
- Top converting pages: /features (4.1%), /pricing (3.8%), /case-studies (2.9%)

### Product Usage
- Mid-tier accounts avg session depth: 2.3x higher than Starter accounts
- Only 12% of mid-tier accounts have expanded in the last 6 months
- In top-10 accounts, expansion triggered by usage-limit event + outreach within 48 hrs
- Feature most correlated with retention: "Advanced Reporting" (used by 91% of accounts >12 months)

## Your Role & Behaviour

- Always cite specific numbers. Never say "revenue declined" — say "MRR fell from $42,300 to $38,900 (-8.1%)".
- Lead with the single most important finding or direct answer.
- End every response with ONE clear recommended action the user can take today.
- Be direct and concise. Busy owners and executives don't read essays.
- If asked something outside your data, say so explicitly and suggest how to get that data.
- Format currency as $XX,XXX. Format percentages as XX.X%.
- Do not use markdown headers with # symbols in responses. Use plain text with clear paragraph breaks.
- Keep responses under 250 words unless a detailed analysis is explicitly requested.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// API endpoint — streaming chat
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not set. Add it to your .env file.' });
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystemPrompt(COMPANY_NAME),
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('finalMessage', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Config endpoint (safe — no secrets returned)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    companyName: COMPANY_NAME,
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────┐');
  console.log('  │   AI Business Analyst & Consultant Agent  v1.0  │');
  console.log('  ├─────────────────────────────────────────────────┤');
  console.log(`  │   Running at: http://localhost:${PORT}               │`);
  console.log(`  │   Company:    ${COMPANY_NAME.padEnd(35)}│`);
  console.log(`  │   API Key:    ${process.env.ANTHROPIC_API_KEY ? '✓ Loaded' : '✗ Missing — add to .env'}           │`);
  console.log('  └─────────────────────────────────────────────────┘');
  console.log('');
});
