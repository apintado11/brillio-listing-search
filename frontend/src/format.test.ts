import { describe, expect, it } from 'vitest';
import {
  formatBaths,
  formatBeds,
  formatDate,
  formatMoneyInput,
  formatScore,
  formatSqft,
  formatUsd,
} from './format';

describe('formatUsd', () => {
  it('formats whole dollars with a symbol and grouping', () => {
    expect(formatUsd(450000)).toBe('$450,000');
    expect(formatUsd(0)).toBe('$0');
  });
});

describe('formatMoneyInput', () => {
  it('turns typed digits into currency', () => {
    expect(formatMoneyInput('4')).toBe('$4');
    expect(formatMoneyInput('450000')).toBe('$450,000');
    expect(formatMoneyInput('$450,000')).toBe('$450,000');
  });

  it('clears when no digits remain', () => {
    expect(formatMoneyInput('$')).toBe('');
    expect(formatMoneyInput('abc')).toBe('');
  });
});

describe('listing copy', () => {
  it('formats beds, baths, size, score, and date', () => {
    expect(formatBeds(1)).toBe('1 bed');
    expect(formatBeds(3)).toBe('3 beds');
    expect(formatBaths(1)).toBe('1 bath');
    expect(formatBaths(1.5)).toBe('1.5 baths');
    expect(formatSqft(1300)).toBe('1,300 sq ft');
    expect(formatScore(0.8875)).toBe('89%');
    expect(formatDate('2026-09-04')).toBe('Sep 4, 2026');
  });
});
