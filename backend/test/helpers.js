const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const http = require('http');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { createApp } = require('../src/app');

const SAMPLE_PATH = path.resolve(__dirname, '../../data/sample_listings.json');

const NOW = new Date('2026-09-17T00:00:00.000Z');

function listing(overrides) {
  return {
    id: 'X1',
    source: 'MLS_A',
    address: '1 Test St',
    city: 'Springfield',
    state: 'VA',
    zip: '22150',
    price: 450000,
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1000,
    latitude: 38.7,
    longitude: -77.1,
    listedDate: '2026-09-01',
    status: 'active',
    description: 'A quiet home near transit. Pets allowed.',
    ...overrides,
  };
}

async function tempListingsFile(contents) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'listings-'));
  const filePath = path.join(dir, 'sample_listings.json');
  if (contents !== undefined) {
    await fs.writeFile(filePath, `${JSON.stringify(contents, null, 2)}\n`, 'utf8');
  } else {
    await fs.copyFile(SAMPLE_PATH, filePath);
  }
  return filePath;
}

function startTestServer(listingsFilePath) {
  process.env.NODE_ENV = 'test';
  const app = createApp({ listingsFilePath });
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((err) => (err ? closeReject(err) : closeResolve()));
          }),
      });
    });
  });
}

module.exports = {
  NOW,
  SAMPLE_PATH,
  listing,
  startTestServer,
  tempListingsFile,
};
