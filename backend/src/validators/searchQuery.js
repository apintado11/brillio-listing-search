const MAX_PAGE_SIZE = 50;
const MAX_TEXT_LENGTH = 80;

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function parseNumber(raw, name, details) {
  if (!isPresent(raw)) {
    return undefined;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    details.push(`${name} must be a number`);
    return undefined;
  }
  return n;
}

function parseInteger(raw, name, details) {
  const n = parseNumber(raw, name, details);
  if (n === undefined) {
    return undefined;
  }
  if (!Number.isInteger(n)) {
    details.push(`${name} must be a whole number`);
    return undefined;
  }
  return n;
}

function optionalString(raw, name, details) {
  if (!isPresent(raw)) {
    return undefined;
  }
  const value = String(raw).trim();
  if (value.length > MAX_TEXT_LENGTH) {
    details.push(`${name} must be at most ${MAX_TEXT_LENGTH} characters`);
    return undefined;
  }
  return value;
}

function validateSearchQuery(query = {}) {
  const details = [];

  const minPrice = parseNumber(query.minPrice, 'minPrice', details);
  const maxPrice = parseNumber(query.maxPrice, 'maxPrice', details);
  const minBedrooms = parseInteger(query.minBedrooms, 'minBedrooms', details);
  const city = optionalString(query.city, 'city', details);
  const keyword = optionalString(query.keyword, 'keyword', details);

  if (!isPresent(query.targetBudget)) {
    details.push('targetBudget is required');
  }
  const targetBudget = parseNumber(query.targetBudget, 'targetBudget', details);

  const page = isPresent(query.page)
    ? parseInteger(query.page, 'page', details)
    : 1;
  const pageSize = isPresent(query.pageSize)
    ? parseInteger(query.pageSize, 'pageSize', details)
    : 5;

  if (minPrice !== undefined && minPrice < 0) {
    details.push('minPrice must be at least 0');
  }
  if (maxPrice !== undefined && maxPrice < 0) {
    details.push('maxPrice must be at least 0');
  }
  if (minBedrooms !== undefined && minBedrooms < 0) {
    details.push('minBedrooms must be at least 0');
  }
  if (targetBudget !== undefined && targetBudget <= 0) {
    details.push('targetBudget must be greater than 0');
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    details.push('minPrice must not be greater than maxPrice');
  }
  if (page !== undefined && page < 1) {
    details.push('page must be at least 1');
  }
  if (pageSize !== undefined && pageSize <= 0) {
    details.push('pageSize must be greater than 0');
  }
  if (pageSize !== undefined && pageSize > MAX_PAGE_SIZE) {
    details.push(`pageSize must be at most ${MAX_PAGE_SIZE}`);
  }

  if (details.length > 0) {
    return {
      ok: false,
      error: 'Invalid search query',
      details,
    };
  }

  return {
    ok: true,
    value: {
      minPrice,
      maxPrice,
      minBedrooms,
      city,
      keyword,
      targetBudget,
      page,
      pageSize,
    },
  };
}

module.exports = {
  MAX_PAGE_SIZE,
  MAX_TEXT_LENGTH,
  validateSearchQuery,
};
