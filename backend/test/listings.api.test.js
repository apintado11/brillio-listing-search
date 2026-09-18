const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { SAMPLE_PATH, startTestServer, tempListingsFile } = require('./helpers');

function listingsUrl(baseUrl, params) {
  const url = new URL('/api/listings', baseUrl);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url;
}

describe('listings HTTP API', () => {
  let ctx;
  let originalSample;

  before(async () => {
    originalSample = await fs.readFile(SAMPLE_PATH);
    const listingsFilePath = await tempListingsFile();
    ctx = await startTestServer(listingsFilePath);
  });

  after(async () => {
    if (ctx) {
      await ctx.close();
    }
    const afterSample = await fs.readFile(SAMPLE_PATH);
    assert.deepEqual(afterSample, originalSample);
  });

  it('GET /api/cities returns unique sorted city names', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/cities`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.cities));
    assert.ok(body.cities.includes('Springfield'));
    assert.ok(body.cities.includes('Fairfax'));
    assert.deepEqual(body.cities, [...body.cities].sort((a, b) => a.localeCompare(b)));
    assert.equal(body.cities.length, new Set(body.cities).size);
  });

  it('GET /api/listings returns ranked, paginated results with scores', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, page: 1, pageSize: 5 }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.page, 1);
    assert.equal(body.pageSize, 5);
    assert.ok(body.total >= 12);
    assert.equal(body.totalPages, Math.ceil(body.total / body.pageSize));
    assert.equal(body.results.length, 5);
    for (const row of body.results) {
      assert.ok(row.id);
      assert.ok(row.source);
      assert.ok(row.address);
      assert.equal(typeof row.price, 'number');
      assert.equal(typeof row.bedrooms, 'number');
      assert.equal(typeof row.bathrooms, 'number');
      assert.equal(typeof row.sqft, 'number');
      assert.equal(typeof row.score, 'number');
      assert.ok(row.city);
      assert.ok(row.state);
      assert.ok(row.zip);
      assert.ok(row.status);
      assert.ok(row.listedDate);
      assert.equal(typeof row.description, 'string');
    }
    const scores = body.results.map((row) => row.score);
    const sorted = [...scores].sort((a, b) => b - a);
    assert.deepEqual(scores, sorted);
  });

  it('returns 400 when minPrice is greater than maxPrice', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, {
        targetBudget: 450000,
        minPrice: 500000,
        maxPrice: 400000,
      }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Invalid search query');
    assert.ok(body.details.includes('minPrice must not be greater than maxPrice'));
  });

  it('returns 400 when pageSize is zero', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, pageSize: 0 }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('pageSize must be greater than 0'));
  });

  it('returns 400 when page is less than 1', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, page: 0 }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('page must be at least 1'));
  });

  it('returns 400 when targetBudget is missing', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/listings`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('targetBudget is required'));
  });

  it('returns 400 when a price filter is not a number', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, minPrice: 'abc' }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('minPrice must be a number'));
  });

  it('returns 200 with an empty page when the city has no matches', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, city: 'Atlantis' }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.results, []);
    assert.equal(body.total, 0);
    assert.equal(body.totalPages, 0);
  });

  it('keeps total when requesting a page past the last page', async () => {
    const first = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, page: 1, pageSize: 5 }),
    );
    const firstBody = await first.json();
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, page: 99, pageSize: 5 }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.results, []);
    assert.equal(body.total, firstBody.total);
    assert.equal(body.page, 99);
    assert.equal(body.totalPages, firstBody.totalPages);
  });

  it('filters by city, keyword, and minBedrooms together', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, {
        targetBudget: 450000,
        city: 'springfield',
        keyword: 'pet',
        minBedrooms: 2,
        pageSize: 20,
      }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 1);
    const ids = body.results.map((row) => row.id).sort();
    assert.deepEqual(ids, ['A1', 'B7']);
    for (const row of body.results) {
      assert.equal(row.city.toLowerCase(), 'springfield');
      assert.ok(row.bedrooms >= 2);
    }
  });

  it('applies default page and pageSize', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000 }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.page, 1);
    assert.equal(body.pageSize, 5);
    assert.equal(body.results.length, 5);
  });

  it('filters by minPrice over HTTP', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, {
        targetBudget: 450000,
        minPrice: 600000,
        pageSize: 20,
      }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 1);
    for (const row of body.results) {
      assert.ok(row.price >= 600000);
    }
  });

  it('filters by maxPrice over HTTP', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, {
        targetBudget: 450000,
        maxPrice: 400000,
        pageSize: 20,
      }),
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.total >= 1);
    for (const row of body.results) {
      assert.ok(row.price <= 400000);
    }
  });

  it('does not send X-Powered-By', async () => {
    const res = await fetch(`${ctx.baseUrl}/health`);
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  it('answers CORS preflight with 204', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/listings`, {
      method: 'OPTIONS',
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  it('rejects POST with 405', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/listings`, { method: 'POST' });
    assert.equal(res.status, 405);
    assert.match(res.headers.get('allow') || '', /GET/);
    const body = await res.json();
    assert.equal(body.error, 'Method not allowed');
  });

  it('returns 400 when pageSize exceeds the cap', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, pageSize: 51 }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('pageSize must be at most 50'));
  });

  it('returns 400 when minPrice is negative', async () => {
    const res = await fetch(
      listingsUrl(ctx.baseUrl, { targetBudget: 450000, minPrice: -1 }),
    );
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.details.includes('minPrice must be at least 0'));
  });

  it('GET /health returns 503 when the listings file is missing', async () => {
    const missing = await startTestServer(
      path.join(os.tmpdir(), `missing-listings-${Date.now()}.json`),
    );
    try {
      const health = await fetch(`${missing.baseUrl}/health`);
      assert.equal(health.status, 503);
      assert.deepEqual(await health.json(), { status: 'unavailable' });

      const listings = await fetch(
        listingsUrl(missing.baseUrl, { targetBudget: 450000 }),
      );
      assert.equal(listings.status, 500);
      assert.deepEqual(await listings.json(), { error: 'Internal server error' });
    } finally {
      await missing.close();
    }
  });
});
