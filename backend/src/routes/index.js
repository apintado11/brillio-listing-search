const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const methodNotAllowed = require('../middleware/methodNotAllowed');
const validateSearch = require('../middleware/validateSearch');
const { createHealthController } = require('../controllers/healthController');
const { createListingsController } = require('../controllers/listingsController');

function createRoutes(repository) {
  const router = express.Router();
  const healthController = createHealthController(repository);
  const listingsController = createListingsController(repository);

  router.get('/health', asyncHandler(healthController.check));
  router.get('/api/cities', asyncHandler(listingsController.cities));
  router.get('/api/listings', validateSearch, asyncHandler(listingsController.search));
  router.all('/api/cities', methodNotAllowed);
  router.all('/api/listings', methodNotAllowed);

  return router;
}

module.exports = {
  createRoutes,
};
