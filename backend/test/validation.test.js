const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateSearchQuery } = require('../src/validators/searchQuery');

describe('validateSearchQuery', () => {
  it('applies defaults for page and pageSize when targetBudget is present', () => {
    const result = validateSearchQuery({ targetBudget: '450000' });
    assert.equal(result.ok, true);
    assert.deepEqual(result.value, {
      minPrice: undefined,
      maxPrice: undefined,
      minBedrooms: undefined,
      city: undefined,
      keyword: undefined,
      targetBudget: 450000,
      page: 1,
      pageSize: 5,
    });
  });

  it('rejects a missing targetBudget', () => {
    const result = validateSearchQuery({});
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Invalid search query');
    assert.ok(result.details.includes('targetBudget is required'));
  });

  it('rejects a non-numeric price', () => {
    const result = validateSearchQuery({
      targetBudget: '450000',
      minPrice: 'cheap',
    });
    assert.equal(result.ok, false);
    assert.ok(result.details.includes('minPrice must be a number'));
  });

  it('rejects minPrice greater than maxPrice', () => {
    const result = validateSearchQuery({
      targetBudget: '450000',
      minPrice: '500000',
      maxPrice: '400000',
    });
    assert.equal(result.ok, false);
    assert.ok(result.details.includes('minPrice must not be greater than maxPrice'));
  });

  it('rejects pageSize of zero or less', () => {
    const zero = validateSearchQuery({ targetBudget: '1', pageSize: '0' });
    assert.equal(zero.ok, false);
    assert.ok(zero.details.includes('pageSize must be greater than 0'));

    const negative = validateSearchQuery({ targetBudget: '1', pageSize: '-2' });
    assert.equal(negative.ok, false);
    assert.ok(negative.details.includes('pageSize must be greater than 0'));
  });

  it('rejects page less than 1', () => {
    const result = validateSearchQuery({ targetBudget: '1', page: '0' });
    assert.equal(result.ok, false);
    assert.ok(result.details.includes('page must be at least 1'));
  });

  it('trims optional city and keyword', () => {
    const result = validateSearchQuery({
      targetBudget: '100',
      city: '  Fairfax  ',
      keyword: '  pets  ',
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.city, 'Fairfax');
    assert.equal(result.value.keyword, 'pets');
  });

  it('rejects negative prices, bedrooms, and targetBudget', () => {
    const price = validateSearchQuery({
      targetBudget: '450000',
      minPrice: '-1',
    });
    assert.equal(price.ok, false);
    assert.ok(price.details.includes('minPrice must be at least 0'));

    const bedrooms = validateSearchQuery({
      targetBudget: '450000',
      minBedrooms: '-1',
    });
    assert.equal(bedrooms.ok, false);
    assert.ok(bedrooms.details.includes('minBedrooms must be at least 0'));

    const budget = validateSearchQuery({ targetBudget: '0' });
    assert.equal(budget.ok, false);
    assert.ok(budget.details.includes('targetBudget must be greater than 0'));
  });

  it('rejects a pageSize above the cap', () => {
    const result = validateSearchQuery({
      targetBudget: '450000',
      pageSize: '51',
    });
    assert.equal(result.ok, false);
    assert.ok(result.details.includes('pageSize must be at most 50'));
  });

  it('rejects an oversized city string', () => {
    const result = validateSearchQuery({
      targetBudget: '450000',
      city: 'x'.repeat(81),
    });
    assert.equal(result.ok, false);
    assert.ok(result.details.includes('city must be at most 80 characters'));
  });
});
