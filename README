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
