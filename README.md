# CampusNet — Smart Campus Wi-Fi Monitoring

CampusNet is a campus network monitoring and support application. Students run connection tests and report problems; IT Support investigates assigned complaints; Managers route work and review performance; Administrators manage users, locations, security, thresholds and AI-assisted classification.

This repository contains the React frontend and FastAPI backend. Local development uses SQLite. Production uses PostgreSQL and HTTPS; the backend can be deployed on Railway and the frontend separately on Netlify or another static host.

## Features

- **Connection monitoring:** Browser download/upload throughput and HTTP round-trip time; scored results, test history and campus status. Internet tests run directly from the browser against Cloudflare; campus endpoint tests use the configured backend measurement service.
- **Complaints:** Students submit reports with a selected location and optional test evidence. Supported categories include slow internet, high latency, frequent disconnection, no internet, weak signal, service unavailable and other.
- **Role workflows:** Managers assign complaints to IT Support. IT Support investigates assigned work, adds maintenance notes and updates status; Support cannot assign complaints to other staff.
- **Incidents and maintenance:** Suspected incidents can be grouped from independent reports. Operator-confirmed endpoint health is required for automatic detection; maintenance can suppress alerts. Incidents support investigation, recovery verification and reopening.
- **Campus maps:** Campuses, buildings, floors, measurement endpoints and pinned locations. Admin-created campus locations are distinct from locations marked **Custom · user reported**. Deactivation preserves historical references.
- **Dashboards and reports:** Role-specific dashboards, campus analytics, date/building/location/status filters, comparisons, recurring-problem reporting, IT activity and CSV test export.
- **Administration and security:** User roles and activation, permissions, thresholds, audit records, active sessions, session revocation and recent security events.
- **Notifications:** Persistent in-app notifications with read status; refreshed periodically.
- **AI tools:** Optional Gemini complaint classification and AI Network Summary, with clearly labelled keyword/factual fallbacks when the provider is unavailable.
- **Authentication:** Argon2 password hashing, JWT access tokens, rotating refresh sessions, logout/revocation and campus-scoped authorization. Public registration creates students only.

## Roles

| Role | Main access |
|---|---|
| Student | Dashboard, connection test, locations, submit complaint, test history, own complaints, campus status and notifications. |
| IT Support | Test results, complaints, poor performance, maintenance notes, locations, campus status and notifications. Investigates assigned work. |
| Manager | Assign complaints, connections, IT Support activity, reports/analytics, recurring problems, locations, campus status and notifications. |
| Administrator | Locations, users, Security Center, permissions, complaint classification, AI Network Summary, system reports, settings and campus status. |

The backend enforces permissions and campus scope independently from the frontend navigation.

## Technology and repository map

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts and Lucide icons.
- Backend: Python 3.12+, FastAPI, SQLAlchemy and Alembic.
- Local database: SQLite. Production database: PostgreSQL (`psycopg`).
- `src/`: React pages, authentication, view models and API clients.
- `backend/app/`: API routes, database models, view models, authentication and measurement services.
- `backend/alembic/`: database migrations. `backend/tests/`: backend tests. `tests/`: frontend Node tests.
- `backend/docs/`: API contract and deployment guidance. `INTEGRATION.md`: integration notes.

## Requirements

- Node.js 22.13+ and npm.
- Python 3.12+.
- Four terminals for local frontend, API, measurement service and worker.

## Local setup (Windows PowerShell)

Run from the repository root:

```powershell
npm ci
Copy-Item .env.example .env.local
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
Set-Location backend
.venv/Scripts/python.exe -m alembic upgrade head
.venv/Scripts/python.exe -m app.bootstrap --email admin@example.edu --campus "Your Campus" --demo-locations
```

Bootstrap prompts for an administrator password of at least 10 characters. It creates the campus, initial administrator, thresholds, a measurement endpoint and optional placeholder locations; it does not invent test history. Verify and edit map pins in the Administrator Locations page.

Run these from `backend/`, each in its own terminal:

```powershell
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
.venv/Scripts/python.exe -m uvicorn app.measurement:app --host 127.0.0.1 --port 8001
.venv/Scripts/python.exe -m app.worker
```

From a fourth terminal at the repository root:

```powershell
npm run dev
```

Open http://127.0.0.1:5173. Vite proxies `/api` to the API on port 8000 (removing the `/api` prefix) and `/measure` to port 8001. The API must be running for login. Readiness: http://127.0.0.1:8000/health/ready. Swagger: http://127.0.0.1:8000/docs. Measurement health: http://127.0.0.1:8001/health/live.

For multiple campuses, set `VITE_CAMPUS_ID` in root `.env.local` to the campus ID printed by bootstrap and restart Vite. For LAN testing, `localhost` must be replaced with reachable addresses and CORS must include the frontend origin; see [backend/README.md](backend/README.md).

Initial endpoint health is unconfirmed by design. After checking endpoint capacity/reachability, an administrator can set `operator_healthy` using `PATCH /admin/endpoints/{id}`. A recent authenticated ping is also required for incident detection.

### Demo accounts

Create local accounts for all four roles from `backend/` after bootstrap:

```powershell
.venv/Scripts/python.exe -m app.demo --campus-id YOUR_CAMPUS_ID
```

It prints random passwords once; save them securely. For local one-click judge access, put the matching account emails/passwords in `.env.development.local` at the repository root and restart Vite. The quick-access buttons sign in directly without showing the passwords. The mock workspace is available only when `VITE_USE_BACKEND=false`.

For hosted judge access, create disposable student, administrator, IT Support and manager accounts in the hosted backend. Set `VITE_SHOW_DEMO_ACCOUNTS=true` and the corresponding `VITE_DEMO_*` values in the frontend host's **build environment**, then trigger a new frontend build. These values are compiled into browser code and are public; use judge-only accounts. A safe variable template is in `.env.deployment.example`. Do not commit real local `.env` files or Gemini keys.

