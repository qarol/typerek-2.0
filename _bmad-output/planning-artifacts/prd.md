---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-03.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
  projectContext: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - typerek-2.0

**Author:** Karol
**Date:** 2026-02-04

## Executive Summary

Typerek is a private soccer prediction web app for closed friend groups. Players predict match outcomes before kickoff using a 6-option bet system (1, X, 2, 1X, X2, 12), earn points based on real bookmaker odds, and compete on a live leaderboard across a tournament.

**Differentiator:** Typerek is deliberately simple. No real-time infrastructure, no external services, no email, no OAuth. It's a CRUD app with one critical rule: a passive time-based lock that rejects bets after kickoff and reveals all predictions. The entire security model reduces to 4 server-side guards. Self-hosted via Docker Compose, open source, fully self-contained.

**Target Users:** Private friend groups (up to 50 people) who want to run prediction competitions during soccer tournaments. Admin manages the instance; all participants are invited by token link.

**Tech Stack:** Rails API (Ruby) + Vue 3 (Composition API) + PrimeVue + PostgreSQL, deployed via Docker Compose (nginx + Rails + PostgreSQL).

## Success Criteria

### User Success

- Friends access the app anytime on phone or desktop with a native-app feel via PWA
- Betting is intuitive and fast -- open app, pick a match, place a bet, done
- Time-based lock is airtight: no bets accepted after kickoff, no exceptions
- Points are calculated correctly and transparently -- every user can see how scores were derived
- The system feels like a private clubhouse: only invited friends have access
- No personal data collected beyond nickname and password -- anonymity by design

### Business Success

- Deployed and usable for a real tournament by May/June 2026
- Up to 50 users participate without performance issues
- Open-source distribution enables other groups to self-host with minimal friction
- Community contributions (bug fixes, PRs) welcome but not required

### Technical Success

- Self-hosting via `docker compose up` works reliably with no manual configuration beyond basics
- PostgreSQL data persists across container restarts and crashes (Docker volumes)
- The 4 server-side security guards hold up against motivated, technically-capable users
- No emails, no OAuth, no external services -- fully self-contained
- Codebase is auditable -- every security-critical line verifiable

### Measurable Outcomes

- 100% of bets locked at kickoff time -- zero late bets accepted
- 100% accurate point calculation against configured odds
- Zero unauthorized access -- invite-token auth with no bypass paths
- App loads and is interactive within 3 seconds on mobile
- Deployment from clone to running app in under 5 minutes

## Product Scope

### MVP (Phase 1)

- Seed-based match loading (`rails db:seed`) -- full tournament loaded upfront, no UI for match add/delete
- Admin panel for odds entry and score entry per match
- 6-option betting (1, X, 2, 1X, X2, 12) with odds-based point scoring
- Passive time-based lock (reject bets after kickoff, reveal all predictions)
- Configurable scoring engine (rules abstracted, not hardcoded)
- Automatic point calculation triggered on score entry
- Live leaderboard ranked by accumulated points
- Player history view (per-user betting record, match by match)
- Invite-only auth (admin creates nickname, generates token URL, user sets password)
- Admin user management (invite generation, role assignment)
- PWA with home screen install support
- Docker Compose deployment (nginx + Rails + PostgreSQL with persistent volumes)
- Mobile-first responsive design via PrimeVue
- Bilingual support (Polish + English) with language selection

### Growth (Phase 2)

- Exact score bonus prediction layer
- API versioning (`/api/v1/`) for open-source release management
- Sample seed data with demo tournament for new deployers
- Player statistics and analytics beyond basic history

### Vision (Phase 3)

- Push notifications (match reminders, odds posted, results available)
- Multiple concurrent tournaments
- Achievement system or badges
- Community-contributed scoring rule presets
- Community-contributed language packs (broader localization beyond PL/EN)

### MVP Strategy

**Approach:** Problem-solving MVP -- deliver the complete prediction game experience for a real World Cup tournament. No "partial" version is useful; all MVP features are required for match day use.

**Resources:** Single developer (Karol) with AI-assisted development (Claude Code). Backend (Rails) is the developer's strongest area. Frontend (Vue 3 + PrimeVue) is new territory and the primary learning investment.

**Timeline:** Ready for deployment by May/June 2026.

### Risk Mitigation

**Technical Risks:**
- *Frontend learning curve (HIGH):* Mitigated by PrimeVue's polished components and AI-assisted development. Start frontend work early.
- *Scoring engine correctness (MEDIUM):* Mitigated by comprehensive test coverage -- pure Ruby, developer's strength.
- *Session cookie auth across nginx proxy (LOW):* Single-domain setup keeps this simple. Test Docker Compose configuration early.

