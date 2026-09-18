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

The handout does not give a formula. This one is two report cards, then a weighted average. The UI shows that average as **Match %**.

**1. Price vs budget (70% of the score)**

How far is the list price from the number the user typed?

- Same as budget → 100
- 50% away (for example $675k when the budget is $450k) → 50
- Twice the budget or more, or half or less → 0 (we cap it so a $2M home is not “more than 0% worse” than a $900k home)

Worked example, budget **$450,000**:

| List price | How far off | Price score |
| --- | --- | --- |
| $450,000 | $0 / $450,000 = 0% | 100 |
| $540,000 | $90,000 / $450,000 = 20% | 80 |
| $900,000 | $450,000 / $450,000 = 100% | 0 |

**2. How new it is (30% of the score)**

Only among the homes that already passed the filters, not the whole MLS file.

- Newest in that list → 100
- Oldest in that list → 0
- Everything else is in between

If the search returns **one** home, it is both newest and oldest, so this piece is 0 (unless it listed today). That is why a lone Chantilly match can show **0%** when the price is also far from budget: both pieces are 0.

**3. Blend**

```
Match % = 70% × price score + 30% × newness score
```

Example: price score 80, newest in the list → `0.7 × 80 + 0.3 × 100 = 86`.

Budget is the bigger weight because that is what the user typed. Recency is a tie-breaker so a $451k listing from yesterday beats a $451k listing from last month.

If two scores are equal, newer `listedDate` wins, then `source+id` so page 2 does not shuffle. A listing’s identity is `source + id` because `id` is only unique inside one MLS feed.

Price **range** (min/max) is not scoring. It hides homes. Budget only reorders the ones that are left. Default sort is this match score; the Sort control can ignore it and order by price, date, or beds instead. The badge still shows the match number.

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
