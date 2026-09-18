# Backend tests

From `backend/`:

```bash
npm test
```

That runs Node's built-in test runner (`node --test`) over every file in `test/`.

One file:

```bash
node --test test/scoring.test.js
node --test test/validation.test.js
node --test test/searchService.test.js
node --test test/listingsRepository.test.js
node --test test/listings.api.test.js
```

Tests use a temp copy of `data/sample_listings.json`. The real sample file is not modified.

## What is covered

Core logic (no HTTP):

- Scoring: exact budget, far from budget, recency, tied scores
- Filters: min/max price, minBedrooms, city (case-insensitive), keyword, no matches
- Pagination: first page, last page, page past the end, pageSize larger than total
- Validation: missing `targetBudget`, non-numeric price, `minPrice > maxPrice`, `pageSize <= 0`, `pageSize > 50`, `page < 1`, negatives, oversized city/keyword

HTTP (`fetch` against Express on a random port):

- `GET /health` 200, and 503 if the JSON file is missing
- `GET /api/listings` happy path (ranked, paginated, `score` present)
- Default `page`/`pageSize`
- minPrice / maxPrice filters over HTTP
- Each validation case above as HTTP 400
- Unknown city → 200 and `results: []`
- Page past the end → 200, empty `results`, `total` unchanged
- OPTIONS 204 (CORS), POST 405, no `X-Powered-By`

## Manual curl checks

Start the API (`npm start` in `backend/`), then:

```bash
curl "http://localhost:3001/health"

curl "http://localhost:3001/api/listings?targetBudget=450000&page=1&pageSize=5"

curl "http://localhost:3001/api/listings?targetBudget=450000&city=Atlantis"

curl "http://localhost:3001/api/listings?targetBudget=450000&minPrice=500000&maxPrice=400000"

curl "http://localhost:3001/api/listings?targetBudget=450000&pageSize=0"
```

Expected: health 200; first search 200 with five ranked rows; Atlantis 200 empty; min/max and pageSize 400 with `details`.
