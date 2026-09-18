const { searchListings, toPublicListing, uniqueCities } = require('../services/searchService');

function createListingsController(repository) {
  async function search(req, res) {
    const listings = await repository.getAll();
    const result = searchListings(listings, req.validatedQuery);
    return res.status(200).json({
      results: result.results.map(toPublicListing),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    });
  }

  async function cities(req, res) {
    const listings = await repository.getAll();
    return res.status(200).json({ cities: uniqueCities(listings) });
  }

  return { search, cities };
}

module.exports = {
  createListingsController,
};