**Resource Risks:**
- *Solo developer bottleneck:* Mitigated by keeping UI simple (PrimeVue components, no custom CSS) and leveraging AI for Vue code generation.
- *Tournament deadline pressure:* Mitigated by building backend first (comfort zone), then frontend, leaving buffer time.

**Contingency:** A functional-but-basic UI is acceptable if frontend isn't polished by tournament time. Backend API can be built and tested independently.

## User Journeys

### Journey 1: Tomek the Player -- Match Day Ritual

Tomek received an invite link on WhatsApp weeks ago, tapped it, chose a password, and has been in since.

**Opening Scene:** Tuesday morning. Tomek opens typerek on his phone -- installed as a PWA on his home screen. He goes straight to the leaderboard. He's 4th, two points behind Maciek. Three matches today.

**Rising Action:** Tomek taps into today's matches. Two have odds assigned, one doesn't yet. Brazil vs. Germany: 1 (Brazil win) at 2.10, X (draw) at 3.40, 2 (Germany win) at 3.20, plus combo bets 1X, X2, 12. He picks "1" for 2.10 potential points. For the second match he goes with X2 at lower odds for safer coverage. The third match has no odds yet, but he places his bet anyway -- doesn't want to forget.

**Climax:** 8:55 PM, five minutes before kickoff. Tomek switches his bet to "12" (Brazil or Germany, no draw). At 9:00 PM, the match locks. He can now see everyone's bets. Maciek bet the same thing.

**Resolution:** Next morning, admin has entered scores. Brazil won 2-1. His "12" landed -- points calculated, leaderboard updated. He's moved to 3rd.

### Journey 2: Ania the Player -- Missed Deadline

Ania joined the group but has a busy week at work.

**Opening Scene:** Wednesday evening. Two matches from yesterday are resolved -- she never placed bets. Points for those: 0. No penalty, no default bet -- she simply missed out.

**Rising Action:** Today's matches: one started 30 minutes ago (she can see everyone's bets but can't place her own), one tonight at 9 PM with odds up.

**Climax:** She places her bet on the evening match. Checks the leaderboard -- dropped from 8th to 11th. The missed points are gone forever.

**Resolution:** Ania sets a personal reminder. The app doesn't nag -- no emails, no push notifications. Showing up is the player's responsibility.

### Journey 3: Karol the Admin -- Tournament Setup

**Opening Scene:** World Cup draw announced. Karol prepares a seed file: 48 matches with team names, kickoff datetimes, group labels.

**Rising Action:** `docker compose up`, then `rails db:seed`. All 48 matches appear in the app. No odds yet -- those come later.

**Climax:** Generates invite links through admin panel -- one per friend. Sends via WhatsApp and Signal. Friends click, set passwords, they're in. Full match schedule visible immediately.

**Resolution:** Matches locked in -- no accidental deletion through UI. Admin shifts to daily operations.

### Journey 4: Karol the Admin -- Daily Operations

**Opening Scene:** Match day. Karol checks a betting site during lunch.

**Rising Action:** Opens admin panel, enters odds for tomorrow's matches (all 6 bet types per match, copied from betting site). Roughly 24h before kickoff per social agreement.

**Climax:** Next morning, enters final scores for last night's matches. Scoring engine fires automatically -- points calculated for every player. Leaderboard updates instantly.

**Resolution:** Karol checks the leaderboard as a player. Same betting rules apply to him -- no admin privilege in the game.

### Journey Requirements Summary

- **PWA with home screen install** -- daily mobile access pattern
- **Leaderboard as home screen** -- first thing every player checks
- **Match list with betting interface** -- browse, see odds, place/change bets
- **Automatic kickoff lock** -- absolute, reveals all bets
- **0 points for missed bets** -- absence is the data
- **Score entry triggers auto-calculation** -- points appear immediately
- **Seed-based match loading** -- `rails db:seed`, no UI match CRUD
- **Admin odds entry panel** -- per-match odds for all 6 bet types
- **Invite link generation** -- admin creates users via token URLs
- **Admin is also a player** -- same rules, no privilege
- **No notifications (MVP)** -- passive app, push notifications are future
- **Player history view** -- full record per user, match by match

## Web App Specific Requirements

### Architecture Overview

Typerek is a single-page application (SPA) with a separate API backend. Vue 3 + PrimeVue frontend served as a static build through nginx, which proxies API requests to Rails. All content behind authentication -- no public-facing pages.

### Browser Support

- Modern evergreen browsers only (Chrome, Firefox, Safari, Edge -- latest 2 versions)
- Mobile: Safari on iOS, Chrome on Android (latest versions)

### Responsive Design

