# Bhoomi Insight

Predictive analytics for early detection of land-acquisition delays. The app
uses a FastAPI backend, a React/Vite GIS frontend, SQLAlchemy persistence, and
the trained Random Forest pipeline in `backend/models/model.pkl`.

## Local development

The backend requires an explicit environment, a JWT secret of at least 32
bytes, and a database URL. For local development, use a separate SQLite file
so the tracked legacy database is not changed:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt -r requirements-dev.txt
$env:ENVIRONMENT = "development"
$env:DATABASE_URL = "sqlite:///./bhoomi_insight_dev.sqlite3"
$env:JWT_SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(48))"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:5173"
python -m migrations
python -m uvicorn main:app --reload
```

In another terminal:

```powershell
Set-Location gis
npm ci
$env:VITE_API_URL = "http://127.0.0.1:8000"
npm run dev
```

The Vite development server runs on port 3000. `VITE_API_URL` must be set
explicitly; the frontend does not silently fall back to a localhost API.

## Production environment

Configure these values in the hosting provider; never commit real values:

| Variable | Purpose |
| --- | --- |
| `ENVIRONMENT` | Set to `production`; production configuration fails closed. |
| `JWT_SECRET_KEY` | Random secret of at least 32 bytes; do not reuse a development key. |
| `DATABASE_URL` | Neon PostgreSQL URL for API traffic; use the pooled URL for web requests. |
| `DATABASE_URL_UNPOOLED` | Neon direct (non-pooled) URL used by the migration command. |
| `CORS_ORIGINS` | Comma-separated exact HTTPS frontend origins, without paths. |
| `ALLOW_USER_REGISTRATION` | Optional; registration is disabled unless explicitly set to `true`. |
| `VITE_API_URL` | Frontend build-time variable set to the HTTPS backend origin. |

### Render backend

The configured backend service uses `backend` as its root directory. Set the
build command to `pip install -r requirements.txt` and the start command to:

```sh
python -m migrations && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set all backend variables listed above in Render. Ensure that
`DATABASE_URL_UNPOOLED` is the Neon direct URL, not a hostname containing the
`-pooler` endpoint label. The migration runner refuses a pooled URL.
`GET /health` checks database connectivity; a healthy response does not by
itself verify frontend access or prediction quality.

### Vercel frontend

Use `gis` as the project root, `npm run build` as the build command, and `dist`
as the output directory. Set `VITE_API_URL` to the Render API origin, for
example `https://bhoomi-insight-backend.onrender.com`, and include the exact
deployed Vercel origin in Render's `CORS_ORIGINS` value. Production builds
fail if `VITE_API_URL` is missing, invalid, HTTP, or a loopback host.

The configured service references are [Render backend](https://bhoomi-insight-backend.onrender.com)
and [Vercel project](https://vercel.com/janani-a6e7/bhoomi-insight). Their
current live health and frontend/API integration have not been verified from
this repository checkout.

## API overview

Protected API operations use a bearer token from `/login`. Main routes include
`/health`, `/register`, `/login`, `/projects`, `/projects/predict`,
`/projects/{id}/predict`, `/predictions/{project_id}`, `/simulate`, and
`/analytics`. Interactive API documentation is disabled in production.

## Domain calculations

- Acres to hectares: `acres × 0.40468564224`.
- Hectares to acres: `hectares ÷ 0.40468564224`.
- Crores to rupees: `crores × 10,000,000`.
- Rupees to crores: `rupees ÷ 10,000,000`.
- Delay risk percentage: `predict_proba(project_features)[0][delayed_class] × 100`.
- Risk bands: below 40 is Low, 40 to below 70 is Medium, and 70 or above is
  High.

Conversion constants and helpers are in `gis/src/utils/units.ts`; form and
API conversions are used in `gis/src/pages/AddProjectPage.tsx` and
`gis/src/App.tsx`. Model probability and stage scoring are in
`backend/predict.py` and `backend/stage_risk.py`.

The GIS map only places a marker when exact project-site latitude and
longitude have been recorded. District names are not used to invent project
coordinates. Historical delay-duration analytics are not shown because the
current model does not predict duration.

## Tests and builds

```powershell
Set-Location backend
.\venv\Scripts\python.exe -m pytest tests -q
Set-Location ..\gis
$env:VITE_API_URL = "https://bhoomi-insight-backend.onrender.com"
npm run test
npm run lint
npm run build
```
