# DocNexus Outreach Platform

DocNexus is a production-minded MVP for AI-powered physician outreach. It helps teams discover physicians, enroll selected physicians into outreach campaigns, build multi-step email sequences, generate compliant email copy with Groq, and review campaign activity from a dashboard.

## Features

- Physician discovery with name search, specialty/state/affiliation/NPI-year filters, loading skeletons, empty states, and multi-select cards.
- Campaign builder with a three-step flow for setup, sequence authoring, preview, draft save, and launch.
- AI email generation through the backend only, using physician profile context and campaign type.
- Campaign list and campaign detail pages with status badges, enrolled physician tables, launch action, and mocked outreach metrics.
- Analytics dashboard with campaign rollups, metric cards, and campaign table navigation.
- System-aware light/dark theme with a sidebar toggle.
- Responsive app shell with a collapsible sidebar and React Router nested routes.

## Tech Stack

- Frontend: React 18, Vite, React Router v6, Tailwind CSS v3, shadcn-style UI primitives, Lucide React, Axios, Recharts.
- Backend: Python, FastAPI, async route handlers, Pydantic models, HTTPX for Groq API calls.
- Database: MongoDB Atlas through Motor, the async MongoDB driver.
- AI: Groq Chat Completions API, currently configured in `docnexus-api/routers/ai.py`.
- State: React `useState`, `useEffect`, `useMemo`, and local component state. No external state library.

## Architecture Decisions

- Frontend and backend are separated into `docnexus-client` and `docnexus-api` so each can be deployed independently.
- API calls are centralized in `docnexus-client/src/api` with one file per resource (`physicians.js`, `campaigns.js`, `ai.js`) to keep components focused on UI and state.
- FastAPI routers are split by domain (`physicians`, `campaigns`, `ai`) to keep endpoint ownership clear.
- MongoDB documents use UUID string IDs exposed to the frontend, while Mongo `_id` stays internal.
- Campaign detail joins enrolled physician documents at read time from `enrolledPhysicianIds`, keeping campaign writes simple for the MVP.
- Groq credentials live only in the backend `.env`; the frontend never receives or stores the API key.
- Tailwind CSS variables provide theme-aware shadcn-style components without hardcoded app-wide colors.

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB Atlas account or another MongoDB-compatible connection string
- Groq API key

## Environment Variables

Create the backend environment file from the example:

```bash
cp docnexus-api/.env.example docnexus-api/.env
```

Backend variables:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
GROQ_API_KEY=your_groq_api_key
```

Optional frontend environment file:

```bash
cp docnexus-client/.env.example docnexus-client/.env
```

Frontend variables:

```bash
VITE_API_URL=http://localhost:8000
```

If `VITE_API_URL` is omitted, the frontend defaults to `http://localhost:8000`.

## Install and Run Locally

Open two terminal windows: one for the backend and one for the frontend.

### 1. Backend Setup

```bash
cd docnexus-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Backend Environment

```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas URI and Groq API key.

### 3. Seed the Database

```bash
python seed.py
```

The seed script inserts realistic physician records and uses `npi` as a unique key to avoid duplicates.

### 4. Run the Backend

```bash
uvicorn main:app --reload
```

The API runs at:

```bash
http://localhost:8000
```

Useful smoke checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/physicians
curl http://localhost:8000/campaigns
```

### 5. Frontend Setup

```bash
cd docnexus-client
npm install
```

### 6. Run the Frontend

```bash
npm run dev
```

The app runs at:

```bash
http://localhost:5173
```

## Build Checks

Frontend production build:

```bash
cd docnexus-client
npm run build
```

Backend syntax/import check:

```bash
cd docnexus-api
source .venv/bin/activate
python -m py_compile main.py database.py models.py routers/physicians.py routers/campaigns.py routers/ai.py seed.py
```

## Main API Endpoints

- `GET /health` - API health check.
- `GET /physicians` - Physician search and filtering.
- `POST /campaigns` - Create a draft or active campaign.
- `GET /campaigns` - List campaigns by newest first.
- `GET /campaigns/{id}` - Get a campaign with enrolled physician objects.
- `PATCH /campaigns/{id}` - Partially update campaign fields.
- `PATCH /campaigns/{id}/launch` - Mark a draft campaign as active.
- `POST /ai/generate-email` - Generate a subject/body pair using Groq.

## Project Structure

```text
docnexus-api/
  main.py
  database.py
  models.py
  seed.py
  routers/
    physicians.py
    campaigns.py
    ai.py

docnexus-client/
  src/
    api/
    components/
    context/
    lib/
    pages/
```

## What I Would Build Next

- Authentication and role-based access control.
- Real campaign delivery integration through an email provider such as SendGrid, Postmark, or SES.
- Persistent campaign analytics instead of mocked dashboard metrics.
- Physician import/export workflows with CSV validation.
- AI prompt versioning, regeneration history, and approval workflows for compliance review.
- Deployment configuration for a hosted frontend, backend service, and managed MongoDB Atlas environment.

## Demo Video
https://youtu.be/RwUeLuejYyg
