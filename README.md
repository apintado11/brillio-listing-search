# Brillio listing search assessment

Full-stack take-home: search property listings from multiple MLS feeds through a React UI backed by a small API.

This repo is **private**. The handout asks for individual work and a zip of the finished project, not a public solution.

## Handout

- [docs/Coding_Test_Question_Paper.pdf](docs/Coding_Test_Question_Paper.pdf) — problem statement
- [docs/Instructions.pdf](docs/Instructions.pdf) — take-home addendum
- [data/sample_listings.json](data/sample_listings.json) — sample listings (JSON file store)

The handout lists Python, Go, or Java for the backend. This implementation uses **Node.js and Express** because that is the stack that can be changed live in the session. The API contract and search logic are language-independent.

## Backend

Express app in [`backend/`](backend/). Listings live in [`data/sample_listings.json`](data/sample_listings.json) — that file is the database. Reads parse the array; writes (not exposed as HTTP yet) replace the file via a temp file + rename so POST/PUT can be added later without Mongo.

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

API: `http://localhost:3001`

- `GET /health` — process is up and the listings file is readable (503 if not)
- `GET /api/listings` — search, rank, paginate
- Other methods on `/api/listings` — 405

`GET /api/listings` query params: `targetBudget` (required, > 0), `minPrice`, `maxPrice`, `minBedrooms`, `city`, `keyword` (description substring), `page` (default 1), `pageSize` (default 5, max 50).

Bad input (for example `minPrice > maxPrice`, `pageSize <= 0`, negatives) returns **400** with `{ error, details }`. A valid query with no rows (unknown city, page past the last page) returns **200** with `results: []` and `total: 0`. Optional `LISTINGS_FILE` and `PORT` env vars override the data path and port.

### Scoring

There is no single correct formula. This one is a weighted blend so it is easy to change in the interview:

- `budgetFit = 1 - min(|price - targetBudget| / targetBudget, 1)` — 1.0 when price equals budget, 0 when 100%+ away
- `recencyFit = 1 - (daysSinceListed / maxDaysSinceListedInTheFilteredSet)` — newest among current matches is 1.0, oldest is 0
- `score = round(0.7 * budgetFit + 0.3 * recencyFit, 4)`

Ties: newer `listedDate` first, then `source+id` so pagination is stable.

Trade-off: budget is the user's intent; recency is a smaller second signal. Weights are explicit on purpose.

Identity for a listing is `source + id` (the handout says `id` is only unique per feed).

## Tests

```bash
cd backend
npm test
```

See [backend/TEST.md](backend/TEST.md) for the case list and curl commands.

## Frontend

React + TypeScript (Vite) in [`frontend/`](frontend/). The UI follows a Movement Mortgage-style layout: dark navy header, oversized condensed headline, coral primary actions, and a search card sitting on the hero. Client validators match the API (required budget, min/max price order, page size cap, string length).

```bash
cd backend
npm start
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:3001`.

```bash
cd frontend
npm test
npm run build
```

## Status

Backend and React UI are in place. Start both servers to demo search, empty results, validation errors, and pagination.
