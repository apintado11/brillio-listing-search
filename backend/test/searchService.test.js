const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  filterListings,
  paginate,
  searchListings,
  uniqueCities,
} = require('../src/services/searchService');
const { listing, NOW } = require('./helpers');

const listings = [
  listing({
    id: 'A1',
    city: 'Springfield',
    price: 450000,
    bedrooms: 2,
    listedDate: '2026-09-17',
    description: 'Bright condo near transit. Pet friendly.',
  }),
  listing({
    id: 'A2',
    city: 'Fairfax',
    price: 399000,
    bedrooms: 2,
    listedDate: '2026-09-01',
    description: 'Cozy starter home, no pets.',
  }),
  listing({
    id: 'A3',
    city: 'Reston',
    price: 610000,
    bedrooms: 4,
    listedDate: '2026-09-03',
    description: 'Spacious family home. Pets welcome.',
  }),
  listing({
    id: 'A4',
    city: 'springfield',
    price: 525000,
    bedrooms: 3,
    listedDate: '2026-09-02',
    description: 'Updated kitchen, fenced yard.',
  }),
];

const baseQuery = {
  targetBudget: 450000,
  page: 1,
  pageSize: 2,
};

describe('filterListings', () => {
  it('filters by minPrice and maxPrice', () => {
    const result = filterListings(listings, {
      ...baseQuery,
      minPrice: 400000,
      maxPrice: 500000,
    });
    assert.deepEqual(
      result.map((row) => row.id),
      ['A1'],
    );
  });

  it('filters by minBedrooms', () => {
    const result = filterListings(listings, { ...baseQuery, minBedrooms: 3 });
    assert.deepEqual(
      result.map((row) => row.id).sort(),
      ['A3', 'A4'],
    );
  });

  it('matches city case-insensitively', () => {
    const result = filterListings(listings, { ...baseQuery, city: 'Springfield' });
    assert.deepEqual(
      result.map((row) => row.id).sort(),
      ['A1', 'A4'],
    );
  });

  it('matches keyword against description case-insensitively', () => {
    const result = filterListings(listings, { ...baseQuery, keyword: 'PET' });
    assert.deepEqual(
      result.map((row) => row.id).sort(),
      ['A1', 'A2', 'A3'],
    );
  });

  it('returns no matches when the city is unknown', () => {
    const result = filterListings(listings, { ...baseQuery, city: 'Atlantis' });
    assert.deepEqual(result, []);
  });

  it('treats a missing description as empty text', () => {
    const rows = [
      listing({ id: 'NO_DESC', description: undefined, city: 'Fairfax' }),
    ];
    delete rows[0].description;
    const result = filterListings(rows, { ...baseQuery, keyword: 'pets' });
    assert.deepEqual(result, []);
  });
});

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('returns the first page', () => {
    assert.deepEqual(paginate(items, 1, 3), {
      results: [1, 2, 3],
      page: 1,
      pageSize: 3,
      total: 7,
      totalPages: 3,
    });
  });

  it('returns the last partial page', () => {
    assert.deepEqual(paginate(items, 3, 3), {
      results: [7],
      page: 3,
      pageSize: 3,
      total: 7,
      totalPages: 3,
    });
  });

  it('returns an empty page past the end and keeps total', () => {
    assert.deepEqual(paginate(items, 9, 3), {
      results: [],
      page: 9,
      pageSize: 3,
      total: 7,
      totalPages: 3,
    });
  });

  it('returns all items when pageSize is larger than total', () => {
    assert.deepEqual(paginate(items, 1, 50), {
      results: items,
      page: 1,
      pageSize: 50,
      total: 7,
      totalPages: 1,
    });
  });
});

describe('searchListings', () => {
  it('filters, scores, sorts, then paginates', () => {
    const result = searchListings(listings, baseQuery, NOW);
    assert.equal(result.total, 4);
    assert.equal(result.totalPages, 2);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[0].id, 'A1');
    assert.ok(result.results[0].score >= result.results[1].score);
  });

  it('returns an empty result set with total 0 when nothing matches', () => {
    const result = searchListings(
      listings,
      { ...baseQuery, city: 'Atlantis' },
      NOW,
    );
    assert.deepEqual(result.results, []);
    assert.equal(result.total, 0);
    assert.equal(result.totalPages, 0);
  });

  it('sorts by price, listed date, or bedrooms when requested', () => {
    const byPrice = searchListings(
      listings,
      { ...baseQuery, sort: 'priceAsc', pageSize: 4 },
      NOW,
    );
    assert.deepEqual(
      byPrice.results.map((row) => row.id),
      ['A2', 'A1', 'A4', 'A3'],
    );

    const byNewest = searchListings(
      listings,
      { ...baseQuery, sort: 'newest', pageSize: 4 },
      NOW,
    );
    assert.deepEqual(
      byNewest.results.map((row) => row.id),
      ['A1', 'A3', 'A4', 'A2'],
    );

    const byBeds = searchListings(
      listings,
      { ...baseQuery, sort: 'bedsDesc', pageSize: 4 },
      NOW,
    );
    assert.deepEqual(
      byBeds.results.map((row) => row.id),
      ['A3', 'A4', 'A1', 'A2'],
    );
    assert.equal(typeof byBeds.results[0].score, 'number');
  });
});

describe('uniqueCities', () => {
  it('returns sorted unique city names, ignoring case', () => {
    assert.deepEqual(uniqueCities(listings), [
      'Fairfax',
      'Reston',
      'Springfield',
    ]);
  });
});
