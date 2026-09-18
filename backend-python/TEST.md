# Python backend tests

From `backend-python/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m unittest discover -s tests -v
```

On macOS/Linux, activate with `source .venv/bin/activate`.

Tests use a temp copy of `data/sample_listings.json`. The real sample file is not modified.

## What is covered

Same cases as the Node backend:

- Scoring: exact budget, far from budget, recency, tied scores
- Filters: min/max price, minBedrooms, city (case-insensitive), keyword, no matches
- Pagination: first page, last page, page past the end, pageSize larger than total
- Validation: missing `targetBudget`, non-numeric price, `minPrice > maxPrice`, `pageSize <= 0`, `pageSize > 50`, `page < 1`, negatives, oversized city/keyword
- `GET /health` 200, and 503 if the JSON file is missing
- `GET /api/listings` ranked and paginated
- `GET /api/cities`
- OPTIONS 204 (CORS), POST 405, no `X-Powered-By`

## Manual curl checks

```bash
python src/server.py
```

API: `http://localhost:3002`

```bash
curl "http://localhost:3002/health"
curl "http://localhost:3002/api/listings?targetBudget=450000&page=1&pageSize=5"
curl "http://localhost:3002/api/cities"
```