- Mobile-first -- most users access on their phones
- Desktop support for admin tasks (odds entry, score entry, user management)
- PrimeVue responsive components handle breakpoints
- Key mobile views: leaderboard, match list, betting interface, player history

### Accessibility

- Baseline WCAG 2.1 AA through PrimeVue's built-in features (ARIA attributes, keyboard navigation)
- Preserve PrimeVue defaults -- don't override or break them
- Sufficient color contrast in theme selection

### Implementation Considerations

- Vue Router with route guards (redirect to login if unauthenticated)
- Vite with PWA plugin for service worker generation
- nginx serves Vue static build and proxies `/api` to Rails
- Session cookies (HttpOnly, Secure) on single domain behind nginx
- No SSR -- pure client-side SPA

## Functional Requirements

### Betting & Predictions

- FR1: Player can view all tournament matches with team names, kickoff times, and group labels
- FR2: Player can place a prediction by selecting one of 6 bet types (1, X, 2, 1X, X2, 12)
- FR3: Player can place a prediction regardless of whether odds have been assigned
- FR4: Player can change their prediction at any time before kickoff
- FR5: Player cannot place or modify a prediction after kickoff time
- FR6: Player can view all other players' predictions for a match only after kickoff
- FR7: Player cannot view other players' predictions before kickoff

### Scoring & Points

- FR8: System calculates points for all players on a match when admin enters the final score
- FR9: System awards points equal to the odds value of the selected bet type when correct
- FR10: System awards zero points when no prediction was placed
- FR11: System resolves compound bet types (1X, X2, 12) as winning if either covered outcome occurs
- FR12: Player can view point calculation details per match (bet, odds, result, points earned)

### Leaderboard & Rankings

- FR13: Player can view a leaderboard ranking all players by total accumulated points
- FR14: Leaderboard reflects latest totals including all scored matches
- FR15: Player can view any other player's complete betting history

### Player History

- FR16: Player can view their own complete betting record (every match, prediction, result, points)
- FR17: Player can view another player's betting record with the same detail

### Authentication & User Management

- FR18: Admin can create a new user account by specifying a nickname
- FR19: System generates a unique invite URL with token for each account
- FR20: Invited user can activate their account via invite URL and set a password
- FR21: User can sign in with nickname and password
- FR22: User can sign out
- FR23: Admin can assign or revoke admin role for any user
- FR24: Multiple users can hold admin role simultaneously
- FR25: Admin is subject to the same betting rules as all other players

### Tournament & Match Administration

- FR26: Admin can load a complete tournament schedule via seed script (`rails db:seed`)
- FR27: Matches cannot be added or deleted through the application UI
- FR28: Admin can enter or update odds for each of the 6 bet types on any match
- FR29: Admin can enter the final score for a completed match
- FR30: System prevents modification of match results after points have been calculated

### Internationalization

- FR31: User can select preferred language (Polish or English)
- FR32: All user-facing text is available in both Polish and English

### PWA & Mobile Experience

- FR33: User can install the application as a PWA on their device's home screen
- FR34: Application provides a responsive experience for mobile and desktop

## Non-Functional Requirements

### Performance

- NFR1: SPA page transitions complete within 500ms
- NFR2: API responses return within 200ms under normal load (up to 50 concurrent users)
- NFR3: PWA cold start loads and is interactive within 3 seconds on 4G
- NFR4: PWA warm start (cached) loads within 1 second
- NFR5: Leaderboard and match list render correctly with up to 100 matches and 50 players

### Security

- NFR6: Bet modification requests rejected server-side after kickoff, regardless of client state
- NFR7: Other players' bet data inaccessible server-side before kickoff
- NFR8: Bet and score endpoints verify requesting user's ownership or admin role server-side
- NFR9: Admin-only endpoints reject non-admin requests server-side
- NFR10: Session cookies are HttpOnly and Secure
- NFR11: Invite tokens are cryptographically random and single-use
- NFR12: Passwords stored using bcrypt or equivalent one-way hash
- NFR13: No user data stored beyond nickname and hashed password

### Data Integrity & Reliability

- NFR14: PostgreSQL data persists across container restarts, crashes, and redeployments via Docker named volumes
- NFR15: Point calculations are deterministic -- same inputs always produce same outputs
- NFR16: Score entry and point calculation occur within a database transaction
- NFR17: Referential integrity maintained -- no orphaned bets, scores, or user records

### Deployment & Operations

- NFR18: New deployment requires only `docker compose up` after seed data preparation
- NFR19: Configuration managed through environment variables, not hardcoded
- NFR20: Application runs as three containers (nginx, Rails, PostgreSQL) via single Docker Compose file
- NFR21: No external service dependencies -- fully self-contained
