// js/pricing-refresh-shared.js
(() => {
  "use strict";
  // Ownership: shared helpers for API refresh snapshot validation/assembly.
  // Invariant: preserve existing key-price validity and snapshot field semantics.

  function getDungeonHrids(marketHridsByDungeon, dungeonKey) {
    if (!marketHridsByDungeon || typeof marketHridsByDungeon !== "object") return null;
    return marketHridsByDungeon[dungeonKey] || null;
  }

  function hasValidKeyPrices(entry, chestKey) {
    return Number.isFinite(entry) && Number.isFinite(chestKey);
  }

  function buildRefreshSnapshot(opts = {}) {
    const entryAB = opts.entryAB || {};
    const chestAB = opts.chestAB || {};
    return {
      entry: opts.entry,
      chestKey: opts.chestKey,
      entryAsk: entryAB.ask,
      entryBid: entryAB.bid,
      chestKeyAsk: chestAB.ask,
      chestKeyBid: chestAB.bid,
      fetchedAt: opts.now,
      usedProxy: opts.usedProxy,
      marketSlim: opts.marketSlim,
      ev: opts.ev,
    };
  }

  window.DungeonPricingRefreshShared = {
    getDungeonHrids,
    hasValidKeyPrices,
    buildRefreshSnapshot,
  };
})();

