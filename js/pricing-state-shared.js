// js/pricing-state-shared.js
(() => {
  "use strict";
  // Ownership: shared pricing-state helpers (saved snapshot access + key price derivation).
  // Invariant: preserve existing fallback semantics for ask/bid/legacy fields.

  function t(key, fallback) {
    const fn = window.SiteI18n?.t;
    if (typeof fn === "function") return fn(key, fallback);
    return fallback;
  }

  function getSavedRecordFromMap(savedMap, dungeonKey) {
    return (savedMap && typeof savedMap === "object") ? savedMap[dungeonKey] : null;
  }

  function normalizeModelFromSource(source) {
    return (source === "manual" || source === "other") ? source : "official";
  }

  function normalizeApiSource(source) {
    return source === "other" ? "other" : "official";
  }

  function getEffectiveApiSource(model, opts = {}) {
    const activeApiSource = normalizeApiSource(opts?.activeApiSource);
    if (model === "other") return "other";
    if (model === "manual") return activeApiSource;
    return "official";
  }

  function getSavedByApiSource(apiSource, maps = {}) {
    const officialSaved = maps?.officialSaved;
    const otherSaved = maps?.otherSaved;
    return apiSource === "other" ? otherSaved : officialSaved;
  }

  function getSavedRecordByModel(opts = {}) {
    const dungeonKey = opts?.dungeonKey;
    const model = opts?.model;
    const saved = getSavedByApiSource(getEffectiveApiSource(model, opts), opts);
    return getSavedRecordFromMap(saved, dungeonKey);
  }

  function pickFiniteOrFallback(obj, primaryKey, fallbackKey) {
    if (obj && Number.isFinite(obj[primaryKey])) return obj[primaryKey];
    if (obj && Number.isFinite(obj[fallbackKey])) return obj[fallbackKey];
    return null;
  }

  function getSavedKeyPricesAB(savedMap, dungeonKey) {
    const per = getSavedRecordFromMap(savedMap, dungeonKey);
    const entryAsk = pickFiniteOrFallback(per, "entryAsk", "entry");
    const entryBid = pickFiniteOrFallback(per, "entryBid", "entry");
    const chestAsk = pickFiniteOrFallback(per, "chestKeyAsk", "chestKey");
    const chestBid = pickFiniteOrFallback(per, "chestKeyBid", "chestKey");
    return { entryAsk, entryBid, chestKeyAsk: chestAsk, chestKeyBid: chestBid };
  }

  function applyManualKeyOverrides(basePrices, manualSaved) {
    const base = (basePrices && typeof basePrices === "object")
      ? basePrices
      : { entryAsk: null, entryBid: null, chestKeyAsk: null, chestKeyBid: null };
    const entry = (manualSaved && Number.isFinite(manualSaved.entry)) ? manualSaved.entry : null;
    const chest = (manualSaved && Number.isFinite(manualSaved.chest)) ? manualSaved.chest : null;
    return {
      entryAsk: Number.isFinite(entry) ? entry : base.entryAsk,
      entryBid: Number.isFinite(entry) ? entry : base.entryBid,
      chestKeyAsk: Number.isFinite(chest) ? chest : base.chestKeyAsk,
      chestKeyBid: Number.isFinite(chest) ? chest : base.chestKeyBid,
    };
  }

  function getPricesABForModel(opts = {}) {
    const {
      dungeonKey,
      model,
      officialSaved,
      otherSaved,
      manualSaved,
    } = opts || {};
    if (model === "manual") {
      const base = getSavedKeyPricesAB(getSavedByApiSource(getEffectiveApiSource("manual", opts), opts), dungeonKey);
      return applyManualKeyOverrides(base, manualSaved);
    }
    if (model === "other") return getSavedKeyPricesAB(otherSaved, dungeonKey);
    return getSavedKeyPricesAB(officialSaved, dungeonKey);
  }

  function pricingModelLabel(model, opts = {}) {
    if (model === "official") return t("ui.official", "Official");
    if (model === "manual") {
      return normalizeApiSource(opts?.activeApiSource) === "other"
        ? t("ui.manualPlusMooket", "Manual + Mooket")
        : t("ui.manualPlusOfficial", "Manual + Official");
    }
    return t("ui.mooket", "Mooket");
  }

  window.DungeonPricingStateShared = {
    getSavedRecordFromMap,
    normalizeModelFromSource,
    normalizeApiSource,
    getEffectiveApiSource,
    getSavedByApiSource,
    getSavedRecordByModel,
    pickFiniteOrFallback,
    getSavedKeyPricesAB,
    applyManualKeyOverrides,
    getPricesABForModel,
    pricingModelLabel,
  };
})();

