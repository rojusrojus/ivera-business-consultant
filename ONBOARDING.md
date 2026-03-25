# Onboarding a New Customer

This guide explains exactly how to set up the Ivera Business Consultant for a new client — from collecting their data to having a live, deployed instance they can use.

---

## Overview

Each customer gets their own deployment of the app with:
- Their company name and branding in the UI
- Their real (or demo) business metrics injected into the agent's system prompt
- Their own Vercel environment and URL (or a shared deployment with per-customer routing)

The entire agent behaviour is controlled by the **system prompt** in `server.js`. Customising a customer is primarily about updating that prompt with their data.

---

## Step 1 — Gather Customer Information

Collect the following before starting. You'll need it for the system prompt and environment variables.

### Business Identity
- [ ] Company name (exact, as it should appear in the UI)
- [ ] Industry and business model (SaaS, e-commerce, services, etc.)
- [ ] Key contacts: name, email, phone

### Business Metrics (for demo or live data)
Gather current values for as many of these as possible. For an initial demo you can use estimated/provided numbers; replace with live API data later.

**Revenue**
- Current MRR and prior month MRR
- ARR
- Net Revenue Retention (NRR)
- Expansion MRR

**Customers**
- Total active accounts (and breakdown by tier if available)
- New sign-ups this month vs last month
- Churned accounts this month vs last month
- Churn reasons (from exit surveys or CSM notes)
- Downgraded accounts and MRR impact

**Retention**
- Monthly churn rate (current and prior period)
- Average customer LTV
- Average customer tenure
- At-risk or low-engagement accounts

**Sales Pipeline**
- Total pipeline value and number of open deals
- Stale deals (no activity for 14+ days)
- Close rate (top rep and team average)
- Customer Acquisition Cost (CAC)

**Marketing & Traffic**
- Monthly website sessions
- Trial sign-up conversion rate
- Traffic source breakdown (organic, paid, referral, direct)
- Google Ads ROAS (if running paid)
- Top converting pages

**Product Usage**
- Feature adoption rates
- Features most correlated with retention
- Usage patterns by customer tier

### Connected Data Sources
- [ ] CRM platform (HubSpot, Salesforce, Pipedrive, etc.)
- [ ] Payment platform (Stripe, Chargebee, Recurly, etc.)
- [ ] Analytics platform (GA4, Mixpanel, Amplitude, etc.)

---

## Step 2 — Update the System Prompt

Open `server.js` and locate the `buildSystemPrompt()` function (line 20). This is where all customer data lives.

**Find and replace these sections:**

### 2a. Update the Connected Data Sources block

```js
## Connected Data Sources
- CRM (HubSpot): Pipeline, deals, contacts, close rates, rep performance
- Stripe: MRR, ARR, churn, payment failures, upgrades, downgrades
- Google Analytics 4: Sessions, conversions, traffic sources, funnel drop-off
```

Replace with the customer's actual tools. For example:

```js
## Connected Data Sources
- CRM (Salesforce): Pipeline, deals, contacts, close rates
- Chargebee: MRR, ARR, churn, subscription lifecycle
- Mixpanel: Product usage, feature adoption, funnel drop-off
```

### 2b. Replace the metrics block

Replace everything under `## Current Metrics` with the customer's real numbers. Use the template below as a starting point — delete any sections where data is unavailable and note it explicitly.

```js
## Current Metrics — ${companyName} (Month Year)

### Revenue
- MRR: $XX,XXX (up/down from $XX,XXX last month = X.X%)
- ARR run rate: $XXX,XXX
- Net Revenue Retention: XX%
- Expansion MRR this month: $X,XXX

### Customers
- Total Active Accounts: XXX
  - Enterprise (>$X,XXX/mo): XX accounts
  - Mid-Tier ($XXX-X,XXX/mo): XX accounts
  - Starter (<$XXX/mo): XX accounts
- New sign-ups this month: XX (up/down from XX last month)
- Churned accounts this month: XX
  - Combined lost MRR: $X,XXX/month
  - Top churn reasons: "[reason 1]", "[reason 2]", "[reason 3]"

### Retention & Churn
- Monthly churn rate: X.X% (up/down from X.X% prior month)
- Average Customer LTV: $X,XXX
- Average Customer Tenure: XX months
- At-risk accounts (low engagement): X currently flagged
  - [Account Name]: [reason — e.g., zero sessions this week]

### Sales Pipeline
- Total pipeline value: $XXX,XXX across XX open deals
- XX late-stage deals (>$XX,XXX each) stale for XX+ days
- Top sales rep close rate: XX% | Team average: XX%
- CAC (blended): $XXX

### Marketing & Traffic
- Monthly sessions: X,XXX
- Trial sign-up conversion: X.X%
- Traffic sources: Organic XX%, Paid XX%, Referral XX%, Direct XX%
- Google Ads ROAS: X.Xx
- Top converting pages: /[page1] (X.X%), /[page2] (X.X%)

### Product Usage
- [Key usage insight 1]
- [Key usage insight 2]
- Feature most correlated with retention: "[Feature Name]"
```

