const config = require('./config');
const { createApp } = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Listing search API listening on http://localhost:${config.port}`);
});

server.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});
