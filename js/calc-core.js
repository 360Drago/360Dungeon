// js/calc-core.js
(() => {
  "use strict";
  // Ownership/invariant:
  // - Computes economics from EV + pricing bridge data.
  // - Keep formulas and output field semantics stable; helper extraction here is structure-only.
  let lastTrace = null;
  let lastError = null;

  function safeNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }

  function requireCoreModules() {
    if (!window.DungeonChestEV?.computeDungeonChestEV) throw new Error("EV module not loaded");
    if (!window.DungeonAPI) throw new Error("DungeonAPI bridge missing");
  }

  function fallbackBuffExtraRate(buffTier) {
    return buffTier > 0 ? 0.20 + ((buffTier - 1) * 0.005) : 0;
  }

  function resolveBuffExtraRate(buffTier) {
    if (window.DungeonCalculations?.combatBuffExtraRate) {
      return window.DungeonCalculations.combatBuffExtraRate(buffTier);
    }
    if (window.DungeonAPI?.combatBuffExtraRate) {
      return window.DungeonAPI.combatBuffExtraRate(buffTier);
    }
    return fallbackBuffExtraRate(buffTier);
  }

  function fallbackRefinedPerRunRatio(tier) {
    return tier === "T0" ? 0 : (tier === "T1" ? 0.33 : 1);
  }

  function resolveRefinedPerRunRatio(tier) {
    if (window.DungeonCalculations?.computeRefinedPerRunRatio) {
      return window.DungeonCalculations.computeRefinedPerRunRatio(tier);
    }
    return fallbackRefinedPerRunRatio(tier);
  }

  function pctToRate(pct) {
    return Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) / 100 : 0;
  }

  async function computeEconomics(opts = {}) {
    lastError = null;
    const {
      dungeonKey,
      pricing,
      side = "bid",
      runsPerDay,
      buffTier = 0,
      taxPct = null,
      overrideLootMap = null,
    } = opts;

    lastTrace = { step: [], inputs: { dungeonKey, pricing, side, runsPerDay, buffTier, taxPct } };

    try {
      requireCoreModules();

      const pricesAB = window.DungeonAPI.getKeyPricesAB(dungeonKey, pricing);
      const marketSlim = window.DungeonAPI.getMarketSlim(dungeonKey, pricing);
      const priceOverrides = overrideLootMap || window.DungeonAPI.getActiveLootOverrides?.() || null;
      const ev = await window.DungeonChestEV.computeDungeonChestEV({
        dungeonKey,
        marketData: marketSlim,
        side,
        priceOverrides,
      });

      if (!ev || typeof ev.chestEv !== "number") {
        const err = new Error("Missing chest EV from init data");
        err.code = "EV_INIT_MISSING";
        throw err;
      }

      const rpDay = safeNum(runsPerDay);
      const buffExtra = resolveBuffExtraRate(buffTier);
      const tier = window.DungeonAPI.getSelectedTier?.() || "T1";
      const refinedPerRun = resolveRefinedPerRunRatio(tier);

      const chestsPerRun = 1 + buffExtra;
      const refinedPerRunBuffed = refinedPerRun * (1 + buffExtra);

      const chestEv = safeNum(ev?.chestEv);
      const refinedEv = safeNum(ev?.refinedChestEv);
      const revPerRun = (chestEv * chestsPerRun) + (refinedEv * refinedPerRunBuffed);

      const taxPctEff = (taxPct != null) ? safeNum(taxPct) : (window.DungeonAPI.getDefaultTaxPct?.() ?? 0);
      const taxRate = pctToRate(taxPctEff);
      const revAfterTaxPerRun = revPerRun * (1 - taxRate);

      const entryAsk = safeNum(pricesAB.entryAsk);
      const entryBid = safeNum(pricesAB.entryBid);
      const chestAsk = safeNum(pricesAB.chestKeyAsk);
      const chestBid = safeNum(pricesAB.chestKeyBid);
      const foodPerRun = window.DungeonAPI.getFoodPerRun?.() ?? 0;

      // Entry keys track regular chests received (combat-buff can increase > 1 chest/run on average).
      const entryKeysPerRun = chestsPerRun;
      const chestKeysPerRun = chestsPerRun + refinedPerRunBuffed;

      const costWorst = (entryAsk * entryKeysPerRun) + (chestAsk * chestKeysPerRun) + foodPerRun;
      const costBest = (entryBid * entryKeysPerRun) + (chestBid * chestKeysPerRun) + foodPerRun;

      const profitRunLow = revAfterTaxPerRun - costWorst;
      const profitRunHigh = revAfterTaxPerRun - costBest;

      const clearMin = Math.max(1, window.DungeonAPI.getClearMinutes?.() || 60);
      const runsPerHour = 60 / clearMin;

      const profitHourLow = profitRunLow * runsPerHour;
      const profitHourHigh = profitRunHigh * runsPerHour;
      const profitDayLow = profitRunLow * Math.max(0, rpDay);
      const profitDayHigh = profitRunHigh * Math.max(0, rpDay);

      lastTrace.step.push(
        { label: "pricesAB", pricesAB },
        { label: "marketSlimKeys", keys: Object.keys(marketSlim || {}) },
        { label: "ev", ev },
        { label: "runsPerDay", rpDay },
        { label: "buffExtraRate", buffExtra },
        { label: "unitCountsPerRun", chestsPerRun, refinedPerRun: refinedPerRunBuffed },
        { label: "revPerRun", revPerRun, taxRate, revAfterTaxPerRun },
        { label: "costs", entryAsk, entryBid, chestAsk, chestBid, foodPerRun, costWorst, costBest },
        { label: "profit", profitRunLow, profitRunHigh, profitHourLow, profitHourHigh, profitDayLow, profitDayHigh },
      );

      return {
        chestEv,
        refinedEv,
        chestsPerRun,
        refinedPerRun: refinedPerRunBuffed,
        revAfterTaxPerRun,
        costWorst,
        costBest,
        profitRunLow,
        profitRunHigh,
        profitHourLow,
        profitHourHigh,
        profitDayLow,
        profitDayHigh,
        trace: lastTrace,
      };
    } catch (e) {
      lastError = { message: e?.message || String(e), code: e?.code || null, inputs: lastTrace?.inputs || {} };
      // Broadcast for UI
      try { document.dispatchEvent(new CustomEvent("dungeon:error", { detail: lastError })); } catch (_) { }
      throw e;
    }
  }

  window.DungeonCalc = {
    computeEconomics,
    get lastTrace() { return lastTrace; },
    get lastError() { return lastError; },
  };
})();

