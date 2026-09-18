const BUDGET_WEIGHT = 0.7;
const RECENCY_WEIGHT = 0.3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function daysSinceListed(listedDate, now) {
  const listed = new Date(`${listedDate}T00:00:00.000Z`);
  if (Number.isNaN(listed.getTime())) {
    return 0;
  }
  const diff = (now.getTime() - listed.getTime()) / MS_PER_DAY;
  return Math.max(0, diff);
}

function budgetFit(price, targetBudget) {
  if (targetBudget === 0) {
    return price === 0 ? 1 : 0;
  }
  return 1 - Math.min(Math.abs(price - targetBudget) / targetBudget, 1);
}

function recencyFits(listings, now) {
  const ages = listings.map((listing) => daysSinceListed(listing.listedDate, now));
  const maxDays = ages.length === 0 ? 0 : Math.max(...ages);
  return ages.map((age) => (maxDays === 0 ? 1 : 1 - age / maxDays));
}

function scoreListings(listings, targetBudget, now = new Date()) {
  const recency = recencyFits(listings, now);
  return listings.map((listing, index) => {
    const fit = budgetFit(listing.price, targetBudget);
    const score = round4(BUDGET_WEIGHT * fit + RECENCY_WEIGHT * recency[index]);
    return { ...listing, score };
  });
}

function sortByScore(listings) {
  return [...listings].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.listedDate !== b.listedDate) {
      return b.listedDate.localeCompare(a.listedDate);
    }
    const keyA = `${a.source}+${a.id}`;
    const keyB = `${b.source}+${b.id}`;
    return keyA.localeCompare(keyB);
  });
}

module.exports = {
  BUDGET_WEIGHT,
  RECENCY_WEIGHT,
  budgetFit,
  daysSinceListed,
  recencyFits,
  round4,
  scoreListings,
  sortByScore,
};
