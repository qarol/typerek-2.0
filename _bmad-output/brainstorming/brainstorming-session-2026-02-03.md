---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Private soccer prediction web app for a closed friend group with timed visibility rules, points scoring, and tournament-scoped gameplay'
session_goals: 'Tech stack and framework selection, frontend-backend architecture decisions, real-time features approach, data source identification'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Morphological Analysis', 'Six Thinking Hats']
ideas_generated: 27
context_file: ''
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** Karol
**Date:** 2026-02-03

## Session Overview

**Topic:** Private soccer prediction web app for a closed friend group with timed visibility rules, points scoring, and tournament-scoped gameplay

**Goals:**
- Explore tech stacks and frameworks suitable for this type of app
- Evaluate monolith vs. split frontend/backend architecture
- Consider real-time aspects (bet locking at kickoff, visibility toggling)
- Identify data sources for match schedules/results
- Keep scope appropriate for a friend-group hobby project

### Context Guidance

_No external context file provided — working from session conversation._

### Session Setup

_AI-Recommended technique approach selected. Facilitator will suggest techniques tailored to the technical architecture brainstorming goals._

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Private soccer prediction web app with focus on tech stack, architecture, real-time features, and data sources

**Recommended Techniques:**

- **First Principles Thinking:** Strip away assumptions to identify irreducible core requirements before making tech decisions
- **Morphological Analysis:** Systematically map all tech stack dimensions and explore combinations across a parameter grid
- **Six Thinking Hats:** Evaluate top architecture candidates from 6 perspectives — facts, emotions, risks, benefits, creativity, process

**AI Rationale:** The project has a clear domain but many valid technical paths. This sequence prevents over-engineering by anchoring in true requirements first, then systematically exploring the solution space, and finally evaluating options from multiple angles to reach a well-reasoned decision.

## Technique Execution Results

### First Principles Thinking

**Interactive Focus:** Stripping away assumptions to find the irreducible core requirements of the app

**Key Breakthroughs:**

