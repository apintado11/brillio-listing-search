# Brillio listing search assessment

Full-stack take-home: search property listings from multiple MLS feeds through a React UI backed by a small API.

This repo is **private**. The handout asks for individual work and a zip of the finished project, not a public solution.

## Handout

- [docs/Coding_Test_Question_Paper.pdf](docs/Coding_Test_Question_Paper.pdf) — problem statement
- [docs/Instructions.pdf](docs/Instructions.pdf) — take-home addendum
- [data/sample_listings.json](data/sample_listings.json) — sample listings (JSON file store)

The handout lists Python, Go, or Java for the backend. This repo has two matching APIs: **Node.js/Express** (`backend/`, port 3001) and **Python/Flask** (`backend-python/`, port 3002). The UI header switches between them. The search contract is the same.

## Backend

Express app in [`backend/`](backend/) and a spec-identical Flask app in [`backend-python/`](backend-python/). Listings live in [`data/sample_listings.json`](data/sample_listings.json) — that file is the database. Reads parse the array; writes (not exposed as HTTP yet) replace the file via a temp file + rename so POST/PUT can be added later without Mongo.

Layout (each folder has one job):

- `src/routes/index.js` — every endpoint in one list
- `src/controllers` — take the request, call repository + service, send the response
- `src/middleware` — CORS, validation, 404/405/500
- `src/services` — filter, score, paginate (no HTTP, no files)
- `src/repositories` — JSON file read/write
- `src/validators` — query rules
- `src/config` — port, data path, body limit
- `src/app.js` — wires the app; `src/server.js` listens

```bash
cd backend
npm install
npm start
```

```bash
cd backend-python
pip install -r requirements.txt
python src/server.py
```

API: `http://localhost:3001` (Node) or `http://localhost:3002` (Python)

- `GET /health` — process is up and the listings file is readable (503 if not)
- `GET /api/listings` — search, rank, paginate
- `GET /api/cities` — unique city names for the lookup
- Other methods on `/api/listings` and `/api/cities` — 405

`GET /api/listings` query params: `targetBudget` (required, > 0), `minPrice`, `maxPrice`, `minBedrooms`, `city`, `keyword` (description substring), `page` (default 1), `pageSize` (default 5, max 50), `sort` (default `match`; also `priceAsc`, `priceDesc`, `newest`, `bedsDesc`).

Bad input (for example `minPrice > maxPrice`, `pageSize <= 0`, negatives) returns **400** with `{ error, details }`. A valid query with no rows (unknown city, page past the last page) returns **200** with `results: []` and `total: 0`. Optional `LISTINGS_FILE` and `PORT` env vars override the data path and port.

### Scoring

The handout does not give a formula. Think of two stickers on a fridge, then mix them.

- **Price sticker (worth 70% of the final grade):** how close is the house price to the budget you typed?
- **Newness sticker (worth 30%):** among the houses that already survived your filters, is this one the newest or the oldest?

The UI badge is those two stickers mixed. It does **not** hide homes. Price range hides homes. Budget only reorders what is left.

#### Every number in `0.7 × 80 + 0.3 × 100 = 86`

Story: you typed budget **$450,000**. This house costs **$540,000**. It is the **newest** house still in the list.

```
1. Gap in dollars
   $540,000 − $450,000 = $90,000 off

2. Gap as a share of budget
   $90,000 ÷ $450,000 = 0.20  →  “20% off”

3. Price sticker (out of 100)
   100 − 20 = 80
   Perfect price would be 100. 100% off (or worse) is 0.
   So 80 means “pretty close, not perfect.”

4. Newness sticker (out of 100)
   newest in this result list = 100
   oldest in this result list = 0
   This house is newest, so 100.

5. Mix (this is the 0.7 and 0.3)
   0.7 means “price counts 70%.”
   0.3 means “newness counts 30%.”
   Those two numbers are ours. They are not in the listing JSON.
   0.7 × 80 = 56   ← seventy percent of the 80
   0.3 × 100 = 30  ← thirty percent of the 100
   56 + 30 = 86    ← Match %

6. What the API actually stores
   Code uses 0–1, not 0–100.
   price sticker 80  →  0.80
   newness sticker 100 →  1.00
   score = 0.7 × 0.80 + 0.3 × 1.00 = 0.86
   The card prints Math.round(0.86 × 100) + "%"  →  "86%"
```

