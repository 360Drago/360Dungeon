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
    const normalized = String(source || "").trim().toLowerCase();
    return (normalized === "manual" || normalized === "other" || normalized === "keyplanner" || normalized === "api")
      ? normalized
      : "api";
  }

  function normalizeApiSource(source) {
    return source === "other" ? "other" : "official";
  }

  function getEffectiveApiSource(model, opts = {}) {
    const activeApiSource = normalizeApiSource(opts?.activeApiSource);
    if (model === "other") return "other";
    if (model === "manual" || model === "keyplanner" || model === "api") return activeApiSource;
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
      keyImportPrices,
    } = opts || {};
    if (model === "keyplanner") {
      const imported = keyImportPrices && typeof keyImportPrices === "object"
        ? keyImportPrices
        : null;
      return {
        entryAsk: Number.isFinite(imported?.entryAsk) ? imported.entryAsk : -1,
        entryBid: Number.isFinite(imported?.entryBid) ? imported.entryBid : -1,
        chestKeyAsk: Number.isFinite(imported?.chestKeyAsk) ? imported.chestKeyAsk : -1,
        chestKeyBid: Number.isFinite(imported?.chestKeyBid) ? imported.chestKeyBid : -1,
      };
    }
    if (model === "api") {
      return getSavedKeyPricesAB(getSavedByApiSource(getEffectiveApiSource("api", opts), opts), dungeonKey);
    }
    if (model === "manual") {
      const base = getSavedKeyPricesAB(getSavedByApiSource(getEffectiveApiSource("manual", opts), opts), dungeonKey);
      return applyManualKeyOverrides(base, manualSaved);
    }
    if (model === "other") return getSavedKeyPricesAB(otherSaved, dungeonKey);
    return getSavedKeyPricesAB(officialSaved, dungeonKey);
  }

  function pricingModelLabel(model, opts = {}) {
    if (model === "api") {
      return normalizeApiSource(opts?.activeApiSource) === "other"
        ? t("ui.mooket", "Mooket")
        : t("ui.official", "Official");
    }
    if (model === "official") return t("ui.official", "Official");
    if (model === "keyplanner") {
      return normalizeApiSource(opts?.activeApiSource) === "other"
        ? t("ui.keysPlannerPlusMooket", "Keys Planner + Mooket")
        : t("ui.keysPlannerPlusOfficial", "Keys Planner + Official");
    }
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

