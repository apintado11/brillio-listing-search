const { scoreListings, sortByScore } = require('./scoring');

function matchesFilters(listing, query) {
  if (query.minPrice !== undefined && listing.price < query.minPrice) {
    return false;
  }
  if (query.maxPrice !== undefined && listing.price > query.maxPrice) {
    return false;
  }
  if (query.minBedrooms !== undefined && listing.bedrooms < query.minBedrooms) {
    return false;
  }
  const city = String(listing.city || '');
  if (query.city && city.toLowerCase() !== query.city.toLowerCase()) {
    return false;
  }
  const description = String(listing.description || '');
  if (
    query.keyword &&
    !description.toLowerCase().includes(query.keyword.toLowerCase())
  ) {
    return false;
  }
  return true;
}

function filterListings(listings, query) {
  return listings.filter((listing) => matchesFilters(listing, query));
}

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const results = start >= total ? [] : items.slice(start, start + pageSize);
  return { results, page, pageSize, total, totalPages };
}

function searchListings(listings, query, now = new Date()) {
  const filtered = filterListings(listings, query);
  const scored = scoreListings(filtered, query.targetBudget, now);
  const ranked = sortByScore(scored);
  return paginate(ranked, query.page, query.pageSize);
}

function uniqueCities(listings) {
  const seen = new Map();
  for (const listing of listings) {
    const city = String(listing.city || '').trim();
    if (!city) {
      continue;
    }
    const key = city.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, city);
    }
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

function toPublicListing(listing) {
  return {
    id: listing.id,
    source: listing.source,
    address: listing.address,
    city: listing.city,
    state: listing.state,
    zip: listing.zip,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    latitude: listing.latitude,
    longitude: listing.longitude,
    status: listing.status,
    listedDate: listing.listedDate,
    description: listing.description,
    score: listing.score,
  };
}

module.exports = {
  filterListings,
  paginate,
  searchListings,
  toPublicListing,
  uniqueCities,
};