Other price stickers with the same $450,000 budget:

| List price | Dollar gap | Gap ÷ budget | Price sticker |
| --- | --- | --- | --- |
| $450,000 | $0 | 0% | 100 |
| $540,000 | $90,000 | 20% | 80 |
| $675,000 | $225,000 | 50% | 50 |
| $900,000 | $450,000 | 100% | 0 |

We cap at 0 so a $2M house is not “more than 0% worse” than a $900k house.

If the search returns **one** house, that house is both newest and oldest, so the newness sticker is 0 (unless it listed today). If its price is also far from budget, both stickers are 0 and the badge shows **0%**. That is the lone Chantilly + $250k budget case.

If two mixed scores are equal, newer `listedDate` wins, then `source+id` so page 2 does not shuffle. Identity is `source + id` because `id` is only unique inside one MLS feed.

Default sort is this match number. Sort by price / newest / beds ignores it for order, but the badge still uses it.

#### Where the math runs (not in the UI)

The form does **not** compute Match %. It only sends the budget. The controller does **not** compute it either. The service does.

```
You type Budget $450,000
  → frontend form (query only)
  → frontend/src/api/listings.ts
     GET /api/listings?targetBudget=450000&page=1&pageSize=5&sort=match
  → Vite proxy
     Node  /api     → :3001
     Python /python → :3002
  → route  GET /api/listings
  → validator  “is this query legal?”  (no math)
  → controller  listingsController.search
       1. repository.getAll()  read sample_listings.json
       2. call the service
  → service  searchListings   filter → score → sort → paginate
  → scoring.js / scoring.py   this is the 0.7 / 0.80 / 0.86 math
       each home gets  score: 0.86
  → JSON back to the browser
  → ListingCard  formatScore(0.86)  →  "86%"
```

Same pipeline on Python: `backend-python/src/services/search_service.py` and `scoring.py`.

| Layer | File | Job |
| --- | --- | --- |
| UI form | `frontend/src/components/SearchPanel.tsx` | Collect budget / filters. No score math. |
| API client | `frontend/src/api/listings.ts` | Put numbers on the URL. |
| Route | `backend/src/routes/index.js` | Map `GET /api/listings` to search. |
| Validator | `backend/src/validators/searchQuery.js` | 400 vs ok. No score math. |
| Controller | `backend/src/controllers/listingsController.js` | Load file, call service, send JSON. |
| Service | `backend/src/services/searchService.js` | Filter, then score, then sort, then paginate. |
| Scoring | `backend/src/services/scoring.js` | The 70/30 mix. |
| Display | `frontend/src/format.ts` `formatScore` | `0.86` → `86%`. |

## Tests

```bash
cd backend
npm test
```

```bash
cd backend-python
pip install -r requirements.txt
python -m unittest discover -s tests -v
```

See [backend/TEST.md](backend/TEST.md) and [backend-python/TEST.md](backend-python/TEST.md) for the case list and curl commands.

## Frontend

React + TypeScript (Vite) in [`frontend/`](frontend/). The UI follows a Movement Mortgage-style layout: dark navy header, oversized condensed headline, coral primary actions, and a search card sitting on the hero. Client validators match the API (required budget, min/max price order, page size cap, string length).

```bash
cd backend
npm start
```

```bash
cd backend-python
python src/server.py
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to Node on `3001` and `/python` to Flask on `3002`. Use the **Node / Python** switch in the header.

```bash
cd frontend
npm test
npm run build
```

## Status

Backend and React UI are in place. Start both servers to demo search, empty results, validation errors, and pagination.
