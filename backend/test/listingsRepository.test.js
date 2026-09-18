const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const {
  createListingsRepository,
  listingKey,
} = require('../src/repositories/listingsRepository');
const { listing, tempListingsFile, SAMPLE_PATH } = require('./helpers');

describe('listingsRepository', () => {
  it('reads listings from a JSON file', async () => {
    const filePath = await tempListingsFile();
    const repo = createListingsRepository(filePath);
    const listings = await repo.getAll();
    assert.ok(Array.isArray(listings));
    assert.ok(listings.length >= 12);
    assert.equal(listings[0].id, 'A1');
  });

  it('identifies a listing by source and id', () => {
    assert.equal(listingKey({ source: 'MLS_A', id: 'A1' }), 'MLS_A::A1');
    assert.notEqual(
      listingKey({ source: 'MLS_A', id: 'A1' }),
      listingKey({ source: 'MLS_B', id: 'A1' }),
    );
  });

  it('writes updates to a temp copy, not the real sample file', async () => {
    const original = await fs.readFile(SAMPLE_PATH);
    const seed = [listing({ id: 'T1', source: 'MLS_A', price: 100 })];
    const filePath = await tempListingsFile(seed);
    const repo = createListingsRepository(filePath);

    const extra = listing({ id: 'T2', source: 'MLS_B', price: 200 });
    await repo.saveAll([...seed, extra]);

    const stored = await repo.getAll();
    assert.equal(stored.length, 2);
    assert.equal(stored[1].id, 'T2');

    const after = await fs.readFile(SAMPLE_PATH);
    assert.deepEqual(after, original);
  });
});