### 2c. Update the agent role description (optional)

If the customer has specific focus areas, update the `## Your Role & Behaviour` section to emphasise what matters most to them (e.g., "Focus primarily on expansion revenue opportunities" or "Prioritise churn prevention above all else").

---

## Step 3 — Configure Environment Variables

### Local (for testing)

Edit the `.env` file:

```bash
COMPANY_NAME=Actual Customer Name
AGENT_NAME=Ivera Business Consultant
AGENT_VERSION=1.0
ANTHROPIC_API_KEY=sk-ant-api03-...
PORT=3001
```

Start the server and verify the agent responds correctly:

```bash
npm start
```

Open `http://localhost:3001` and test with a few key questions:
- "Give me a summary of this month's performance"
- "What's driving churn?"
- "What should I focus on this week?"

---

## Step 4 — Deploy to Vercel

### Option A — New Vercel Project (dedicated deployment per customer)

Best for customers who need their own URL or want isolation.

```bash
# From the project root, initialise a new Vercel project
npx vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: ivera-consultant-[customername]
# - Root directory: ./
# - Override build settings? No
```

Then add all environment variables:

```bash
# Add each variable (run once per variable)
echo "Actual Customer Name" | npx vercel env add COMPANY_NAME production
echo "your-api-key" | npx vercel env add ANTHROPIC_API_KEY production
# ... repeat for all required variables
```

Deploy:

```bash
npx vercel --prod
```

### Option B — Update existing project

If using the shared `ivera-business-consultant` Vercel project, update the env vars and redeploy:

```bash
# Remove old value first, then re-add
npx vercel env rm COMPANY_NAME production
echo "New Customer Name" | npx vercel env add COMPANY_NAME production

# Redeploy
npx vercel --prod
```

---

## Step 5 — Verify the Deployment

After deploying, confirm the following:

1. **UI loads correctly** — Open the production URL and check the header shows the customer's company name and agent name.

2. **API key is active** — The startup banner (visible in Vercel build logs) should show `API Key: ✓ Loaded`. If missing, check `ANTHROPIC_API_KEY` is set.

3. **Agent uses correct data** — Ask: *"What is our current MRR and how has it changed?"* The agent should return the exact numbers you put in the system prompt.

4. **Streaming works** — Responses should appear word-by-word, not all at once.

5. **Config endpoint** — Visit `/api/config` in the browser and confirm `companyName` and `hasApiKey: true` are correct.

---

## Step 6 — Hand Off to Customer

Provide the customer with:

- **Live URL** (e.g., `https://ivera-business-consultant.vercel.app`)
- **Quick-start questions** — a short list of 5–10 prompts that showcase the agent's value for their specific situation
- **What the agent knows** — a one-page summary of the data sources and metrics it has access to
- **What it doesn't know yet** — any metrics you couldn't source (so they don't try to ask and get confused)

---

## Updating Customer Data

Business metrics change monthly. To keep the agent accurate:

1. Open `server.js`
2. Update the metrics values in `buildSystemPrompt()` with the latest numbers
3. Commit and push (or deploy directly):

```bash
npx vercel --prod
```

There is no hot-reload for system prompt changes — a redeploy is required. A future improvement would be to store metrics in Supabase and load them dynamically at request time, removing the need to redeploy for data updates.

---

## Checklist Summary

```
PREP
[ ] Collect company name, metrics, and connected data sources
[ ] Confirm which CRM, payment, and analytics tools they use

CODE
[ ] Update Connected Data Sources block in buildSystemPrompt()
[ ] Replace all metrics in buildSystemPrompt() with customer data
[ ] Adjust agent behaviour notes if needed

ENV
[ ] Set COMPANY_NAME in .env (local) and Vercel (production)
[ ] Confirm ANTHROPIC_API_KEY is valid and has quota

TEST
[ ] npm start locally — verify startup banner shows correct company
[ ] Chat test: ask for MRR, churn summary, and a recommendation
[ ] Confirm agent cites specific numbers from the metrics you added

DEPLOY
[ ] npx vercel --prod
[ ] Verify production URL loads with correct company name
[ ] Check /api/config returns correct company name and hasApiKey: true

HAND OFF
[ ] Share URL with customer
[ ] Send quick-start prompt list
[ ] Document what data is and isn't available to the agent
```
