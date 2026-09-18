const path = require('path');
const fs = require('fs/promises');

const DEFAULT_FILE_PATH = path.resolve(
  __dirname,
  '../../../data/sample_listings.json',
);

function listingKey(listing) {
  return `${listing.source}::${listing.id}`;
}

function createListingsRepository(filePath = DEFAULT_FILE_PATH) {
  async function getAll() {
    const raw = await fs.readFile(filePath, 'utf8');
    const listings = JSON.parse(raw);
    if (!Array.isArray(listings)) {
      throw new Error('Listings file must contain a JSON array');
    }
    return listings;
  }

  async function saveAll(listings) {
    if (!Array.isArray(listings)) {
      throw new Error('saveAll expects an array of listings');
    }
    const dir = path.dirname(filePath);
    const tempPath = path.join(
      dir,
      `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
    );
    const payload = `${JSON.stringify(listings, null, 2)}\n`;
    await fs.writeFile(tempPath, payload, 'utf8');
    try {
      await fs.rename(tempPath, filePath);
    } catch (err) {
      if (err.code !== 'EPERM' && err.code !== 'EEXIST' && err.code !== 'EACCES') {
        await fs.unlink(tempPath).catch(() => {});
        throw err;
      }
      await fs.unlink(filePath);
      await fs.rename(tempPath, filePath);
    }
  }

  return {
    filePath,
    listingKey,
    getAll,
    saveAll,
  };
}

module.exports = {
  DEFAULT_FILE_PATH,
  listingKey,
  createListingsRepository,
};