- **[Architecture #1]**: Odds-Driven Points System — Points mirror real bookmaker odds (1.01, 9.5, etc.), making the scoring engine dependent on external odds data imported per match by admin.
- **[Architecture #2]**: Configurable Scoring Engine — Different deployments can have different rules for how points are calculated. Scoring logic must be abstracted, not hardcoded.
- **[Architecture #3]**: Compound Bet Types (1, X, 2, 1X, X2, 12) — 6-option prediction model. Combination bets cover two outcomes (e.g., 1X wins if home win OR draw). Engine resolves compound outcomes.
- **[Architecture #4]**: Manual Admin-Driven Data Entry — No external APIs needed. Admin manually enters team names, match dates, odds per bet type, and final scores through dashboard.
- **[Architecture #5]**: Progressive Tournament Structure — Group stage matches known upfront, knockout rounds revealed as tournament progresses. Match list grows during the event.
- **[Architecture #6]**: Open Source Self-Hosted Model — Distribution is "git clone + run it yourself." No multi-tenancy. Each friend group operates their own instance.
- **[Architecture #7]**: Passive Time-Based Lock — The "lock" is a passive rule: every API request checks `if NOW >= match.kickoff_time, reject modifications and reveal all bets`. No cron jobs, no WebSockets, no scheduled tasks needed.
- **[Architecture #8]**: No Default Bets — Missing a deadline = 0 points. No synthetic bets, no penalties. Absence of data IS the data.
- **[Architecture #9]**: Token-Based Invite Auth — Admin creates nickname, app generates unique invite URL with token, admin shares link externally, user opens link and sets password. No email, no OAuth.
- **[Architecture #10]**: Modern SPA with High UX Bar — No page refreshes. Modern, responsive, intuitive UI on phone and desktop. Pushes firmly toward separate frontend framework.
- **[Architecture #11]**: Live Leaderboard / Rankings — Ranked player list sorted by accumulated points. The app's central "heartbeat" view.
- **[Architecture #12]**: Player History / Analytics View — Per-user view showing complete betting history: each match, what they bet, result, points earned or missed.

**Fundamental Discovery:** The app does NOT need real-time features at its core. No WebSockets, no push notifications, no event-driven architecture. It's a request-response CRUD app where the server checks a timestamp on every relevant operation.

### Morphological Analysis

**Interactive Focus:** Systematically mapping every tech dimension and exploring combinations

**Complete Decision Grid:**

| Dimension | Decision | Reasoning |
|---|---|---|
| Architecture | Separate SPA + API | Modern SPA requires it; clear separation of concerns |
| Backend | Rails API mode (Ruby) | Karol's strongest language; security confidence; fast to build |
| Frontend | Vue 3 (Composition API) | Most approachable for backend devs; template syntax feels natural |
| Database | PostgreSQL | Rails convention; robust; trivial in Docker Compose |
| UI Library | PrimeVue | Flexible themes; massive component set; professional look without design skills |
| Auth | Session cookies (HttpOnly) | Simplest and most secure behind nginx; no token storage complexity |
| API Style | REST | Natural fit for Rails; well-understood; easy to debug |
| Deployment | Docker Compose (nginx + rails + postgres) | nginx serves Vue static build + proxies /api to Rails; single domain for cookies |
| Repo Structure | Monorepo | `/backend`, `/frontend`, `docker-compose.yml` at root; clone once, run once |

**Key Decision Drivers:**

- **Security confidence** drove backend choice — Karol must be able to audit every line and verify the 4 critical server-side guards
- **Frontend approachability** drove Vue choice — template syntax most natural for backend developers
- **Deployment simplicity** drove Docker Compose + monorepo — `git clone && docker compose up` is the gold standard for self-hosted open source
- **UX quality bar** drove PrimeVue choice — 80+ polished components (DataTable, Card, Dialog) without CSS expertise

### Six Thinking Hats

**Interactive Focus:** Stress-testing the complete architecture from 6 perspectives

**White Hat (Facts):**
- Rails API mode is mature with thousands of production apps
- Vue 3 + PrimeVue provides 80+ components including everything the app needs
- PostgreSQL handles 5-15 concurrent users effortlessly
- Docker Compose is the standard for self-hosted open source apps

**Red Hat (Gut Feeling):**
- Backend feels safe and fast to build — Karol will be in his element
- Frontend is the right amount of challenge — Vue is approachable, PrimeVue provides polish
- Deployment feels clean — one `docker compose up` and running
- Whole stack feels appropriately scoped — no over-engineering

**Black Hat (Risks):**
- Two languages (Ruby + JavaScript) — context switching and no shared types
- Nginx misconfiguration could break session cookies — but manageable on single domain
- Frontend learning curve — Vue is approachable but first days will be slow
- PrimeVue theming may require CSS overrides
- Open source contributors need Ruby AND JavaScript knowledge

**Yellow Hat (Benefits):**
- Security confidence — every line of Rails code auditable
- Speed to MVP — Rails scaffolding + ActiveRecord for fast backend
- Deployment simplicity — `git clone && docker compose up`
- Professional UI — PrimeVue without design skills
- Proven stack — nothing experimental, years of production use

**Green Hat (Creative Alternatives):**
- PWA capability — Vue + Vite can generate Progressive Web App with minimal config; friends "install" from browser
- API versioning — `/api/v1/` namespacing from day one for different deployment versions
- Seed data — `rails db:seed` with sample tournament so new deployers see working app immediately

**Blue Hat (Process):**
- Stack is solid, well-matched to skills, appropriately scoped
- Main risk (frontend learning curve) mitigated by Vue + PrimeVue choices
- No red flags found — architecture holds up under scrutiny

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1: Core Domain Model**
_The irreducible rules that define the app_

- Compound Bet Types (1, X, 2, 1X, X2, 12) — 6-option enum per match per user
- Odds-as-Points — real bookmaker odds copied manually as point values
- Configurable Scoring Engine — rules abstracted per deployment
- Passive Time-Based Lock — `reject if NOW >= kickoff_time`, no cron jobs
- No Default Bets — absence of data is the answer
- Exact Score Bonus — optional layer on top of main bet type (rules TBD)

**Theme 2: Tech Stack**
_The locked-in technical decisions_

- Rails API mode (Ruby) — security confidence, speed to build
- Vue 3 (Composition API) — approachable for backend developers
- PostgreSQL — Rails convention, battle-tested
- PrimeVue — professional components out of the box
- Session cookies — simplest, most secure behind nginx
- REST API — natural fit for Rails

**Theme 3: Architecture & Deployment**
_How it's structured and shipped_

- Separate SPA + API — Vue frontend, Rails backend, clear boundary
- Monorepo — `/backend`, `/frontend`, `docker-compose.yml` at root
- Three containers — nginx (serves Vue build + proxies API), Rails, PostgreSQL
- Open source self-hosted — `git clone && docker compose up`

**Theme 4: User Management & Security**
_Auth, roles, and the 4 server-side guards_

- Invite-only auth — admin creates nickname, generates invite URL, user sets password
- No email, no OAuth — username + password only
- 4 critical server-side guards: bet mutation lock, bet visibility toggle, ownership check, admin role check
- Adversarial security model — friends will actively try to exploit the system

**Theme 5: User Experience & Views**
_What users see and interact with_

- Live Leaderboard — ranked player list, the app's heartbeat
- Player History View — per-user betting record, match-by-match breakdown
- Admin Dashboard — create matches, enter teams/odds/scores, manage users
- Modern SPA — no page refreshes, responsive on phone and desktop
- Progressive tournament — new matches appear as admin adds knockout rounds

### Breakthrough Concepts

- **PWA capability** — almost free with Vite, friends "install" from browser on phones
- **API versioning** (`/api/v1/`) — future-proof for open source releases
- **Seed data** — sample tournament included so new deployers see a working app immediately

### Prioritization Results

**Top Priority — Foundations:**

1. Scaffold Rails API with PostgreSQL, set up auth model (User, Admin role, invite tokens)
2. Define core models: Tournament, Match, BetType, Bet, Score
3. Implement the 4 security guards as Rails concerns/before_actions
4. Scaffold Vue 3 + Vite + PrimeVue frontend with router

**Quick Win Opportunities:**

- Docker Compose setup early — develop inside containers from day one
- PrimeVue DataTable for leaderboard and match list — instant polished look
- Configurable scoring rules as a YAML/JSON config file per deployment

**Breakthrough Concepts for Later:**

- PWA setup via Vite plugin (minimal effort, big mobile UX gain)
- Seed data with sample tournament for onboarding
- API versioning for release management

## Session Summary and Insights

**Key Achievements:**

- Established 12 irreducible architectural requirements through First Principles
- Systematically evaluated and locked in 9 tech stack dimensions through Morphological Analysis
- Stress-tested entire architecture from 6 perspectives — no red flags found
- Produced a clear, prioritized implementation path

**Critical Discovery:** The app does NOT need real-time infrastructure (WebSockets, push notifications, event systems). It's fundamentally a CRUD app with a time-based access rule. This single insight eliminates the most complex potential technical requirement.

**Security Model:** The entire security model reduces to 4 server-side guards — bet mutation lock, bet visibility toggle, ownership check, admin role check. All implementable as simple Rails before_actions with timestamp and user ID checks.

### Creative Facilitation Narrative

The session began by stripping away assumptions about what a "web app" needs, revealing that the core is far simpler than it appears — a CRUD app with a clock-based rule. The conversation about security and Karol's desire to audit every line of code became the decisive factor in backend selection. The Morphological Analysis systematically narrowed 9 dimensions from many options to confident choices. Six Thinking Hats confirmed the stack holds up under scrutiny, with the frontend learning curve identified as the only meaningful risk — well-mitigated by Vue and PrimeVue choices. The session produced not just a tech stack decision, but a clear understanding of WHY each choice was made.

### Session Highlights

**User Creative Strengths:** Clear domain knowledge, strong security instinct, pragmatic decision-making
**AI Facilitation Approach:** First principles to prevent over-engineering, systematic grid to ensure completeness, multi-perspective validation
**Breakthrough Moments:** Realizing no real-time infrastructure needed; security confidence driving backend choice over "trendy" alternatives
**Energy Flow:** Steady and focused throughout — each technique built naturally on the previous one
