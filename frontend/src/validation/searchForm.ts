import { SORTS, type SearchFormValues, type SearchParams, type SortOption } from '../types';

export const MAX_PAGE_SIZE = 50;
export const MAX_TEXT_LENGTH = 80;
export const DEFAULT_PAGE_SIZE = 5;

export type FieldErrors = Partial<Record<keyof SearchFormValues, string>>;

export function stripMoney(raw: string): string {
  return raw.replace(/[$,\s]/g, '');
}

function parseNumber(raw: string): number | undefined {
  const trimmed = stripMoney(raw);
  if (trimmed === '') {
    return undefined;
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}

function parseInteger(raw: string): number | undefined {
  const n = parseNumber(raw);
  if (n === undefined) {
    return undefined;
  }
  if (Number.isNaN(n) || !Number.isInteger(n)) {
    return Number.NaN;
  }
  return n;
}

export function validateSearchForm(values: SearchFormValues): {
  ok: true;
  params: Omit<SearchParams, 'page'>;
} | {
  ok: false;
  errors: FieldErrors;
} {
  const errors: FieldErrors = {};

  const targetBudget = parseNumber(values.targetBudget);
  if (targetBudget === undefined) {
    errors.targetBudget = 'Target budget is required.';
  } else if (Number.isNaN(targetBudget)) {
    errors.targetBudget = 'Enter a valid number.';
  } else if (targetBudget <= 0) {
    errors.targetBudget = 'Target budget must be greater than 0.';
  }

  const minPrice = parseNumber(values.minPrice);
  if (minPrice !== undefined) {
    if (Number.isNaN(minPrice)) {
      errors.minPrice = 'Enter a valid number.';
    } else if (minPrice < 0) {
      errors.minPrice = 'Min price must be at least 0.';
    }
  }

  const maxPrice = parseNumber(values.maxPrice);
  if (maxPrice !== undefined) {
    if (Number.isNaN(maxPrice)) {
      errors.maxPrice = 'Enter a valid number.';
    } else if (maxPrice < 0) {
      errors.maxPrice = 'Max price must be at least 0.';
    }
  }

  if (
    minPrice !== undefined &&
    maxPrice !== undefined &&
    !Number.isNaN(minPrice) &&
    !Number.isNaN(maxPrice) &&
    minPrice > maxPrice
  ) {
    errors.maxPrice = 'Max price must be at least min price.';
  }

  const minBedrooms = parseInteger(values.minBedrooms);
  if (minBedrooms !== undefined) {
    if (Number.isNaN(minBedrooms)) {
      errors.minBedrooms = 'Bedrooms must be a whole number.';
    } else if (minBedrooms < 0) {
      errors.minBedrooms = 'Bedrooms must be at least 0.';
    }
  }

  const city = values.city.trim();
  if (city.length > MAX_TEXT_LENGTH) {
    errors.city = `City must be at most ${MAX_TEXT_LENGTH} characters.`;
  }

  const keyword = values.keyword.trim();
  if (keyword.length > MAX_TEXT_LENGTH) {
    errors.keyword = `Keyword must be at most ${MAX_TEXT_LENGTH} characters.`;
  }

  const pageSize = parseInteger(values.pageSize);
  if (pageSize === undefined) {
    errors.pageSize = 'Results per page is required.';
  } else if (Number.isNaN(pageSize) || pageSize <= 0) {
    errors.pageSize = 'Results per page must be greater than 0.';
  } else if (pageSize > MAX_PAGE_SIZE) {
    errors.pageSize = `Results per page must be at most ${MAX_PAGE_SIZE}.`;
  }

  const sort = values.sort.trim();
  if (!SORTS.includes(sort as SortOption)) {
    errors.sort = 'Choose a valid sort.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    params: {
      targetBudget: targetBudget as number,
      minPrice,
      maxPrice,
      minBedrooms,
      city: city || undefined,
      keyword: keyword || undefined,
      pageSize: pageSize as number,
      sort: sort as SortOption,
    },
  };
}

export const emptyForm: SearchFormValues = {
  targetBudget: '$450,000',
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  city: '',
  keyword: '',
  pageSize: String(DEFAULT_PAGE_SIZE),
  sort: 'match',
};
