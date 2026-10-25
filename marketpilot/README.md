# MarketPilot AI — full-stack starter

A professionally structured starter for an Indian-market intelligence SaaS: responsive React website/dashboard, Node.js API, PostgreSQL database via Prisma, and a Flutter mobile app starter wired to the same API.

> **Important:** This is a functional foundation, not a certified trading/research product. Market figures are labelled demo data. No live exchange feed, broker order placement, paid stock recommendations, or production payment provider is configured. Before commercial launch, obtain data redistribution rights, security review, privacy/terms documents, and specialist advice on applicable SEBI requirements. Do not market demo data as live or imply guaranteed returns.

## Architecture
- `apps/web`: React + TypeScript + Vite dashboard and landing page.
- `apps/api`: Express REST API, JWT auth, Zod validation, Prisma persistence.
- `database/prisma`: PostgreSQL schema and seed script.
- `apps/mobile`: Flutter app starter with API client and login/dashboard screens.
- `docker-compose.yml`: local PostgreSQL.

## Requirements
- Node.js 20+
- npm 10+
- Docker Desktop / Docker Engine (or your own PostgreSQL)
- Flutter stable SDK for mobile builds

## Local setup
1. Copy `.env.example` to `.env` and `apps/api/.env.example` to `apps/api/.env`; set the same `DATABASE_URL` and a strong random `JWT_SECRET` in both files.
2. Start PostgreSQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma client: `npm run db:generate`
5. Create tables: `npm run db:migrate -w apps/api`
6. Seed demo market data: `npm run db:seed`
7. Start web and API: `npm run dev`
8. Open `http://localhost:5173`. API health: `http://localhost:4000/api/health`.

Demo accounts (only after seed):
- **Super Admin:** `admin@marketpilot.local` / `AdminPass!234` (Full `/admin` Portal Access)
- **Demo Trader:** `demo@marketpilot.local` / `DemoPass!234` (Regular User Dashboard)

Change/remove these accounts before deployment. Passwords are hashed.

## Mobile setup
1. Install Flutter and create platform folders if needed: `cd apps/mobile && flutter create .` (keep the provided `lib/` files).
2. Run `flutter pub get`.
3. Start the API on an address reachable by the device. Android emulator normally uses `http://10.0.2.2:4000/api`; iOS simulator uses `http://localhost:4000/api`. A physical phone needs your computer's LAN IP and firewall access.
4. Run `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api` on Android emulator.

## API overview
### User Endpoints
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `GET /api/market/overview`
- `GET /api/market/stocks?q=`
- `GET /api/watchlist` (Bearer token)
- `POST /api/watchlist` `{ "symbol": "RELIANCE" }`
- `DELETE /api/watchlist/:symbol`
- `GET /api/journal` (Bearer token)
- `POST /api/journal` `{ "symbol":"TCS", "side":"BUY", "entryPrice":3500, "quantity":1, "notes":"Practice entry" }`

### Admin Endpoints (`/api/admin/*`, Bearer token + ADMIN role required)
- `GET /api/admin/stats` — Platform KPIs, MRR, User counts, Subscriptions breakdown, Audit events
- `GET /api/admin/users?search=&role=&plan=&status=` — Search and paginate users with activity counts
- `POST /api/admin/users` — Directly provision new user or admin account
- `GET /api/admin/users/:id` — Full user detail, watchlists, trades, and audit history
- `PATCH /api/admin/users/:id` — Update name, email, and toggle role (`USER` <-> `ADMIN`)
- `PATCH /api/admin/users/:id/subscription` — Override user plan (`FREE` / `PRO` / `ELITE`), status, validity days
- `DELETE /api/admin/users/:id` — Permanently delete user and cascade associated data
- `GET /api/admin/journal` — Platform-wide trade feed across all traders
- `GET /api/admin/audit-logs` — Immutable security trail & audit logs
- `GET /api/admin/alerts` & `POST /api/admin/alerts` — Manage broadcast alerts displayed across user website
- `GET /api/admin/alerts/active` — Active platform broadcast banners visible to users

## Production checklist
- Use managed PostgreSQL, TLS, secret manager, backups and restore drills.
- Set `CORS_ORIGIN` to your real web origin and strong unique secrets.
- Add rate limiting, request logging, alerting, account verification, password reset, MFA and abuse monitoring before public release.
- Configure a licensed market-data provider; remove demo fixtures and verify timestamps/licence rights.
- Add billing only after defining plan entitlements, taxes, cancellation/refunds and webhook signature verification.
- Review SEBI requirements for any research recommendations/advice, and exchange/vendor terms for market data.
- Conduct accessibility, mobile, penetration, load and disaster-recovery tests.

## Deployment notes
Deploy API and web separately. API needs `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and a persistent PostgreSQL database. Build web with `VITE_API_BASE_URL=https://your-api-domain/api`. Do not commit `.env` or credentials.
