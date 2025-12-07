# E-Commerce Platform

Modern ecommerce stack inspired by Amazon and Flipkart. The project is a full-stack application featuring a React + Vite + Tailwind frontend backed by a Node.js/Express API and Supabase for data, auth, and realtime updates.

## Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Headless UI, Zustand, Supabase client.
- **Backend**: Node.js 20, Express, TypeScript, Supabase admin client, Zod, Helmet, CORS.
- **Data & realtime**: Supabase (PostgreSQL + auth + realtime channels).
- **Tooling**: ESLint + Prettier configs, Dockerfiles for both apps, docker-compose dev harness.

## Project Structure

```
.
├── backend/        # Express + TypeScript backend services
├── frontend/       # React + Vite web app
├── docs/           # Architecture, API, and product documentation
├── infra/          # Infrastructure and deployment assets
└── README.md       # Project overview
```

## Quick Start

1. Copy the example environment files and fill in secrets.
   ```powershell
   Copy-Item frontend/.env.example frontend/.env
   Copy-Item backend/.env.example backend/.env
   ```
   - `frontend/.env` expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (already prefilled with your shared creds).
   - `backend/.env` also requires the Supabase **service role key** (never commit it) and optional `STRIPE_SECRET_KEY`.
2. Install dependencies for both apps.
   ```powershell
   cd frontend; npm install; cd ..
   cd backend; npm install; cd ..
   ```
3. Run the development servers (separate terminals).
   ```powershell
   cd backend; npm run dev
   cd frontend; npm run dev
   ```

## API & Frontend URLs

- API: `http://localhost:4000/api`
  - Health check: `GET /api/health`
  - Products listing: `GET /api/products?limit=12&category=electronics`
- Frontend: `http://localhost:5173`

The frontend ships with curated mock data while the backend attempts Supabase first and gracefully falls back to the same mock catalog if the table is empty.

## Docker (optional)

To run both services together with hot reload using the provided compose file:

```powershell
Set-Location infra/docker
docker compose --env-file ../../backend/.env up --build
```

> The compose file expects Supabase keys to be available in the environment or in a provided `.env` file passed via `--env-file`.

Detailed setup and deployment notes will be added as features land.
