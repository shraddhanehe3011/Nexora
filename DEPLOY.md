# Deploy NEXORA on Render

Repo: https://github.com/shraddhanehe3011/Nexora

## Recommended order

1. Deploy **backend** (`nexora-api`)
2. Copy its URL (example: `https://nexora-api.onrender.com`)
3. Deploy **frontend** (`nexora-web`) with `VITE_API_URL=https://nexora-api.onrender.com/api`
4. Update backend `FRONTEND_URL` / `CORS_ORIGINS` to the frontend URL

---

## Option A — Blueprint (both services)

1. Push this repo to GitHub (already connected).
2. Open [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
3. Select `shraddhanehe3011/Nexora`.
4. Apply `render.yaml`.
5. Fill secrets when prompted:

### Backend env (nexora-api)

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | Auto-generated or set yourself |
| `FRONTEND_URL` | `https://nexora-web.onrender.com` (after frontend exists) |
| `CORS_ORIGINS` | Same as frontend URL (comma-separated if multiple) |
| `LLM_API_KEY` | Optional |

### Frontend env (nexora-web) — build-time

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://nexora-api.onrender.com/api` ← must include `/api`, and must be the **backend** URL (not the static frontend) |

> Vite bakes `VITE_*` at **build** time. If you change the API URL later, trigger a frontend **Manual Deploy → Clear build cache & deploy**.

---

## Option B — Manual (two services)

### 1) Backend Web Service

- **New → Web Service**
- Repo: `Nexora`
- Root Directory: `backend`
- Runtime: Node
- Build: `npm install`
- Start: `npm start`
- Instance: Free
- Health check: `/api/health`

Environment:

```
NODE_ENV=production
MONGODB_URI=<atlas uri>
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<your-frontend>.onrender.com
CORS_ORIGINS=https://<your-frontend>.onrender.com
OPEN_FOOD_FACTS_BASE_URL=https://world.openfoodfacts.org
```

### 2) Frontend Static Site

- **New → Static Site**
- Repo: `Nexora`
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish directory: `dist`

Environment:

```
VITE_API_URL=https://<your-api>.onrender.com/api
```

Rewrite rule (SPA):

- Source: `/*`
- Destination: `/index.html`
- Action: Rewrite

---

## After deploy

1. Open frontend URL → Sign up / Login.
2. Hit `https://<api>.onrender.com/api/health` → should return `{ success: true, ... }`.
3. If browser shows CORS errors, set `FRONTEND_URL` and `CORS_ORIGINS` exactly to the frontend origin (no trailing slash).
4. Free tier sleeps after idle — first request may take ~30–60s.

## Notes

- Uploaded images on free Render disks are **ephemeral** (lost on redeploy/restart).
- MongoDB Atlas Network Access must allow Render (`0.0.0.0/0` is common for demos).
- Never commit `.env` with secrets.
