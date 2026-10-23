# CampusNet — Smart Campus Wi-Fi Monitoring

**Hackathon:** Denning University Hackathon  
**Project:** CampusNet — Smart Campus Wi-Fi Monitoring  
**Developed by:** Ahmed Memon, Haroon Zulfiqar Khan, and Syed Sayeel Abbas  
**Institution:** Mehran University of Engineering and Technology (MUET)

---

CampusNet is a campus network monitoring and support application. Students can run connection tests and report problems; IT Support investigates assigned complaints; Managers route work and review network performance; Administrators manage users, locations, security, thresholds, and AI-assisted complaint classification.

This repository contains the React frontend and a FastAPI backend. Local development uses SQLite and four processes. Railway deployment runs the backend from `/backend`; deploy the frontend separately and point it at the Railway HTTPS URL.

## Contents

- [Features](#features)
- [Roles and Access](#roles-and-access)
- [Technology and Repository Map](#technology-and-repository-map)
- [Requirements](#requirements)
- [Run Locally](#run-locally)
- [Demo and Judge Accounts](#demo-and-judge-accounts)
- [Configuration](#configuration)
- [AI Features and Privacy](#ai-features-and-privacy)
- [API Reference](#api-reference)
- [Railway Deployment](#railway-deployment)
- [Operations and Troubleshooting](#operations-and-troubleshooting)
- [Known Limitations](#known-limitations)
- [Project Documentation](#project-documentation)
- [Developers](#developers)

## Features

### Network Tests and Campus Health

- Browser-based download, upload, and HTTP round-trip-time measurements, with test history and a health score based on configured thresholds.
- Full browser internet tests run directly from the user's browser against Cloudflare. They do not send speed-test traffic through the application server.
- A campus measurement API is available for tests against a configured campus endpoint.
- Authorized test sessions with expiration, bounded uploads and downloads, and complete, partial, failed, or cancelled outcomes.
- Versioned threshold settings, score explanations, campus status, location health, and time-based analytics.
- Campus dashboards with filtering and comparison by date, building, location, and status, plus CSV reports.

### Complaints, Investigation, and Incidents

- Students can report connection problems by selecting a campus location and optionally attaching test evidence.
- Complaint categories include slow internet, high latency, frequent disconnection, no internet, weak signal, service unavailable, and other.
- Managers assign complaints to active IT Support staff.
- IT Support investigates assigned complaints, records maintenance notes, and updates complaint status. The support role cannot assign work to other staff members.
- Public and internal notes, assignment and status history, ownership checks, and audit records.
- Suspected incidents can be grouped from independent reports. Detection depends on endpoint health being confirmed by an operator; planned maintenance can suppress incident alerts.
- Incident investigation, recovery verification, and reopening.
- Persistent in-app notifications for complaints, assignments, poor observations, incidents, recovery, and maintenance.
- Notification read-state tracking and periodic dashboard refresh.
- Recurring-problem summaries and IT Support activity reporting for managers.

### Locations and Administration

- Campus, building, floor, measurement endpoint, and map location management.
- Deactivation preserves historical references.
- Administrators can create and edit campus locations and place map pins.
- **Custom · user reported** is reserved for locations submitted by users, not administrator-created locations.
- Role and account administration, campus-scoped permissions, activation controls, and threshold configuration.
- Security Center with active sessions, session revocation, and recent account security events.
- System reports, complaint classification review, AI Network Summary, and settings.

### Authentication and Safeguards

- Argon2 password hashing.
- JWT access tokens and rotating refresh sessions.
- Logout, session revocation, and campus-scoped authorization.
- Public registration creates student accounts; elevated roles are assigned by an administrator.
- Request and payload limits, bounded test sessions, audit history, measurement concurrency and byte budgets, and local request limits.

## Roles and Access

The frontend presents role-specific navigation, while the backend independently enforces permissions and campus scope.

| Role | Main Capabilities |
|---|---|
| Student | Dashboard, connection tests, locations, complaint submission, test history, own complaints, campus status, and notifications. |
| IT Support | Dashboard, test results, complaints, poor performance, maintenance notes, locations, campus status, and notifications. Investigates assigned complaints but cannot assign work to other IT staff. |
| Manager | Dashboard, complaint assignment to IT Support, connections, IT Support activity, reports, analytics, recurring problems, locations, campus status, and notifications. |
| Administrator | Dashboard, locations, users, Security Center, permissions, complaint classification, AI Network Summary, system reports, settings, campus status, and notifications. |

Administrators can create accounts with elevated roles. Public sign-up remains student-only. Managers handle complaint assignment, while IT Support handles investigation and status updates.

## Technology and Repository Map

### Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Leaflet maps, Recharts, and Lucide icons.
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy, and Alembic.
- **Local Database:** SQLite.
- **Deployment Database:** PostgreSQL using `psycopg`.
- **Architecture:** Frontend view models call the API; backend request views delegate to view models and models. The backend includes compatibility facades for older imports.

### Repository Structure

| Path | Contents |
|---|---|
| `src/` | React application, authentication, role-based pages, and components. |
| `src/auth/` | Authentication models, including the development-only judge demo-account panel. |
| `src/services/` | API and browser measurement clients. |
| `backend/app/` | FastAPI routes, models, view models, configuration, authentication, and measurement services. |
| `backend/alembic/` | Database migrations. |
| `backend/tests/` | Backend tests. |
| `tests/` | Frontend and project Node tests. |
| `backend/integration/` | Backend integration kit, API client, and view models. |
| `backend/docs/` | API contract, partner handoff, and deployment documentation. |
| `INTEGRATION.md` | Integration notes and dashboard behavior. |

## Requirements

- Node.js **22.13+** and npm.
- Python **3.12+**.
- Four terminals for the local frontend, API, measurement endpoint, and periodic worker.
- Git is recommended for source control.
- Docker is optional and useful for the PostgreSQL Compose setup documented in `backend/README.md`.

## Run Locally

The following commands are for Windows PowerShell from the repository root. On Linux or macOS, use the equivalent Python and shell commands.

### 1. Install and Configure

```powershell
npm ci
Copy-Item .env.example .env.local

py -3.12 -m venv backend/.venv

backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt

Copy-Item backend/.env.example backend/.env

Set-Location backend

.venv/Scripts/python.exe -m alembic upgrade head

.venv/Scripts/python.exe -m app.bootstrap --email your-admin@example.edu --campus "Your Campus" --demo-locations
```

The bootstrap command prompts for an administrator password of at least 10 characters. It creates the campus, administrator, initial thresholds, a measurement endpoint, and optional placeholder locations.

It does not create fake measurement history. The placeholder map center is only a starting point, not a surveyed building map. Use the administrator Locations page to edit names and map pins.

The checked-in environment examples contain development defaults and blank optional secrets. Local `.env` files are private and ignored by Git. Never commit credentials or replace an existing `.env` without saving its values first. Restart backend processes after changing their environment.

### 2. Start the Backend Processes

Keep each process in its own terminal. The three backend commands run from `backend/` and use the same `.env`, virtual environment, and database.

**Terminal 1 — API (Port 8000)**

```powershell
.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 — Campus Measurement Service (Port 8001)**

```powershell
.venv/Scripts/python.exe -m uvicorn app.measurement:app --host 127.0.0.1 --port 8001
```

**Terminal 3 — Expired Sessions and Periodic Processing**

```powershell
.venv/Scripts/python.exe -m app.worker
```

### 3. Start the Frontend

Open a fourth terminal at the repository root.

```powershell
npm run dev
```

Open the application:

**http://127.0.0.1:5173**

The Vite development proxy sends `/api` to port 8000 and `/measure` to port 8001. The API must be running for backend login.

### Health Checks

- API readiness: http://127.0.0.1:8000/health/ready
- Measurement health: http://127.0.0.1:8001/health/live
- Interactive API documentation: http://127.0.0.1:8000/docs

If you have multiple campuses, set `VITE_CAMPUS_ID` in the root `.env.local` to the campus ID printed by bootstrap, then restart Vite.

The browser cannot access localhost services running on a different computer or phone. For LAN testing, configure reachable host addresses, CORS, and the measurement endpoint URL as described in `backend/README.md`.

Initial measurement endpoint health is intentionally unconfirmed. After verifying endpoint reachability and capacity, an administrator can enable `operator_healthy` with `PATCH /admin/endpoints/{id}`. Incident detection relies on this operator confirmation and a recent authenticated ping.

### Updating an Existing Local Database

Back up the database, set the intended `DATABASE_URL` in `backend/.env`, and run `alembic upgrade head` from `backend/`.

Sign in with existing users. Do not bootstrap another campus unless that is intended.

## Demo and Judge Accounts

### Create Backend Demo Users

After local bootstrap, run the following command from `backend/`.

```powershell
.venv/Scripts/python.exe -m app.demo --campus-id YOUR_CAMPUS_ID
```

The command creates Student, IT Support, Manager, and Administrator accounts with random passwords and prints the credentials once.

Save the credentials securely. Passwords cannot be recovered by rerunning the command. The command refuses to run in production.

Alternatively, administrators can create users through the Users page. Public registration creates students only.

### Quick Access to Demo Accounts

For local judge presentations, configure the quick-access buttons in the ignored root file `.env.development.local`, then restart Vite.

The buttons sign directly into a role workspace, so judges do not need to enter passwords manually. The accounts and passwords must match those created in the preceding step.

```dotenv
VITE_DEMO_STUDENT_EMAIL=student@example.edu
VITE_DEMO_STUDENT_PASSWORD=replace-with-created-password

VITE_DEMO_IT_EMAIL=support@example.edu
VITE_DEMO_IT_PASSWORD=replace-with-created-password

VITE_DEMO_MANAGER_EMAIL=manager@example.edu
VITE_DEMO_MANAGER_PASSWORD=replace-with-created-password

VITE_DEMO_ADMIN_EMAIL=admin@example.edu
VITE_DEMO_ADMIN_PASSWORD=replace-with-created-password
```

These values are exposed to the local development browser, by design, so use only disposable demo accounts. The quick-access panel appears only in development and is excluded from production builds.

**Never put real account credentials in frontend environment variables.**

The original mock workspace can be restored with `VITE_USE_BACKEND=false` in `.env.local`. This mode is for isolated demos and does not use the live backend database.

## Configuration

### Frontend Environment

The root `.env.example` is the frontend template.

| Variable | Purpose |
|---|---|
| `VITE_USE_BACKEND` | `true` uses the authenticated backend; `false` selects the original local mock workspace. |
| `VITE_API_URL` | Optional backend base URL. Leave unset for local Vite proxying. For a deployed frontend, use the backend HTTPS origin without `/api`. |
| `VITE_CAMPUS_ID` | Optional campus ID when the application needs explicit campus selection. |
| `VITE_DEMO_*` | Development-only judge picker credentials; see [Demo and Judge Accounts](#demo-and-judge-accounts). |

Vite reads `.env.local` and `.env.development.local` at the project root. Restart `npm run dev` after edits.

Frontend variables prefixed with `VITE_` are public in the browser bundle. Never put API keys or production secrets in them.

### Backend Environment

Copy `backend/.env.example` to `backend/.env`.

The backend loads this file relative to the backend package; real process environment variables take precedence.

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | `development` locally; `production` in deployment. |
| `DATABASE_URL` | Local default is SQLite. Production should use PostgreSQL, for example `postgresql+psycopg://...`. |
| `SECRET_KEY` | Signs tokens. Use a unique random secret of at least 32 characters in production. |
| `CORS_ORIGINS` | JSON array of exact frontend origins allowed to call the API. |
| `MEASUREMENT_BASE_URL` | Reachable measurement-service URL. Production must use HTTPS. |
| `CAMPUS_TIMEZONE` | Timezone used for campus reporting; defaults to `Asia/Karachi`. |
| `ACCESS_MINUTES`, `REFRESH_DAYS` | Access and refresh token lifetimes. |
| `TEST_SESSION_MINUTES` | Expiration interval for measurement sessions. |
| `MAX_DOWNLOAD_BYTES`, `MAX_UPLOAD_BYTES`, `MAX_SESSION_BYTES`, `MAX_CONCURRENT_TRANSFERS` | Measurement resource limits. |
| `WORKER_INTERVAL_SECONDS` | Interval for background rule and session processing. |
| `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_SECONDS` | Optional server-side AI provider credentials, model, and timeout. |

The bootstrap CLI accepts `--email`, `--campus`, and optional `--demo-locations`.

For first-time Railway initialization, use `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and optional `INITIAL_CAMPUS_NAME`. Initialization only runs against an empty database; redeploying does not reset existing accounts.

## AI Features and Privacy

Administrator AI features require `GEMINI_API_KEY` in the backend environment.

- **Local development:** Put the key in the private `backend/.env` file.
- **Railway deployment:** Add it as a Railway variable.
- **Security:** Never put this key in frontend variables or commit it.

The default model is `gemini-3.5-flash-lite`. Set `GEMINI_MODEL` to a generate-content model available to your Google project. Provider requests have a configured timeout.

### Complaint Classification

- New complaints can be classified into supported categories.
- Suggestions with confidence of 0.65 or higher can be applied automatically.
- Lower-confidence suggestions remain available for administrator review.
- Older complaints can be classified individually, with reasoning and an option to apply the result.
- The original category and analysis are audited; retries avoid duplicate analysis.

### AI Network Summary

- Generates IT observations and suggested checks for 24-hour, 3-day, or 7-day periods.
- Only computed campus aggregates are sent for summaries.
- Names, email addresses, and raw complaint text are excluded.
- Summary generation has a 30-second cooldown.

### Privacy and Fallback Behavior

Complaint classification sends complaint description text after common email and phone patterns are redacted. Avoid putting sensitive information in complaint descriptions.

Model confidence is an estimate, and IT must review recommendations.

If Google is unavailable or no key is configured, classification shows explicitly labelled keyword suggestions and summaries fall back to factual data summaries. These are not represented as Gemini results.

Empty periods report insufficient evidence. Analyses and the latest summary are retained in the audit store.

## API Reference

The FastAPI OpenAPI interface is available locally at `/docs`; the schema is available at `/openapi.json`.

Routes are campus-scoped, and most require authentication. Deployment details and exact contracts are documented in `backend/docs/API_CONTRACT.md`.

| Route Group | Main Purpose |
|---|---|
| `/auth` | Campus discovery, student registration, login, token refresh, current user, and logout. |
| `/admin` | Buildings, locations, users, thresholds, endpoints, audit/security events, and session revocation. |
| `/locations` | Campus, building, location, and endpoint views for the application. |
| `/test-sessions`, `/tests` | Create authorized test sessions, submit measurements, and retrieve test results/history. |
| `/complaints` | Submit and view complaints, assignment, status transitions, and notes. |
| `/incidents` | Incident investigation, assignment, status transitions, and notes. |
| `/maintenance`, `/notifications` | Maintenance records and in-app notification/read state. |
| `/dashboard`, `/analytics`, `/reports` | Campus summaries, filtered analytics, comparisons, and CSV exports. |
| `/intelligence` | Complaint classification and AI Network Summary. |
| `/workspace` | Authenticated workspace context for the current user. |
| `/health` | Liveness and readiness checks. |

The measurement service has its own `/health/live` health route and the following endpoints:

- `/measure/ping`
- `/measure/download`
- `/measure/upload`

Browser internet tests use the browser measurement client against Cloudflare, while campus endpoint tests use the configured measurement service. Browser measurements use a separate measurement token for the campus API rather than the normal access token.

## Railway Deployment

The backend configuration is in `backend/railway.toml`. It builds Python requirements, runs migrations, and starts the combined API/measurement application with periodic rules.

Deploy the frontend as a separate static or web service.

### Deployment Steps

1. Create a Railway project from this repository and add a Railway PostgreSQL database.

2. Create the backend service with **Root Directory** set to `/backend`. Connect the PostgreSQL service so `DATABASE_URL` is available.

3. Configure the backend variables:

   - `ENVIRONMENT=production`
   - `SECRET_KEY` — a random value of at least 32 characters
   - `CORS_ORIGINS` — a JSON array containing the exact deployed frontend origin
   - `INITIAL_ADMIN_EMAIL`
   - `INITIAL_ADMIN_PASSWORD`
   - `INITIAL_CAMPUS_NAME` — optional
   - `GEMINI_API_KEY` — optional, for AI features

   Railway provides `RAILWAY_PUBLIC_DOMAIN`; the startup command uses it for the HTTPS measurement URL.

4. Generate a public backend domain. Set the health check to `/health/ready`. Wait for deployment and confirm readiness before configuring the frontend.

5. Deploy the frontend separately. Set the following variables:

   ```dotenv
   VITE_USE_BACKEND=true
   VITE_API_URL=https://your-backend-domain
   ```

   Replace the example URL with your actual backend HTTPS origin, without a trailing `/api`. Rebuild and redeploy the frontend.

6. Add the exact frontend origin to the backend's `CORS_ORIGINS`.

7. Bootstrap initializes only an empty database. Create or update subsequent accounts through the administrator UI. Back up PostgreSQL and verify deployed campus locations and endpoint configuration.

Keep all secrets in Railway's variable settings and local ignored `.env` files. Do not commit production credentials, API keys, or databases.

For additional deployment and scaling notes, see `backend/docs/DEPLOYMENT.md`.

### Deployment Considerations

The Railway service combines the API, measurement service, and periodic processing. Initially, run one backend instance because some rate limits and worker state are per-process.

For multiple instances, configure shared ingress rate limiting and account for duplicate periodic workers.

## Operations and Troubleshooting

| Symptom | What to Check |
|---|---|
| Login shows `502 Bad Gateway` for `/api/auth/login` | Start or restart the API on port 8000. Check `/health/ready`, terminal output, and `DATABASE_URL`. A Vite 502 usually means the proxy cannot reach the API. |
| “Email or password is incorrect” | Confirm the account exists in the correct database and campus, verify the email, and use the password set at bootstrap or printed once by the demo command. Demo accounts and mock-mode accounts are separate. |
| AI reports Gemini is not configured | Set `GEMINI_API_KEY` on the backend, then restart or redeploy it. Check backend logs and model availability. |
| AI says it cannot reach Gemini but produces output | The output may be the explicitly labelled keyword/factual fallback. Check outbound connectivity, key validity, model access, and timeout configuration. |
| Tests cannot start or expire | Ensure the measurement service and worker are running and share the API's `.env` and database. Check the endpoint URL, `MEASUREMENT_BASE_URL`, browser reachability, and session expiry. |
| Automatic incidents do not appear | An administrator must verify endpoint capacity/reachability and enable `operator_healthy`. The endpoint also needs a recent authenticated ping. |
| Browser on another device cannot test | `localhost` points to that device. Use a LAN/publicly reachable backend and measurement host, configure exact CORS origins and endpoint URLs, and use HTTPS outside local development. |

### Security Recommendations

- Use HTTPS in deployment.
- Restrict CORS to known frontend origins.
- Use a strong, unique `SECRET_KEY`.
- Protect PostgreSQL credentials.
- Maintain database backups.
- Use shared ingress limits when scaling beyond one backend process.

## Known Limitations

- Browser measurements are application-level round-trip time and throughput. They do not measure packet loss, Wi-Fi signal strength, SSID, or prove that a user is associated with the selected campus access point.
- The external Cloudflare test runs directly from each browser and transfers approximately 26 MiB per full test. It does not proxy speed-test traffic through the backend.
- Campus endpoint tests measure the path to the configured endpoint. The endpoint scope must reflect what it represents.
- Locations selected by users are user-reported. Administrator map pins must be verified against the actual campus.
- A reported or measured issue alone does not prove an infrastructure outage.
- Incident detection requires configured endpoint health and periodic processing. Local development therefore needs the worker process; Railway startup combines periodic processing with the backend service.
- Notifications are in-app only. Email/SMS delivery, SSO, continuous external infrastructure probes, packet-level telemetry, traffic telemetry, and machine-learning prediction are not implemented.
- No email password-recovery service is configured; the recovery form communicates this limitation.
- AI classification and summaries are optional and can use a labelled non-AI fallback. AI recommendations require human review.
- This repository is an application, not a preconfigured live campus installation. Production still needs verified campus locations, endpoint capacity and health, users, HTTPS, database operations, and device-specific calibration.

## Project Documentation

- `INTEGRATION.md` — Integrated frontend/backend architecture and behavior.
- `backend/README.md` — Backend setup, MVVM structure, features, Docker, and detailed operational notes.
- `backend/docs/API_CONTRACT.md` — API contract.
- `backend/docs/PARTNER_HANDOFF.md` — Frontend integration handoff.
- `backend/docs/DEPLOYMENT.md` — Production and scaling guidance.

### Common Project Commands

**Frontend production build** — run from the repository root:

```powershell
npm run build
```

**Frontend Node tests** — run from the repository root:

```powershell
npm test
```

**Backend tests** — run from `backend/`:

```powershell
.venv/Scripts/python.exe -m pytest -q
```

Install commands are documented in the local setup section. Tests and builds are not run automatically as part of README setup. See the backend README for the integration-kit test command and Docker Compose workflow.

