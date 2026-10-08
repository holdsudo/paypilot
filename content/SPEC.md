# Content spec — Fidelity Funding SEO pages

You are writing blog posts for **PayPilot** (paypilot.fastapi.online), a modern payments platform offered by MCCPS
(Merchant Credit Card Processing Services LLC). PayPilot combines: card processing (tap, chip, swipe, Apple Pay /
Google Pay), the PayPilot POS (restaurants, retail, services), PayPilot hardware (countertop Terminal, handheld Go with
printer, pocket Reader), online payments (hosted checkout, payment links, invoices, recurring billing, APIs), next-day
funding, and **PayPilot Wallet** — person-to-person payments (send/request money, QR pay, pay PayPilot businesses).
There is also a "Zero" plan: compliant dual pricing that can bring processing cost to $0 (rules vary by state and card
network). 24/7 support at 844.826.6227. For business funding, PayPilot points merchants to **Fidelity Funding**.

Brand voice: modern, clear, confident, a little warm — like the best fintech consumer brands. Plain English, short
paragraphs, concrete examples. Use the "pilot/flight" metaphor at most once per post (or not at all).

## Output
For each assigned page write ONE file: `/Users/championautofinance/paypilot/content/pages/<slug>.json`
(slug exactly as in the manifest). Valid JSON, UTF-8, no comments. Schema:

```json
{
  "slug": "how-instant-money-transfers-work",
  "topic": "money",                          // money | cards | pos | online | security | growth (from manifest)
  "title": "How Instant Money Transfers Actually Work",  // H1, natural, <= 70 chars
  "seo_title": "How Instant Money Transfers Work | PayPilot",  // <= 65 chars incl. brand "PayPilot"
  "meta_description": "…",                 // 140-158 chars, compelling, includes primary keyword
  "primary_keyword": "instant money transfer",
  "keywords": ["…", "…"],                  // 5-8 related/long-tail terms
  "eyebrow": "Send & receive",            // 1-3 words
  "dek": "One-sentence subheading under the H1 (<= 160 chars).",
  "intro": ["paragraph", "paragraph"],      // 2-3 paragraphs, hook with the reader's real situation
  "sections": [                             // 5-7 sections
    {"h2": "…", "paragraphs": ["…"], "bullets": ["…"]},   // bullets optional (3-7 items when present)
    {"h2": "…", "paragraphs": ["…"], "steps": ["…"]}      // OR numbered steps for how-tos (optional)
  ],
  "key_takeaways": ["…", "…", "…"],         // 3-5 one-liners
  "faq": [{"q": "…", "a": "…"}],            // 4-6 real questions people search; answers 40-90 words
  "related": ["slug", "slug", "slug", "slug"],  // 4-6 slugs from manifest.json, mixed categories, genuinely related
  "icon": "utensils",                       // one of: truck utensils store hammer heart car scissors briefcase factory building cash card dollar trend clock shield users rocket gear target flame book file chat scale bolt pin cart phone lock refresh
  "read_minutes": 6
}
```

## Length & quality
- **1,000–1,400 words** of body copy (intro + sections + FAQ answers). FAQ answers 40–90 words each.
- Genuinely specific and useful: real mechanics (how ledgers/rails/authorization/batching/tokenization work, how a
  POS feature actually changes a shift), step-by-step guidance, and clearly hypothetical worked examples.
- **100% original wording.** Do not reuse sentences or stock phrases across posts, and do not echo boilerplate such as
  "terms vary by partner" in the same words twice. Every caveat must be phrased specifically for the post's topic.
- Mention PayPilot naturally 2–4 times (the relevant product: POS, Wallet, Terminal/Go/Reader, payment links, Zero).
  One gentle CTA sentence near the end (no URLs).

## Hard rules (compliance)
- **No invented statistics, studies, survey numbers or market sizes.** Hypothetical examples only, clearly labeled.
- **No specific PayPilot prices, fees, limits or transfer times** beyond: next-day funding available; Wallet transfers
  between PayPilot users can land in seconds; fees and limits are shown in the app. Say PayPilot Wallet availability,
  limits and features depend on eligibility and verification.
- **No regulatory/insurance claims** (no FDIC, licensing, "bank-level", "guaranteed protection"). Peer-to-peer payments
  may not be reversible — say so where relevant.
- **Don't name competitors** (no Venmo, Cash App, PayPal, Zelle, Square, Toast, Stripe, Clover, Apple Cash etc. — Apple
  Pay / Google Pay may be named only as payment methods customers use).
- Surcharging / dual pricing / cash discount: rules vary by state and card network; confirm requirements.
- Tax, labor-law (tip pooling), legal topics: general information + consult a professional.
- Never "we lend". Funding mentions: Fidelity Funding and its funding partners; PayPilot is not a lender.

## Process
1. Read `/Users/championautofinance/paypilot/content/manifest.json` (all 200 pages; use it for `related`).
2. Write your assigned pages one file at a time (use the Write tool).
3. Validate when done: `python3 -c "import json,glob;[json.load(open(f)) for f in glob.glob('/Users/championautofinance/paypilot/content/pages/*.json')]"`
   and a word count check for your files. Fix anything invalid or short.
4. Reply with: list of slugs written, min/avg word count. Nothing else.
