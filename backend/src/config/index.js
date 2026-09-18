module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  listingsFile: process.env.LISTINGS_FILE,
  jsonBodyLimit: '32kb',
};