For a local deployment-mode build, copy `.env.deployment.example` to `.env.deployment.local`, replace the placeholders, then run:

```powershell
npm run build:deployment
```

The default `npm run build` uses Vite's `production` mode; it does not load `.env.deployment.local`.

## Environment configuration

Root `.env.example` is a safe frontend template. Important variables:

| Variable | Purpose |
|---|---|
| `VITE_USE_BACKEND` | `true` for authenticated backend operation; `false` for the mock demo. |
| `VITE_API_URL` | Backend HTTPS origin for a separately hosted frontend, without `/api`. Leave unset for local Vite proxying. |
| `VITE_CAMPUS_ID` | Optional campus selection/registration context. |
| `VITE_SHOW_DEMO_ACCOUNTS` | Explicitly enables public one-click judge accounts in production builds. |
| `VITE_DEMO_*` | Demo role emails and passwords; public in the browser bundle. Use disposable demo accounts only. |

Backend variables are in `backend/.env.example`; copy it to `backend/.env` for local work. Important settings include `ENVIRONMENT`, `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `MEASUREMENT_BASE_URL`, transfer limits, worker interval, and optional `GEMINI_API_KEY`/`GEMINI_MODEL`. Production requires PostgreSQL, a random `SECRET_KEY` of at least 32 characters, exact CORS origins and an HTTPS measurement URL. Keep secrets in backend hosting variables, never frontend `VITE_` variables.

## Gemini AI

Set `GEMINI_API_KEY` only in the backend environment and restart/redeploy the API. The default model is `gemini-3.5-flash-lite`; `GEMINI_MODEL` may select a generate-content model enabled for your Google project.

Complaint classification redacts common email and phone patterns before sending descriptions. AI Network Summary sends computed campus aggregates without names, emails or raw complaint text. Confidence is an estimate; recommendations need human review. If Gemini is unavailable or unconfigured, the application gives clearly labelled keyword suggestions and factual summaries instead of presenting them as Gemini output. Summary generation has a 30-second cooldown.

## API overview

Local OpenAPI UI: `/docs`; schema: `/openapi.json`. Main routes:

- `/auth`: campus list, student registration, login, refresh, current user and logout.
- `/admin`: buildings, locations, users, thresholds, endpoints, audit/security and session revocation.
- `/locations`: campus/building/location/endpoint views.
- `/test-sessions`, `/tests`: authorized measurements and history.
- `/complaints`, `/incidents`: submission, assignment, investigation, status and notes.
- `/maintenance`, `/notifications`: operational records and in-app notifications.
- `/dashboard`, `/analytics`, `/reports/tests.csv`: summaries, analytics and export.
- `/intelligence/classify`, `/admin/ai`: classification and administrator AI tools.
- `/workspace`: authenticated workspace context. `/health/live` and `/health/ready`: health checks.

Exact request/response contracts are in [backend/docs/API_CONTRACT.md](backend/docs/API_CONTRACT.md).

## Railway and frontend deployment

The backend Railway config is [backend/railway.toml](backend/railway.toml). Deploy it with Root Directory `/backend`, connect Railway PostgreSQL, generate a public domain and set `ENVIRONMENT=production`, `SECRET_KEY`, `CORS_ORIGINS`, `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. Set `GEMINI_API_KEY` only if AI features are needed. The readiness check is `/health/ready`; initialization creates the first administrator only when the database is empty.

Deploy the frontend separately. In the frontend host build settings, set `VITE_USE_BACKEND=true` and `VITE_API_URL` to the backend HTTPS origin **without** `/api`, then rebuild. Add that frontend's exact origin to backend `CORS_ORIGINS`. For one-click judge accounts, also set `VITE_SHOW_DEMO_ACCOUNTS=true` and the matching `VITE_DEMO_*` account values and rebuild. See [DEPLOY_NETLIFY_RENDER.md](DEPLOY_NETLIFY_RENDER.md) and [backend/docs/DEPLOYMENT.md](backend/docs/DEPLOYMENT.md) for provider-specific details.

A 502 for `/api/auth/login` means the browser is sending the request to the frontend's `/api` path, commonly because `VITE_API_URL` was not configured in the production build. Set it in the hosting provider and rebuild. If the request uses the backend's HTTPS domain and still returns 502, check its `/health/ready`, deployment status, database binding and startup logs. Locally, start the API on port 8000; Vite's proxy cannot serve the API by itself.

## Limitations

- Browser measurements are application-level throughput and HTTP RTT. They do not measure packet loss, SSID or Wi-Fi signal strength, nor prove association with a selected campus access point.
- Full Cloudflare browser tests transfer about 26 MiB directly from each browser. Campus endpoint tests only measure the configured endpoint path.
- User-selected locations are reports, not verified physical positioning. An observation alone does not prove infrastructure failure.
- Incident detection requires endpoint health confirmation and periodic processing. Local development requires the worker; the Railway startup runs periodic processing alongside the web app.
- Notifications are in-app only. Email/SMS, SSO, continuous external probes, packet/traffic telemetry and ML prediction are not implemented. Password recovery is not connected to an email service.
- The application needs real campus locations, endpoint verification, backups, HTTPS and deployment-specific calibration before production operations.

## Helpful commands

```powershell
# Frontend build and Node tests from repository root
npm run build
npm test

# Backend tests from backend/
.venv/Scripts/python.exe -m pytest -q
```

Tests are not run automatically by setup. Docker Compose/PostgreSQL and production-device calibration must be verified in the target deployment. See [backend/README.md](backend/README.md) for detailed backend setup, Docker and integration-kit instructions.
