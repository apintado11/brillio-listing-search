import { describe, expect, it } from 'vitest';
import { emptyForm, validateSearchForm } from './searchForm';

describe('validateSearchForm', () => {
  it('accepts the default budget-only form', () => {
    const result = validateSearchForm(emptyForm);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.targetBudget).toBe(450000);
      expect(result.params.pageSize).toBe(5);
    }
  });

  it('requires a target budget', () => {
    const result = validateSearchForm({ ...emptyForm, targetBudget: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.targetBudget).toMatch(/required/i);
    }
  });

  it('rejects minPrice greater than maxPrice', () => {
    const result = validateSearchForm({
      ...emptyForm,
      minPrice: '500000',
      maxPrice: '400000',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.maxPrice).toMatch(/min price/i);
    }
  });

  it('rejects a pageSize of zero', () => {
    const result = validateSearchForm({ ...emptyForm, pageSize: '0' });
    expect(result.ok).toBe(false);
  });

  it('parses currency formatting', () => {
    const result = validateSearchForm({
      ...emptyForm,
      targetBudget: '$450,000',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.targetBudget).toBe(450000);
    }
  });

  it('treats blank optional filters as omitted', () => {
    const result = validateSearchForm(emptyForm);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.params.city).toBeUndefined();
      expect(result.params.minPrice).toBeUndefined();
    }
  });
});
