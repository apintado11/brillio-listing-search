const express = require('express');
const config = require('./config');
const cors = require('./middleware/cors');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { createListingsRepository } = require('./repositories/listingsRepository');
const { createRoutes } = require('./routes');

function createApp(options = {}) {
  const app = express();
  const repository = createListingsRepository(
    options.listingsFilePath || config.listingsFile,
  );

  app.disable('x-powered-by');
  app.use(cors);
  app.use(express.json({ limit: config.jsonBodyLimit }));
  app.use(createRoutes(repository));
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
