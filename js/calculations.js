/* js/calculations.js
   Pure math helpers for 360Dungeon.

   Goal:
   - One source of truth for all simulator math (runs/day, combat buff, loot counts, key costs, tax, profit range).
   - UI code (landing.js) should call these functions, not re-implement formulas.

   Global:
     window.DungeonCalculations
*/
(() => {
  "use strict";

  function toNum(x, fallback = NaN) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  function safe0(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : 0;
  }

  /** @param {number} clearMinutes */
  function computeRunsPerDay(clearMinutes) {
    const ct = toNum(clearMinutes, NaN);
    if (!Number.isFinite(ct) || ct <= 0) return 0;
    return Math.floor(1440 / ct);
  }

  /** Combat buff extra drop-rate for tier >= 1. */
  function combatBuffExtraRate(buffTier) {
    const t = toNum(buffTier, NaN);
    if (!Number.isFinite(t) || t <= 0) return 0;
    return 0.20 + ((t - 1) * 0.005);
  }

  /** Applies combat buff EV and rounds to whole items. */
  function applyCombatBuffToLootCount(baseCount, buffTier) {
    const base = toNum(baseCount, NaN);
    if (!Number.isFinite(base) || base <= 0) return 0;
    const extra = combatBuffExtraRate(buffTier);
    return Math.round(base * (1 + extra));
  }

  /** Base refined-chest drops per 24h at your runs/day, before buff. */
  function computeBaseRefinedCount(runsPerDay, tierKey) {
    const runs = Math.max(0, Math.floor(toNum(runsPerDay, 0)));
    const t = String(tierKey || "").toUpperCase();
    if (t === "T0") return 0;
    if (t === "T1") return Math.round(runs * 0.33);
    return runs;
  }


  /** Refined chest ratio per run (expected), before buff. */
  function computeRefinedPerRunRatio(tierKey) {
    const t = String(tierKey || "").toUpperCase();
    if (t === "T0") return 0;
    if (t === "T1") return 0.33;
    return 1;
  }

  /**
   * Compute the loot+key counts the UI stores in dungeon.lootCounts.
   * @returns {{runs:number, entry:number, chestKey:number, chest:number, refined:number, baseChest:number, baseRefined:number, extraRate:number}}
   */
  function computeLootCountsFor24h({ clearMinutes, buffTier, tierKey }) {
    const runs = computeRunsPerDay(clearMinutes);
    const extraRate = combatBuffExtraRate(buffTier);

    // Regular dungeon-chest drops are boosted by combat-buff extra drop rate.
    // Entry keys track *regular chests received* (not raw runs).
    const expectedChest = runs * (1 + extraRate);
    const chest = Math.round(expectedChest);

    const t = String(tierKey || "").toUpperCase();
    let refined = 0;
    if (t === "T1") refined = Math.round(chest * 0.33);
    else if (t !== "T0") refined = chest;

    const entry = chest;
    const chestKey = chest + refined;

    return {
      runs,
      entry,
      chestKey,
      chest,
      refined,
      baseChest: runs,
      baseRefined: (t === "T0") ? 0 : (t === "T1" ? (runs * 0.33) : runs),
      extraRate,
      expectedChest,
    };
  }

  /** Default tax rate as a decimal (e.g. 0.02). */
  function getDefaultTaxRate() {
    try {
      if (window.DungeonAPI && typeof window.DungeonAPI.getDefaultTaxPct === "function") {
        const pct = toNum(window.DungeonAPI.getDefaultTaxPct(), NaN);
        if (Number.isFinite(pct)) return pct / 100;
      }
    } catch (_) {}
    return 0.02;
  }

  /**
   * Key costs: pessimistic uses ask prices, optimistic uses bid prices.
   * @returns {{keyCostLow:number, keyCostHigh:number}}
   */
  function computeKeyCostRange({ entryKeys, chestKeys, entryAsk, entryBid, chestKeyAsk, chestKeyBid }) {
    const eKeys = toNum(entryKeys, NaN);
    const cKeys = toNum(chestKeys, NaN);

    const keyCostLow =
      (Number.isFinite(entryAsk) ? entryAsk : NaN) * eKeys +
      (Number.isFinite(chestKeyAsk) ? chestKeyAsk : NaN) * cKeys;

    const keyCostHigh =
      (Number.isFinite(entryBid) ? entryBid : NaN) * eKeys +
      (Number.isFinite(chestKeyBid) ? chestKeyBid : NaN) * cKeys;

    return { keyCostLow, keyCostHigh };
  }

  /**
   * Loot value: pessimistic uses bid EV, optimistic uses ask EV.
   * @returns {{lootLow:number, lootHigh:number}}
   */
  function computeLootValueRange({ chestCount, refinedCount, chestEvBid, chestEvAsk, refinedEvBid, refinedEvAsk }) {
    const c = toNum(chestCount, NaN);
    const r = toNum(refinedCount, NaN);

    const lootLow =
      (Number.isFinite(chestEvBid) ? chestEvBid : NaN) * c +
      (Number.isFinite(refinedEvBid) ? refinedEvBid : NaN) * r;

    const lootHigh =
      (Number.isFinite(chestEvAsk) ? chestEvAsk : NaN) * c +
      (Number.isFinite(refinedEvAsk) ? refinedEvAsk : NaN) * r;

    return { lootLow, lootHigh };
  }

  /**
   * Profit: tax reduces loot only (keys are costs).
   * @returns {{profitLow:number, profitHigh:number}}
   */
  function computeProfitRangeAfterTax({ lootLow, lootHigh, keyCostLow, keyCostHigh, taxRate }) {
    const t = Number.isFinite(taxRate) ? taxRate : getDefaultTaxRate();
    const profitLow = (lootLow * (1 - t)) - keyCostLow;
    const profitHigh = (lootHigh * (1 - t)) - keyCostHigh;
    return { profitLow, profitHigh };
  }

  

  /**
   * Chest-centered profit model (per-chest EV after keys), then subtract food/day.
   *
   * Regular chest after-keys EV:
   *   (chestEV_afterTax - chestKeyPrice - entryKeyPrice)
   *
   * Refined chest after-keys EV:
   *   (refinedEV_afterTax - chestKeyPrice)
   *
   * Profit/day:
   *   regularAfterKeysEV * chestCount + refinedAfterKeysEV * refinedCount - foodPerDay
   *
   * Pessimistic (Low): loot @ bid, keys @ ask
   * Optimistic  (High): loot @ ask, keys @ bid
   */
  function computeChestCenteredProfitRangeAfterTaxAndFood({
    chestCount,
    refinedCount,
    chestEvBid,
    chestEvAsk,
    refinedEvBid,
    refinedEvAsk,
    entryAsk,
    entryBid,
    chestKeyAsk,
    chestKeyBid,
    taxRate,
    foodPerDay = 0,
  }) {
    const t = Number.isFinite(taxRate) ? taxRate : getDefaultTaxRate();
    const tax = Math.max(0, Math.min(1, t));

    const cc = safe0(chestCount);
    const rc = safe0(refinedCount);
    const food = safe0(foodPerDay);

    const chestNetLow = safe0(chestEvBid) * (1 - tax);
    const refinedNetLow = safe0(refinedEvBid) * (1 - tax);
    const chestNetHigh = safe0(chestEvAsk) * (1 - tax);
    const refinedNetHigh = safe0(refinedEvAsk) * (1 - tax);

    const eAsk = safe0(entryAsk);
    const eBid = safe0(entryBid);
    const kAsk = safe0(chestKeyAsk);
    const kBid = safe0(chestKeyBid);

    const regAfterLow = chestNetLow - kAsk - eAsk;
    const refAfterLow = refinedNetLow - kAsk;

    const regAfterHigh = chestNetHigh - kBid - eBid;
    const refAfterHigh = refinedNetHigh - kBid;

    const profitLow = (regAfterLow * cc) + (refAfterLow * rc) - food;
    const profitHigh = (regAfterHigh * cc) + (refAfterHigh * rc) - food;

    return {
      profitLow,
      profitHigh,
      regAfterLow,
      refAfterLow,
      regAfterHigh,
      refAfterHigh,
    };
  }

  /**
   * Chest-centered single-point profit model (per-chest EV after keys),
   * then subtract food/day.
   *
   * This is used for the non-range "standard" display.
   */
  function computeChestCenteredProfitPointAfterTaxAndFood({
    chestCount,
    refinedCount,
    chestEv,
    refinedEv,
    entryPrice,
    chestKeyPrice,
    taxRate,
    foodPerDay = 0,
  }) {
    const t = Number.isFinite(taxRate) ? taxRate : getDefaultTaxRate();
    const tax = Math.max(0, Math.min(1, t));

    const cc = safe0(chestCount);
    const rc = safe0(refinedCount);
    const food = safe0(foodPerDay);

    const chestNet = safe0(chestEv) * (1 - tax);
    const refinedNet = safe0(refinedEv) * (1 - tax);
    const e = safe0(entryPrice);
    const k = safe0(chestKeyPrice);

    const regAfter = chestNet - k - e;
    const refAfter = refinedNet - k;
    const profit = (regAfter * cc) + (refAfter * rc) - food;

    return { profit, regAfter, refAfter };
  }

  /**
   * Helper for the profit tooltip (average of bid/ask),
   * using chest-centered "after keys" profit and subtracting food/day.
   */
  function computeAveragesForTooltip({
    chestCount,
    refinedCount,
    entryKeys,
    chestKeys,
    evBid,
    evAsk,
    prices,
    taxRate,
    foodPerDay = 0,
  }) {
    const chestEvBid = safe0(evBid?.chestEv);
    const chestEvAsk = safe0(evAsk?.chestEv);
    const refinedEvBid = safe0(evBid?.refinedChestEv);
    const refinedEvAsk = safe0(evAsk?.refinedChestEv);

    const entryAsk = safe0(prices?.entryAsk);
    const entryBid = safe0(prices?.entryBid);
    const chestKeyAsk = safe0(prices?.chestKeyAsk);
    const chestKeyBid = safe0(prices?.chestKeyBid);

    const C_gross_avg = (chestEvBid + chestEvAsk) / 2;
    const R_gross_avg = (refinedEvBid + refinedEvAsk) / 2;
    const E_avg = (entryAsk + entryBid) / 2;
    const K_avg = (chestKeyAsk + chestKeyBid) / 2;

    const t = Number.isFinite(taxRate) ? taxRate : getDefaultTaxRate();
    const tax = Math.max(0, Math.min(1, t));

    const C_net_avg = C_gross_avg * (1 - tax);
    const R_net_avg = R_gross_avg * (1 - tax);

    const cc = safe0(chestCount);
    const rc = safe0(refinedCount);
    const ek = safe0(entryKeys);
    const ck = safe0(chestKeys);
    const food = safe0(foodPerDay);

    const lootChestNet = C_net_avg * cc;
    const lootRefNet = R_net_avg * rc;
    const lootNetTot = lootChestNet + lootRefNet;

    const keysEntry = E_avg * ek;
    const keysChest = K_avg * ck;
    const keysTot = keysEntry + keysChest;

    const regAfterKeys = C_net_avg - E_avg - K_avg;
    const refAfterKeys = R_net_avg - K_avg;

    const profitBeforeFood = (regAfterKeys * cc) + (refAfterKeys * rc);
    const profitAvg = profitBeforeFood - food;

    return {
      C_gross_avg,
      R_gross_avg,
      C_net_avg,
      R_net_avg,
      E_avg,
      K_avg,
      lootChestNet,
      lootRefNet,
      lootNetTot,
      keysEntry,
      keysChest,
      keysTot,
      regAfterKeys,
      refAfterKeys,
      food,
      profitBeforeFood,
      profitAvg,
    };
  }

  window.DungeonCalculations = {
    computeRunsPerDay,
    combatBuffExtraRate,
    applyCombatBuffToLootCount,
    computeBaseRefinedCount,
    computeRefinedPerRunRatio,
    computeLootCountsFor24h,
    getDefaultTaxRate,
    computeKeyCostRange,
    computeLootValueRange,
    computeProfitRangeAfterTax,
    computeChestCenteredProfitRangeAfterTaxAndFood,
    computeChestCenteredProfitPointAfterTaxAndFood,
    computeAveragesForTooltip,
  };
})();

