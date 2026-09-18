const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  budgetFit,
  scoreListings,
  sortByScore,
} = require('../src/services/scoring');
const { listing, NOW } = require('./helpers');

describe('budgetFit', () => {
  it('is 1 when price equals targetBudget', () => {
    assert.equal(budgetFit(450000, 450000), 1);
  });

  it('is 0 when price is 100% or more away from targetBudget', () => {
    assert.equal(budgetFit(900000, 450000), 0);
    assert.equal(budgetFit(0, 450000), 0);
  });

  it('is 0.5 when price is 50% away from targetBudget', () => {
    assert.equal(budgetFit(675000, 450000), 0.5);
  });
});

describe('scoreListings', () => {
  it('gives a newer listing a higher score when prices match', () => {
    const listings = [
      listing({ id: 'OLD', listedDate: '2026-09-07', price: 450000 }),
      listing({ id: 'NEW', listedDate: '2026-09-17', price: 450000 }),
    ];
    const scored = scoreListings(listings, 450000, NOW);
    const newer = scored.find((row) => row.id === 'NEW');
    const older = scored.find((row) => row.id === 'OLD');
    assert.equal(newer.score, 1);
    assert.equal(older.score, 0.7);
  });

  it('gives a closer-to-budget listing a higher budget component', () => {
    const listings = [
      listing({ id: 'NEAR', price: 450000, listedDate: '2026-09-17' }),
      listing({ id: 'FAR', price: 900000, listedDate: '2026-09-17' }),
    ];
    const scored = scoreListings(listings, 450000, NOW);
    const near = scored.find((row) => row.id === 'NEAR');
    const far = scored.find((row) => row.id === 'FAR');
    assert.equal(near.score, 1);
    assert.equal(far.score, 0.3);
  });

  it('assigns the same score when price and listedDate match (tied scores)', () => {
    const listings = [
      listing({ id: 'A1', source: 'MLS_A', price: 400000, listedDate: '2026-09-10' }),
      listing({ id: 'B1', source: 'MLS_B', price: 400000, listedDate: '2026-09-10' }),
    ];
    const scored = scoreListings(listings, 400000, NOW);
    assert.equal(scored[0].score, scored[1].score);
  });
});

describe('sortByScore', () => {
  it('breaks tied scores by newer listedDate, then source+id', () => {
    const tied = sortByScore([
      listing({ id: 'B1', source: 'MLS_B', score: 0.5, listedDate: '2026-09-10' }),
      listing({ id: 'A1', source: 'MLS_A', score: 0.5, listedDate: '2026-09-10' }),
    ]);
    assert.equal(`${tied[0].source}+${tied[0].id}`, 'MLS_A+A1');
    assert.equal(`${tied[1].source}+${tied[1].id}`, 'MLS_B+B1');

    const byDate = sortByScore([
      listing({ id: 'OLD', score: 0.5, listedDate: '2026-08-01' }),
      listing({ id: 'NEW', score: 0.5, listedDate: '2026-09-01' }),
    ]);
    assert.equal(byDate[0].id, 'NEW');
  });

  it('orders higher scores first', () => {
    const ranked = sortByScore([
      listing({ id: 'LOW', score: 0.2 }),
      listing({ id: 'HIGH', score: 0.9 }),
    ]);
    assert.equal(ranked[0].id, 'HIGH');
  });
});
