# Roads to Rome

## CI / CD Workflow

- **Triggers:** the workflow defined in `.github/workflows/ci-cd.yaml` runs on every `push` or `pull_request` against `main` and `dev`.
- **`server-lint` job:** checks out the repo, sets up Node.js 21, installs server deps with `npm ci`, installs ESLint and TypeScript parser/plugin packages (needed because the lockfile does not include them), then runs `npx eslint src --ext .ts || true`. The `|| true` keeps CI green while lint failures are surfaced in logs.
- **`server-deploy` job:** depends on `server-lint`, re-checks out the repo, and posts to the Render deploy hook stored in the `RENDER_DEPLOY_HOOK` secret. If the secret is missing the job exits with an error message (and `curl` is allowed to fail without failing the job).
- **`client-deploy` job:** also waits for `server-lint`, installs the client dependencies, builds the Vite app via `npm run build`, and then runs `npx vercel --prod --token "$VERCEL_TOKEN" --confirm`. The `VERCEL_TOKEN` repository secret must be configured for the deployment to trigger.
- **Future jobs (optional):** there are commented-out steps for client linting/testing and server unit tests in the workflow; they can be enabled once the commands are stable or required.

## Render Deployment Configuration

- **Deploy hook:** create a HTTP webhook in Render (e.g., on the server service's "Manual Deploy -> Deploy Hooks") and copy the full URL into the `RENDER_DEPLOY_HOOK` GitHub secret that the workflow uses. The hook only needs the `POST` method with no payload – CI calls it after the server build succeeds.
- **Environment variables:** mirror the values you use locally (database connection string, `JWT_SECRET`, mail credentials, etc.) inside Render's "Environment" tab for the server service so the Docker deployment has everything it needs. Keep the names identical to what `server/.env` expects.
- **Service health:** once the workflow pushes to the hook, Render will queue a deploy; verify it by checking the service's deploy logs, confirming the build step, and hitting the public URL it exposes.

## Running the Server Locally in Docker

1. **Prepare environment variables:** copy or create `server/.env` with the same variables your Render deployment expects (`MONGO_URI`, `JWT_SECRET`, mail credentials, etc.). The Docker Compose files rely on that file (`env_file: - .env`).

2. **Production-like container:**

   ```powershell
   cd server
   docker compose -f docker-compose.yml up --build
   ```

   This builds the multi-stage image, publishes port `3000`, sets `NODE_ENV=production`, and runs the compiled `dist/index.js`. The container is named `roads-to-rome-server` and can be stopped with `docker compose -f docker-compose.yml down`.

3. **Development container (with hot reload):**

   ```powershell
   cd server
   docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
   ```

   The override switches to `npm run dev` (watch mode), mounts the repo into the container so code changes are reflected immediately, and exposes the same port. It also names the container `roads-to-rome-server-dev` and still loads `NODE_ENV` from the override.

4. **Inspect/logs:** use `docker compose -f docker-compose.yml logs -f server` (or include the override file) to follow the server output. Finish the session with `docker compose down` to remove containers (+volumes if you add `-v`).

5. **Verify:** hit `http://localhost:3000` (or any exposed API path) from your browser or an HTTP client such as `curl`/Postman.

## Running the Frontend Locally

- **Prerequisites:** have Node.js and `npm` installed.

- **Install and run (PowerShell):**

# Roads to Rome

Roads to Rome is a full-stack sample app with a TypeScript/Node backend and a Vite + React frontend. This README focuses on quick setup, local development options, environment requirements, and where to look for deployment/configuration details.

## Quick Start — Local (recommended)

- Prerequisites: Node.js, npm, and (optionally) Docker.
- Run backend and frontend locally in separate terminals:

  Server (development):

  ```powershell
  cd server
  npm install
  npm run dev
  ```

  Client (development):

  ```powershell
  cd client
  npm install
  npm run dev
  ```

  - Frontend: typically at `http://localhost:5173`.
  - Backend: typically at `http://localhost:3000`.

## Quick Start — Docker (production-like / dev with hot reload)

- Ensure `server/.env` exists with required variables (see "Environment").

Production-like container:

```powershell
cd server
docker compose -f docker-compose.yml up --build
```

Development container (hot reload):

```powershell
cd server
docker compose -f docker-compose.yml -f docker-compose.override.yml up --build
```

Use `docker compose down` to stop and remove containers. Tail logs with `docker compose logs -f server`.

## Environment

Create `server/.env` (copy from any example you maintain) and set at minimum:

- `MONGO_URI` — MongoDB connection string
- `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `RESET_PASSWORD_SECRET`
- `CLIENT_URL` — frontend origin (e.g., `http://localhost:5173`)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (if using GitHub OAuth)

For email in development the server uses Ethereal (no external setup). For production, configure a real SMTP provider.

## CI / Deployment (summary)

- The repository contains a GitHub Actions workflow that runs on pushes/PRs to `main` and `dev`. It lints the server and can deploy the server (via a Render deploy hook) and the client (via Vercel) when configured with the appropriate secrets (`RENDER_DEPLOY_HOOK`, `VERCEL_TOKEN`).
- For Render deployments: create a deploy hook, add it to the `RENDER_DEPLOY_HOOK` repo secret, and configure service environment variables to match `server/.env`.

## Authentication (high level)

- Access tokens: short-lived JWTs (signed with `ACCESS_TOKEN_SECRET`).
- Refresh tokens: longer-lived JWTs (signed with `REFRESH_TOKEN_SECRET`) stored in an `HttpOnly` cookie.
- Roles: handled via a `Role` enum; `authenticateToken` and `authorizeRoles` middleware enforce access controls.
- OAuth: GitHub OAuth is implemented; new GitHub users are created with `Role.STUDENT` by default.
