# Deployment checklist

## Recommended production topology
- `app.example.com`: static React build served by a CDN/static host.
- `api.example.com`: Node.js API behind HTTPS and a reverse proxy.
- Managed PostgreSQL with automated backups and point-in-time recovery.

## Build web
Set `VITE_API_BASE_URL=https://api.example.com/api` at build time, then run `npm run build -w apps/web`. Deploy `apps/web/dist` to your static host.

## Build API
Set production environment variables in the host dashboard (not in source control). Run `npm run db:generate -w apps/api`, then `npm run build -w apps/api`. Apply production migrations using `prisma migrate deploy --schema database/prisma/schema.prisma` from the repository root or the equivalent command from the API workspace. Start with `npm run start -w apps/api`.

## cPanel / Node.js hosting
1. Check that the hosting plan supports Node.js 20+, persistent processes and PostgreSQL connections. If PostgreSQL is not available, provision a supported managed PostgreSQL service and allowlist the host.
2. Upload the repository (excluding node_modules) and run `npm install` in the app root if the host supports workspaces. Some cPanel Node.js Application Manager setups do not support monorepos/workspaces cleanly; in that case deploy the API as a separate standalone directory and install its dependencies there.
3. Configure environment variables in cPanel's Node.js application environment. Never upload a real `.env` file to a public directory.
4. Run Prisma generation and migrations in a terminal that has the production environment loaded.
5. Set the application startup file to `apps/api/dist/server.js` only if the host supports the compiled workspace path; otherwise use a dedicated API deployment folder with `dist/server.js` as startup file.
6. Set `CORS_ORIGIN` to the exact HTTPS frontend origin, enable HTTPS, and test `/api/health`.
7. Deploy the frontend build separately and configure SPA fallback to `index.html`.

## Before opening registration publicly
- Replace demo data adapter with a licensed provider and clearly surface feed delays/timestamps.
- Remove the demo user and rotate secrets.
- Implement email verification, password reset, MFA options, data export/deletion and privacy/cookie disclosures as required.
- Add automated tests, rate limits for all sensitive routes, CSRF considerations if moving to cookies, structured logs and error monitoring.
- Configure production payment webhooks only after verifying signatures and idempotency.
- Complete security, accessibility, load, backup restore and regulatory reviews.
