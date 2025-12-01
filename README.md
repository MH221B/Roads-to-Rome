# Roads to Rome

Roads to Rome is a full-stack project with a TypeScript/Node backend and a Vite + React frontend. This README explains how to run the app locally (Node or Docker), how CI/CD is configured, how authentication and authorization work, what environment variables are required, and the main architectural decisions.

---

## CI / CD Workflow

The GitHub Actions workflow (`.github/workflows/ci-cd.yaml`) runs on every `push` or `pull_request` targeting `main` or `dev`.

- **`server-lint` job:**
  - Checks out repo
  - Sets up Node.js 21
  - Runs `npm ci` in `server/`
  - Installs ESLint + TypeScript plugins (not in lockfile)
  - Runs `npx eslint src --ext .ts || true` (lints but never fails CI)

- **`server-deploy` job:**
  - Runs after `server-lint`
  - Calls the Render deploy hook stored in `RENDER_DEPLOY_HOOK`
  - If the secret is missing, exits with an error
  - `curl` is allowed to fail without failing CI

- **`client-deploy` job:**
  - Also waits for `server-lint`
  - Installs dependencies in `client/`
  - Builds Vite with `npm run build`
  - Deploys to Vercel via `npx vercel --prod --token "$VERCEL_TOKEN"`
  - Requires `VERCEL_TOKEN` GitHub secret

- **Optional (commented out):**
  Client lint/testing, server unit tests — enable these when stable.

---

## Render Deployment Configuration

- **Deploy hook:**
  Create a deploy hook under Render → _Manual Deploy → Deploy Hooks_ and store the URL in the `RENDER_DEPLOY_HOOK` GitHub secret. CI simply POSTs to it.

- **Environment variables:**
  Configure all vars used in `server/.env` (DB URL, JWT secrets, mail creds, OAuth keys). Exact names must match.

- **Monitoring deployments:**
  Verify successful builds via service logs and test the generated public URL.

---

## Running the Server Locally (Docker or Node)

### **Node (recommended for development)**

```powershell
cd server
npm install
npm run dev
```

Production build:

```powershell
cd server
npm install --production
npm run build
npm start
```

### **Client**

```powershell
cd client
npm install
npm run dev
```

Production build:

```powershell
cd client
npm run build
npm run preview
```

**Default URLs**

- Frontend → `http://localhost:5173`
- Backend → `http://localhost:3000`

---

## Running the Server in Docker

Before running, ensure `server/.env` exists with required variables.

### **Production-like container**

```powershell
cd server
docker compose -f docker-compose.yml up --build
```

### **Development container (with hot reload)**

```powershell
cd server
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

Stop containers:

```
docker compose down
```

View logs:

```
docker compose logs -f server
```

---

## Environment Variables

Create `server/.env` with at least:

- `MONGO_URI`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `RESET_PASSWORD_SECRET`
- `CLIENT_URL`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

**Email:**
Development uses Ethereal automatically (no setup).
Production requires a real SMTP provider (SendGrid, Mailgun, SES, Gmail SMTP, etc.).

---

## Authentication Overview

- **Access Token**
  - Short-lived JWT (~1h)
  - Signed with `ACCESS_TOKEN_SECRET`
  - Returned to the client in JSON
  - Should be stored in memory, not localStorage

- **Refresh Token**
  - Long-lived JWT (~7 days)
  - Signed with `REFRESH_TOKEN_SECRET`
  - Stored in an `HttpOnly`, `SameSite=strict`, `secure` cookie
  - Not accessible to JavaScript

- **Refresh flow**
  - Client calls refresh endpoint
  - Server reads refresh cookie
  - Server returns a new access token

- **Authorization**
  - Roles defined in `Role` enum
  - Middleware:
    - `authenticateToken`
    - `authorizeRoles([...])`

- **OAuth (GitHub)**
  - Implemented
  - Creates new users with `Role.STUDENT` by default
  - Generates and emails a fallback password

Key files:

- `server/src/middlewares/auth.middleware.ts`
- `server/src/services/auth.service.ts`
- `server/src/enums/user.enum.ts`

---

## Backend / External Setup

- Register GitHub OAuth app
  - Local callback: `http://localhost:3000/auth/github/callback`
  - Production callback: your deployed backend URL

- Add client ID/secret to environment variables
- For additional providers (Google/Facebook), repeat the same setup
- Email dev = Ethereal; prod = real SMTP

---

## Decisions & Tradeoffs

- **HttpOnly refresh cookie + short-lived access token**
  - Better XSS protection
  - Simplifies client-side token handling
  - Requires CSRF considerations (mitigated with `SameSite=strict`)

- **Stateless JWTs**
  - No session store required
  - Easy to scale horizontally
  - Harder to force immediate revocation

- **No refresh token rotation**
  - Simpler
  - Less secure if refresh token is leaked

- **OAuth user creation**
  - Auto-creating accounts makes onboarding straightforward
  - Could be surprising; alternative is requiring explicit setup

- **Email handling**
  - Ethereal for dev to prevent real email sends
  - Real SMTP required for production

---
