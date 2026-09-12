# Tech Stack
 
Planned to scale to at least 50,000 users. One language (TypeScript) across frontend, backend, and AI logic, one relational database, no paid third-party auth vendor. Free tiers work for early development; the architecture is designed to hold up as usage grows without a rewrite.
 
## Frontend
 
- **React + TypeScript**, bootstrapped with **Vite**
- Plain React app, not Next.js — since frontend and backend are kept as separate services, Vite avoids framework routing/rendering conventions you don't need
- Deploy: **Vercel** or **Netlify** (free tier)
## Backend
 
- **Node.js + Express + TypeScript**
- Single service handling: API routes, authentication, and RAG/LangChain logic
- **Stateless by design** (JWT, no server-side sessions) — this is what lets it run as multiple instances behind a load balancer without any session-affinity work
- Deploy: **Render** or **Railway** to start; autoscaled multi-instance deployment (Render/Railway autoscale, or Fly.io/ECS) once traffic grows
- **Rate limiting**: `express-rate-limit` backed by Redis on any AI-calling route (chatbot, per-word lookup), so cost scales predictably with real usage, not abuse
- **File storage** (for community-contributed images/screenshots, feature G): **Cloudflare R2** — S3-compatible API, free egress
## RAG / AI layer
 
- **LangChain.js**, running inside the same Express service (no separate Python worker)
- Retrieval: queries Postgres + pgvector
- Generation: behind a **provider-agnostic interface** — see *Model provider* below
- Can be split into its own service later if it becomes a bottleneck — not needed for v1

### Model provider

> Updated 2026-09-12. A Claude Pro subscription covers building this project with
> Claude Code; it does **not** include API access. The app's own runtime calls
> need their own key and bill.

**Development: Google Gemini free tier** (AI Studio, no card required). Chosen for
two reasons beyond being free — strong Hindi and Devanagari handling, which two of
the three language modes depend on, and free embeddings.

Indicative free limits (they move; confirm before relying on them): Gemini 2.5 Pro
5 RPM / 100 RPD · 2.5 Flash 10 RPM / 250 RPD · 2.5 Flash-Lite 15 RPM / 1,000 RPD ·
Gemini 3 Flash 10 RPM / 1,500 RPD.

**Free-tier caveat**: Google may use free-tier prompts and responses to improve
their products. Acceptable for song meanings; requires a privacy statement for
chatbot conversations, or a move to the paid tier.

**One model does not fit all five jobs:**

| Job | Frequency | Choose for |
|---|---|---|
| Embeddings | Constant | Cost — quality gap is small |
| **Explanation generation** | Once per song, **cached forever** | **Quality.** See below |
| Three language renderings | Once per song | Hindi fluency |
| Chatbot | Per user, ongoing | Cost and latency |
| Contribution review | Batch, scheduled | Cost |

**Why generation is the exception**: explanations are cached permanently
(objective.md, feature C), so the generating model's quality is baked into the
knowledge base for good. A weak model means a permanently mediocre catalogue, and
regenerating later costs full price again for every song. The chatbot is
ephemeral; the catalogue is not.

**Cost shape**: because of feature C, the API bill scales with **catalogue size,
not user count**. 10,000 users reading 500 cached songs costs the same as 10 users
reading them. The chatbot is the only per-user ongoing cost — which is why it is
Pro-gated.

**Requirements**:

- All model calls go through one internal interface. Switching provider is a new
  adapter, never a rewrite. No provider SDK types leak into application code.
- Provider and model are **configuration per job**, not constants — the five jobs
  above may use different models and may move independently.
- Also viable: **Groq** free tier (fast, good for the chatbot), **Ollama** locally
  (unlimited and private — best for developing the pipeline without burning
  quota on every test run), **Anthropic API** pay-as-you-go.
- Re-evaluate the generation model specifically before researching the catalogue
  at scale. That is the decision that cannot be cheaply undone.
## Background jobs & caching
 
- **Redis**, doing double duty as:
  - **Job queue** (via **BullMQ**) — regenerating stale explanations (feature C/G interaction) and running the scheduled community-contribution review (feature G) happen as background jobs, not inline in the request. This avoids duplicate work when multiple users hit a stale song at once, and avoids a scheduled task firing once per API instance.
  - **Cache** — hot song/word lookups are served from Redis in front of Postgres, and it backs per-user rate limiting on AI-calling endpoints (chatbot, per-word lookup) so cost can't run away.
- This is the one piece of new infrastructure added specifically for scale; everything else stays the same as the base stack.
## Database
 
- **PostgreSQL** with the **pgvector** extension
- One database for everything: users, songs, words, explanations, embeddings, contributions
- Hosting: **Neon** free tier to start; move to Neon's paid Scale plan (or self-hosted Postgres on a VM/RDS) once past early development — same engine, same schema, no migration rewrite
- Plain SQL underneath — no vendor lock-in, easy to move providers later
## Authentication
 
- **Google OAuth** for login (free, not a third-party auth vendor)
- Verify Google's ID token server-side with `google-auth-library` (npm)
- Issue your own session token with `jsonwebtoken` (npm) — your own JWT, your own secret
- No Auth0 / Clerk / Firebase Auth — auth logic lives entirely in your Express middleware
## Payments — PENDING YOUR APPROVAL

> Added 2026-09-12 because the Basic/Pro plans need a payment provider and this
> stack doesn't have one yet. **Nothing has been decided or built here.** Full
> comparison in [`docs/subscription_plans.md`](docs/subscription_plans.md) §6.

- **Recommended: Razorpay**, if the launch market is India. At ₹199/month, UPI
  autopay is the difference between a subscription that converts and one that
  doesn't — Indian users largely don't keep cards on file, and Stripe's recurring
  UPI support is limited. Stripe wins if international is the priority.
- Either way: the provider sits behind a thin internal interface, so switching
  later is a new adapter rather than a rewrite.
- **The webhook is the source of truth** for subscription state, never the
  browser redirect. Handlers are idempotent and signature-verified.
- Fits the existing stack with no new infrastructure — webhook endpoint on the
  Express service, subscription state in Postgres.

## Hosting summary
 
| Layer | Early stage | At 50k-user scale |
|---|---|---|
| Frontend | Vercel / Netlify (free) | Same — scales automatically |
| Backend (Express + LangChain) | Render / Railway free tier, single instance | Multiple stateless instances behind a load balancer |
| Background jobs | — | BullMQ workers (separate process from the API) |
| Cache / queue | — | Redis |
| Database | Neon free tier | Neon Scale plan / managed Postgres, same schema |
| Auth | Google OAuth (self-verified) | Same — already stateless, already scales |
| File storage | — | Cloudflare R2 |
| AI generation | Gemini free tier (Ollama for local pipeline testing) | Paid tier, per-job model choice, guarded by rate limiting |
 
## Why this over the original Next.js + Supabase suggestion
 
- **One language** (TypeScript) everywhere — no Node/Python context-switching
- **One database** for relational data and vectors — no separate vector DB account
- **No paid/third-party auth vendor** — Google OAuth + self-issued JWTs
- **Two deployable units** (frontend, backend) instead of three
- **No vendor lock-in** — Postgres is portable; Supabase ties you to its platform and starts charging ($25/mo Pro plan) once you outgrow the free tier's 500 MB / 1-week-inactivity limits
 