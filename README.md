# KARTHIK.BLOG

A full-stack monorepo for a personal blog, music library, games, and more. Built with Node.js, React (Vite), Docker, and Nginx.

## Project Structure

```
karthik.blog/
├── backend/        # Node.js/Express backend
├── frontend/       # React (Vite) frontend
├── scripts/        # Deployment scripts and configs
├── docs/           # Documentation and Nginx config
├── VERSION.txt     # Version tracking
├── docker-compose.yml (optional)
└── README.md
```

## Local Development

### Prerequisites
- Node.js v22+ (managed via nvm - see `.nvmrc` files)
- PostgreSQL (for backend)
- nvm (Node Version Manager) - recommended

### Setup
1. **Switch to Node 22** (if using nvm):
	```bash
	nvm use 22
	# Or: nvm use (auto-detects .nvmrc)
	```

2. Clone the repo and install dependencies:
	```bash
	cd backend && npm install
	cd ../frontend && npm install
	```
2. Create `.env` files:
	- `backend/.env` for DB and secrets
	- `frontend/.env` for Vite API URL (e.g., `VITE_API_URL=http://localhost:3000/api`)
3. Start backend:
	```bash
	cd backend
	npm run dev
	```
4. Start frontend:
	```bash
	cd frontend
	npm run dev
	```
5. Access the app at [http://localhost:5173](http://localhost:5173)

## Production Deployment

### Build & Deploy
1. Set up your server with Docker and Nginx.
2. Configure environment variables in `scripts/.env.deploy`.
3. Run the deployment script:
	```bash
	set -a
	source scripts/.env.deploy
	set +a
	./scripts/build_deploy.sh
	```
4. Nginx proxies `/` to frontend and `/api` to backend. See `docs/nginx.conf` for example config.

### Environment Variables
- **Development:**
  - `backend/.env`: DB credentials, secrets
  - `frontend/.env`: VITE_API_URL
- **Production:**
  - `scripts/.env.deploy`: SSH, build/deploy flags, DB credentials

## Docker
- Each service has its own Dockerfile.
- Images are built, saved as tarballs, and transferred to the server for deployment by `scripts/build_deploy.sh`.
- (Optional) Use `docker-compose.yml` for local multi-service orchestration.

## Nginx
- Example config in `docs/nginx.conf`.
- Proxies `/` to frontend, `/api` and `/admin` to backend.

## Versioning
- `VERSION.txt` tracks frontend and backend versions for deployment.

---

For questions or contributions, open an issue or PR!