// js/keys-inline.js
(() => {
  "use strict";
  // Ownership: inline Keys panel rendering, refresh flow, and per-card profitability rows.
  // Invariant: preserve displayed labels/formatting and existing ask/bid profitability paths.

  const STYLE_ID = "keysInlineStyleV3";
  const AGE_TIMER_KEY = "__keysInlineAgeTimer";
  const KEYS_REFRESH_TS_KEYS = Object.freeze({
    official: "dungeon.keys.lastRefreshTs.official",
    other: "dungeon.keys.lastRefreshTs.other",
  });
  const MARKET_URLS = Object.freeze({
    official: "https://www.milkywayidle.com/game_data/marketplace.json",
    other: "https://mooket.qi-e.top/market/api.json",
  });
  const ARTISAN_BASE_REDUCTION = 0.1;
  const ARTISAN_TEA_HRID = "/items/artisan_tea";
  const COIN_HRID = "/items/coin";
  const CALC_TARGET_KEY = "dungeon.keys.targetChestCount.v1";
  const CALC_TARGET_MAP_KEY = "dungeon.keys.targetCountsByRecipe.v1";
  const CALC_KEY_TYPE_KEY = "dungeon.keys.selectedType.v1";
  const CALC_BUY_MODE_KEY = "dungeon.keys.fragmentBuyMode.v1";
  const CALC_ARTISAN_KEY = "dungeon.keys.artisanEnabled.v1";
  const CALC_GUZZLING_POUCH_KEY = "dungeon.keys.guzzlingPouchEnabled.v1";
  const CALC_GUZZLING_LEVEL_KEY = "dungeon.keys.guzzlingPouchLevel.v1";
  const GUZZLING_POUCH_ICON_PATH = "assets/Svg/Guzzling_pouch.svg";
  const CALC_EXPANDED_KEY = "dungeon.keys.plannerExpanded.v1";
  const CALC_OVERRIDE_KEY = "dungeon.keys.fragmentOverrides.v1";
  const CALC_IMPORT_KEY = "dungeon.keys.importPayload.v1";
  const CALC_BANK_MAP_KEY = "dungeon.keys.bankByRecipe.v1";
  const BUY_MODE_INSTANT = "instant";
  const BUY_MODE_ORDER = "order";
  const KEY_TYPE_CHEST = "chest";
  const KEY_TYPE_ENTRY = "entry";
  const DEFAULT_TARGET_RAW = "100";
  const GUZZLING_POUCH_LEVEL_MAX = 20;
  const GUZZLING_POUCH_CONCENTRATION = Object.freeze([
    0.10,
    0.102,
    0.1042,
    0.1066,
    0.1092,
    0.112,
    0.115,
    0.1182,
    0.1216,
    0.1252,
    0.129,
    0.1334,
    0.1384,
    0.144,
    0.1502,
    0.157,
    0.1644,
    0.1724,
    0.181,
    0.1902,
    0.20,
  ]);
  let marketCacheBySource = { official: null, other: null };
  let marketCacheTsBySource = { official: 0, other: 0 };
  let marketFetchInFlightBySource = { official: null, other: null };
  let recipeCache = null;
  let calcState = null;

  function getShared(name) {
    return window[name] || null;
  }

  function getMarketShared() {
    return getShared("DungeonMarketShared");
  }

  function getTimeShared() {
    return getShared("DungeonTimeShared");
  }

  function getItemHridShared() {
    return getShared("DungeonItemHridShared");
  }

  function getInitDataShared() {
    return getShared("DungeonInitDataShared");
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function storageCall(methodName, ...args) {
    const method = getStorageShared()?.[methodName];
    if (typeof method === "function") return method(...args);
    return localStorage[methodName](...args);
  }

  function getUiStateShared() {
    return getShared("DungeonUiStateShared");
  }

  function getPricingStateShared() {
    return getShared("DungeonPricingStateShared");
  }

  function getKeyPricingImportShared() {
    return getShared("DungeonKeyPricingImportShared");
  }

  function getNumberShared() {
    return getShared("DungeonNumberShared");
  }

  function getTextShared() {
    return getShared("DungeonTextShared");
  }

  function t(key, fallback) {
    const translate = getTextShared()?.t;
    if (typeof translate === "function") return translate(key, fallback);
    return fallback;
  }

  function escHtml(value) {
    const escapeHtml = getTextShared()?.escapeHtml;
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value == null ? "" : value);
  }

  function escAttr(value) {
    const escapeAttr = getTextShared()?.escapeAttr;
    if (typeof escapeAttr === "function") return escapeAttr(value);
    return escHtml(value);
  }

  function tf(key, fallback, vars = {}) {
    const translateFormat = getTextShared()?.tf;
    if (typeof translateFormat === "function") return translateFormat(key, fallback, vars);
    return String(fallback || "");
  }

  function storageGetItem(key) {
    return storageCall("getItem", key);
  }

  function storageSetItem(key, value) {
    storageCall("setItem", key, value);
  }

  function storageRemoveItem(key) {
    storageCall("removeItem", key);
  }

  function normalizeApiSource(raw) {
    const normalize = getPricingStateShared()?.normalizeApiSource;
    if (typeof normalize === "function") return normalize(raw);
    return raw === "other" ? "other" : "official";
  }

  function getActiveApiSource() {
    return normalizeApiSource(window.DungeonAPI?.getActiveApiSource?.() || "official");
  }

  function apiSourceLabel(source = getActiveApiSource()) {
    return normalizeApiSource(source) === "other"
      ? t("ui.mooket", "Mooket")
      : t("ui.official", "Official");
  }

  function keysRefreshStorageKey(source = getActiveApiSource()) {
    return KEYS_REFRESH_TS_KEYS[normalizeApiSource(source)] || KEYS_REFRESH_TS_KEYS.official;
  }

  function marketUrlForSource(source = getActiveApiSource()) {
    return MARKET_URLS[normalizeApiSource(source)] || MARKET_URLS.official;
  }

  function getCachedMarketData(source = getActiveApiSource()) {
    return marketCacheBySource[normalizeApiSource(source)] || null;
  }

  function normalizeBuyMode(raw) {
    return String(raw || "").trim().toLowerCase() === BUY_MODE_ORDER ? BUY_MODE_ORDER : BUY_MODE_INSTANT;
  }

  function normalizeKeyType(raw) {
    return String(raw || "").trim().toLowerCase() === KEY_TYPE_ENTRY ? KEY_TYPE_ENTRY : KEY_TYPE_CHEST;
  }

  function normalizeArtisanEnabled(raw) {
    if (raw === false) return false;
    const text = String(raw == null ? "" : raw).trim().toLowerCase();
    return !(text === "0" || text === "false" || text === "off");
  }

  function normalizeGuzzlingPouchEnabled(raw) {
    if (raw === true) return true;
    if (raw === false) return false;
    const text = String(raw == null ? "" : raw).trim().toLowerCase();
    return text === "1" || text === "true" || text === "on";
  }

  function normalizeGuzzlingPouchLevel(raw) {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(GUZZLING_POUCH_LEVEL_MAX, n));
  }

  function getGuzzlingPouchConcentration(levelRaw) {
    const level = normalizeGuzzlingPouchLevel(levelRaw);
    return GUZZLING_POUCH_CONCENTRATION[level] ?? GUZZLING_POUCH_CONCENTRATION[0];
  }

  function formatGuzzlingPouchDisplayValue(levelRaw, enabledRaw) {
    if (!normalizeGuzzlingPouchEnabled(enabledRaw)) return "-";
    return `+${normalizeGuzzlingPouchLevel(levelRaw)}`;
  }

  function roundToTenths(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 10) / 10;
  }

  // Artisan Tea's 10% material reduction scales by (1 + drink concentration).
  function artisanTeaMaterialMultiplier(options = {}) {
    if (!normalizeArtisanEnabled(options.artisanEnabled)) return 1;
    let reduction = ARTISAN_BASE_REDUCTION;
    if (normalizeGuzzlingPouchEnabled(options.guzzlingPouchEnabled)) {
      reduction *= 1 + getGuzzlingPouchConcentration(options.guzzlingPouchLevel);
    }
    return Math.max(0, 1 - reduction);
  }

  function parsePositiveInteger(raw) {
    const n = Math.floor(Number(raw));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function parseNonNegativeInteger(raw) {
    const n = Math.floor(Number(raw));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  function isRecordObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeTargetMap(raw) {
    if (!isRecordObject(raw)) return {};
    const out = {};
    Object.entries(raw).forEach(([key, value]) => {
      const uiKey = String(key || "").trim();
      const parsed = parsePositiveInteger(value);
      if (!uiKey || !parsed) return;
      out[uiKey] = String(parsed);
    });
    return out;
  }

  function normalizeRawStringMap(raw) {
    if (!isRecordObject(raw)) return {};
    const out = {};
    Object.entries(raw).forEach(([key, value]) => {
      const mapKey = String(key || "").trim();
      const rawValue = String(value == null ? "" : value).trim();
      if (!mapKey || !rawValue) return;
      out[mapKey] = rawValue;
    });
    return out;
  }

  function normalizePlannerImport(raw) {
    if (!isRecordObject(raw)) return null;
    const uiKey = String(raw.uiKey || "").trim();
    if (!uiKey) return null;
    const tierRaw = String(raw.tier || "").trim().toUpperCase();
    const entryCount = parseNonNegativeInteger(raw.entryCount);
    const chestCount = parseNonNegativeInteger(raw.chestCount);
    const selectedType = String(raw.selectedType || "chest").trim().toLowerCase() === "entry" ? "entry" : "chest";
    const defaultTarget = selectedType === "entry" ? parsePositiveInteger(entryCount) : parsePositiveInteger(chestCount);
    return {
      source: String(raw.source || "zone_compare").trim() || "zone_compare",
      uiKey,
      tier: /^T[0-2]$/.test(tierRaw) ? tierRaw : "",
      entryCount: entryCount == null ? 0 : entryCount,
      chestCount: chestCount == null ? 0 : chestCount,
      selectedType,
      targetCount: parsePositiveInteger(raw.targetCount) || defaultTarget || null,
      savedAt: Number.isFinite(Number(raw.savedAt)) ? Number(raw.savedAt) : Date.now(),
    };
  }

  function hasUsableMarketplacePayload(json) {
    return isRecordObject(json?.marketData);
  }

  function loadCalcState() {
    const targetRaw = String(storageGetItem(CALC_TARGET_KEY) || DEFAULT_TARGET_RAW).trim();
    const selectedType = normalizeKeyType(storageGetItem(CALC_KEY_TYPE_KEY));
    let overridesMap = {};
    let plannerImport = null;
    let targetRawMap = {};
    let bankRawMap = {};
    try {
      const parsed = JSON.parse(String(storageGetItem(CALC_OVERRIDE_KEY) || "{}"));
      if (parsed && typeof parsed === "object") overridesMap = parsed;
    } catch (_) { }
    try {
      plannerImport = normalizePlannerImport(JSON.parse(String(storageGetItem(CALC_IMPORT_KEY) || "null")));
    } catch (_) { }
    try {
      targetRawMap = normalizeTargetMap(JSON.parse(String(storageGetItem(CALC_TARGET_MAP_KEY) || "{}")));
    } catch (_) { }
    try {
      bankRawMap = normalizeRawStringMap(JSON.parse(String(storageGetItem(CALC_BANK_MAP_KEY) || "{}")));
    } catch (_) { }
    const legacyTarget = parsePositiveInteger(targetRaw);
    const selectedDungeonKey = getSelectedDungeonKey();
    const selectedTargetKey = recipeTargetMapKey(selectedDungeonKey, selectedType);
    if (selectedTargetKey && legacyTarget && !targetRawMap[selectedTargetKey] && String(legacyTarget) !== DEFAULT_TARGET_RAW) {
      targetRawMap[selectedTargetKey] = String(legacyTarget);
    }
    return {
      targetRaw: legacyTarget ? String(legacyTarget) : DEFAULT_TARGET_RAW,
      targetRawMap,
      selectedType,
      buyMode: normalizeBuyMode(storageGetItem(CALC_BUY_MODE_KEY)),
      artisanEnabled: normalizeArtisanEnabled(storageGetItem(CALC_ARTISAN_KEY)),
      guzzlingPouchEnabled: normalizeGuzzlingPouchEnabled(storageGetItem(CALC_GUZZLING_POUCH_KEY)),
      guzzlingPouchLevel: normalizeGuzzlingPouchLevel(storageGetItem(CALC_GUZZLING_LEVEL_KEY)),
      expanded: String(storageGetItem(CALC_EXPANDED_KEY) || "0") !== "0",
      overridesMap,
      plannerImport,
      bankRawMap,
    };
  }

  function persistCalcState() {
    if (!calcState) return;
    try {
      storageSetItem(CALC_TARGET_KEY, String(calcState.targetRaw || ""));
      storageSetItem(CALC_TARGET_MAP_KEY, JSON.stringify(calcState.targetRawMap || {}));
      storageSetItem(CALC_KEY_TYPE_KEY, normalizeKeyType(calcState.selectedType));
      storageSetItem(CALC_BUY_MODE_KEY, normalizeBuyMode(calcState.buyMode));
      storageSetItem(CALC_ARTISAN_KEY, calcState.artisanEnabled ? "1" : "0");
      storageSetItem(CALC_GUZZLING_POUCH_KEY, calcState.guzzlingPouchEnabled ? "1" : "0");
      storageSetItem(CALC_GUZZLING_LEVEL_KEY, String(calcState.guzzlingPouchLevel));
      storageSetItem(CALC_EXPANDED_KEY, calcState.expanded ? "1" : "0");
      storageSetItem(CALC_OVERRIDE_KEY, JSON.stringify(calcState.overridesMap || {}));
      storageSetItem(CALC_BANK_MAP_KEY, JSON.stringify(calcState.bankRawMap || {}));
      if (calcState.plannerImport) storageSetItem(CALC_IMPORT_KEY, JSON.stringify(calcState.plannerImport));
      else storageRemoveItem(CALC_IMPORT_KEY);
    } catch (_) { }
  }

  function ensureCalcState() {
    if (!calcState) calcState = loadCalcState();
    return calcState;
  }

  function setCalcState(patch) {
    calcState = {
      ...ensureCalcState(),
      ...(patch || {}),
    };
    calcState.selectedType = normalizeKeyType(calcState.selectedType);
    calcState.buyMode = normalizeBuyMode(calcState.buyMode);
    calcState.artisanEnabled = normalizeArtisanEnabled(calcState.artisanEnabled);
    calcState.guzzlingPouchEnabled = normalizeGuzzlingPouchEnabled(calcState.guzzlingPouchEnabled);
    calcState.guzzlingPouchLevel = normalizeGuzzlingPouchLevel(calcState.guzzlingPouchLevel);
    calcState.expanded = calcState.expanded !== false;
    calcState.targetRaw = String(calcState.targetRaw == null ? "" : calcState.targetRaw);
    calcState.targetRawMap = normalizeTargetMap(calcState.targetRawMap);
    calcState.bankRawMap = normalizeRawStringMap(calcState.bankRawMap);
    if (!calcState.overridesMap || typeof calcState.overridesMap !== "object") calcState.overridesMap = {};
    calcState.plannerImport = normalizePlannerImport(calcState.plannerImport);
    persistCalcState();
    emitKeyImportChanged({ reason: "calc-state" });
    return calcState;
  }

  function emitKeyImportChanged(detail = {}) {
    const shared = getKeyPricingImportShared();
    if (typeof shared?.clearCache === "function") shared.clearCache();
    if (typeof shared?.emitChanged === "function") {
      shared.emitChanged(detail);
      return;
    }
    try {
      document.dispatchEvent(new CustomEvent("keys:import-pricing-changed", {
        detail: { ...(detail || {}) },
      }));
    } catch (_) { }
  }

  function recipeTargetMapKey(recipeOrUiKey, keyTypeRaw = null) {
    const uiKey = typeof recipeOrUiKey === "string"
      ? String(recipeOrUiKey || "").trim()
      : String(recipeOrUiKey?.uiKey || "").trim();
    const keyType = normalizeKeyType(keyTypeRaw == null ? recipeOrUiKey?.keyType : keyTypeRaw);
    return uiKey ? `${keyType}:${uiKey}` : "";
  }

  function importedTargetRawForRecipe(recipeOrUiKey, keyTypeRaw = null, state = ensureCalcState()) {
    const uiKey = typeof recipeOrUiKey === "string"
      ? String(recipeOrUiKey || "").trim()
      : String(recipeOrUiKey?.uiKey || "").trim();
    const keyType = normalizeKeyType(keyTypeRaw == null ? recipeOrUiKey?.keyType : keyTypeRaw);
    const payload = normalizePlannerImport(state?.plannerImport);
    if (!uiKey || !payload || payload.uiKey !== uiKey) return null;
    const count = keyType === KEY_TYPE_ENTRY ? parsePositiveInteger(payload.entryCount) : parsePositiveInteger(payload.chestCount);
    return count ? String(count) : null;
  }

  function getRecipeTargetRaw(recipeOrUiKey, keyTypeRaw = null, state = ensureCalcState()) {
    const targetKey = recipeTargetMapKey(recipeOrUiKey, keyTypeRaw);
    const mapped = targetKey ? String(state?.targetRawMap?.[targetKey] || "").trim() : "";
    if (mapped) return mapped;
    const imported = importedTargetRawForRecipe(recipeOrUiKey, keyTypeRaw, state);
    if (imported) return imported;
    return DEFAULT_TARGET_RAW;
  }

  function setRecipeTargetRaw(recipeOrUiKey, rawValue, keyTypeRaw = null) {
    const state = ensureCalcState();
    const targetKey = recipeTargetMapKey(recipeOrUiKey, keyTypeRaw);
    const parsed = parsePositiveInteger(rawValue);
    const nextRaw = parsed ? String(parsed) : DEFAULT_TARGET_RAW;
    const nextMap = { ...(state.targetRawMap || {}) };
    if (targetKey) {
      nextMap[targetKey] = nextRaw;
    }
    setCalcState({
      targetRaw: nextRaw,
      targetRawMap: nextMap,
    });
    return nextRaw;
  }

  function getRecipeBankRaw(recipeOrUiKey, keyTypeRaw = null, state = ensureCalcState()) {
    const targetKey = recipeTargetMapKey(recipeOrUiKey, keyTypeRaw);
    return targetKey ? String(state?.bankRawMap?.[targetKey] || "").trim() : "";
  }

  function setRecipeBankRaw(recipeOrUiKey, rawValue, keyTypeRaw = null) {
    const state = ensureCalcState();
    const targetKey = recipeTargetMapKey(recipeOrUiKey, keyTypeRaw);
    const nextMap = { ...(state.bankRawMap || {}) };
    const nextRaw = String(rawValue == null ? "" : rawValue).trim();
    if (targetKey) {
      if (nextRaw) nextMap[targetKey] = nextRaw;
      else delete nextMap[targetKey];
    }
    setCalcState({ bankRawMap: nextMap });
    return nextRaw;
  }

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #keysInline {
        width: 100% !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
      }
      body.keys-active .cardStage,
      body.keys-active #selectionBar {
        display: none !important;
      }
      #keysInline .keysShell {
        max-width: 1100px;
        margin: 0 auto;
      }
      #keysInline .keysGrid {
        display: flex;
        gap: 12px;
        align-items: stretch;
        flex-wrap: nowrap;
      }
      #keysInline .keysZoneCard {
        flex: 1 1 0;
        min-width: 0;
        overflow: hidden;
        width: auto;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.18);
        color: inherit;
        text-align: left;
        cursor: pointer;
        appearance: none;
        transition:
          flex-grow 280ms cubic-bezier(.22, 1, .36, 1),
          transform 180ms ease,
          border-color 180ms ease,
          background 220ms ease,
          box-shadow 220ms ease,
          padding 220ms ease;
      }
      #keysInline .keysZoneCard:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--keys-accent) 50%, rgba(255, 255, 255, 0.18));
      }
      #keysInline .keysZoneCard.is-selected {
        flex-grow: 1.9;
        border-color: color-mix(in srgb, var(--keys-accent) 75%, rgba(255, 255, 255, 0.2));
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--keys-accent) 10%, rgba(255,255,255,.02)) 0%, rgba(0,0,0,.18) 52%);
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, var(--keys-accent) 18%, transparent),
          0 12px 30px color-mix(in srgb, var(--keys-accent) 10%, transparent);
      }
      #keysInline .keysZoneCard:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--keys-accent) 55%, rgba(255, 255, 255, 0.18));
        outline-offset: 2px;
      }
      #keysInline .keysZoneHead {
        display: grid;
        grid-template-columns: 24px 1fr;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      #keysInline .keysZoneHead img {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }
      #keysInline .keysZoneHead h4 {
        margin: 0;
        font-size: 13px;
        line-height: 1.2;
      }
      #keysInline .keysZoneCard.is-selected .keysZoneHead h4 {
        font-size: 15px;
      }
      #keysInline .keysZoneBody {
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.02);
        transition: padding 220ms ease, background 220ms ease;
      }
      #keysInline .keysZoneCard.is-selected .keysZoneBody {
        padding: 10px 12px;
      }
      #keysInline .keysZoneCols,
      #keysInline .keysZoneRow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 62px 62px;
        gap: 10px;
        align-items: center;
      }
      #keysInline .keysZoneCard.is-selected .keysZoneCols,
      #keysInline .keysZoneCard.is-selected .keysZoneRow {
        grid-template-columns: minmax(0, 1fr) 74px 74px;
        gap: 12px;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneCols,
      #keysInline .keysZoneCard.is-compact .keysZoneRow {
        grid-template-columns: minmax(0, 1fr) 62px;
        gap: 10px;
      }
      #keysInline .keysZoneCols {
        margin-bottom: 2px;
        color: var(--muted-color);
        font-size: 11px;
      }
      #keysInline .keysZoneColsRight,
      #keysInline .keysZoneValue {
        text-align: right;
      }
      #keysInline .keysZoneRow {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 12px;
      }
      #keysInline .keysZoneRow:last-child {
        border-bottom: 0;
      }
      #keysInline .keysZoneRow.is-profit {
        border-bottom: 0;
        padding: 3px 0;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneBody {
        padding: 8px 10px;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneRow {
        font-size: 11.5px;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneCols > :last-child,
      #keysInline .keysZoneCard.is-compact .keysZoneRow:not(.is-profit) > :last-child {
        display: none;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneCols > :nth-child(2),
      #keysInline .keysZoneCard.is-compact .keysZoneRow > :nth-child(2) {
        justify-self: end;
      }
      #keysInline .keysZoneLabel {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        transition: gap 220ms ease;
      }
      #keysInline .keysZoneMuted {
        opacity: 0.62;
      }
      #keysInline .keysZoneMuted.ico {
        filter: grayscale(1) saturate(0.15);
      }
      #keysInline .keysZoneDeprecated {
        opacity: 0.62;
        text-decoration: line-through;
        text-decoration-thickness: 1.5px;
        text-decoration-color: color-mix(in srgb, rgba(248, 113, 113, 0.95) 78%, rgba(255,255,255,.28));
      }
      #keysInline .keysZoneNameCurrent {
        opacity: 0.96;
      }
      #keysInline .keysZoneLabel .ico {
        width: 13px;
        height: 13px;
        flex: 0 0 auto;
      }
      #keysInline .keysZoneName {
        display: inline-block;
        min-width: 0;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: 1;
        transform: translateX(0);
        transition: max-width 260ms cubic-bezier(.22, 1, .36, 1), opacity 180ms ease, transform 220ms ease;
      }
      #keysInline .keysZoneCard.is-selected .keysZoneName {
        overflow: visible;
        text-overflow: clip;
        max-width: 240px;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneLabel {
        gap: 6px;
        justify-content: flex-start;
      }
      #keysInline .keysZoneCard.is-compact .keysZoneName {
        max-width: 140px;
        opacity: 1;
        transform: translateX(0);
      }
      #keysInline .keysZoneRow.is-strong .keysZoneName,
      #keysInline .keysZoneRow.is-strong .keysZoneValue {
        font-weight: 700;
      }
      #keysInline .keysZoneValue {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
      }
      #keysInline .keysZoneDivider {
        height: 1px;
        margin: 6px 0;
        background: rgba(255, 255, 255, 0.08);
      }
      #keysInline .keysZoneProfit.pos { color: #22c55e; }
      #keysInline .keysZoneProfit.neg { color: #ef4444; }
      #keysInline .keysPlannerShell {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }
      #keysInline .keysFoot {
        margin: 12px 0 0;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
      }
      #keysInline .refreshAge {
        opacity: 0.65;
        font-size: 12px;
        white-space: nowrap;
      }
      #keysInline .keysCalcPanel,
      #keysInline .keysCalcEmpty {
        margin: 0;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--card-border-color);
        background: rgba(0, 0, 0, 0.18);
      }
      #keysInline .keysCalcEmpty {
        border-style: dashed;
        opacity: 0.82;
      }
      #keysInline .keysCalcHead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        cursor: pointer;
      }
      #keysInline .keysCalcHeadMain {
        min-width: 0;
      }
      #keysInline .keysCalcToggle {
        display: inline-flex;
        align-items: center;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
      }
      #keysInline .keysCalcToggle .chev {
        margin-right: 0;
      }
      #keysInline .keysCalcPanel:not(.is-collapsed) .keysCalcToggle .chev {
        transform: rotate(-135deg);
      }
      #keysInline .keysCalcPanel.is-collapsed .keysCalcToggle .chev {
        transform: rotate(45deg);
      }
      #keysInline .keysCalcTitle {
        font-size: 13px;
        font-weight: 800;
        line-height: 1.2;
      }
      #keysInline .keysCalcSub {
        margin-top: 3px;
        font-size: 11px;
        opacity: 0.72;
      }
      #keysInline .keysCalcImport {
        margin-top: 6px;
        font-size: 11px;
        line-height: 1.35;
        color: color-mix(in srgb, var(--accent) 68%, rgba(255, 255, 255, 0.9));
        font-weight: 700;
      }
      #keysInline .keysCalcCostLabel {
        display: block;
        margin-bottom: 2px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.05em;
        opacity: 0.68;
        text-transform: uppercase;
      }
      #keysInline .keysCalcCostValue {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-wrap: wrap;
        font-size: 28px;
        font-weight: 900;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      #keysInline .keysCalcEstimateBadge {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        font-weight: 800;
        line-height: 1;
        color: color-mix(in srgb, currentColor 58%, rgba(255, 255, 255, 0.58));
        opacity: 0.86;
        transform: translateY(-1px);
      }
      #keysInline .keysCalcEstimateBadge.tipHost[data-tip]:not([data-tip=""])::after {
        width: max-content;
        max-width: min(220px, calc(100vw - 48px));
        white-space: nowrap;
      }
      #keysInline .keysCalcTotalMain {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      #keysInline .keysCalcTotalIcon {
        width: 20px;
        height: 20px;
        object-fit: contain;
        flex: 0 0 auto;
        filter: drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 26%, transparent));
      }
      #keysInline .keysCalcCostLine {
        width: 100%;
        height: 3px;
        margin-top: 7px;
        border-radius: 999px;
        background:
          linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--accent) 30%, transparent) 14%,
            color-mix(in srgb, var(--accent) 92%, white) 50%,
            color-mix(in srgb, var(--accent) 30%, transparent) 86%,
            transparent 100%);
        box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 26%, transparent);
      }
      #keysInline .keysCalcBody {
        display: block;
      }
      #keysInline .keysCalcPanel.is-collapsed .keysCalcBody {
        display: none;
      }
      #keysInline .keysCalcGrid {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: 8px 10px;
        margin-bottom: 10px;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.02);
      }
      #keysInline .keysCalcField {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 0 0 auto;
      }
      #keysInline .keysCalcField.is-target {
        width: 154px;
        margin-left: auto;
      }
      #keysInline .keysCalcField.is-frag-pricing { width: auto; }
      #keysInline .keysCalcField.is-artisan { width: auto; }
      #keysInline .keysCalcField.is-pouch {
        width: auto;
        align-self: flex-end;
      }
      #keysInline .keysCalcFieldLabel {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.04em;
        opacity: 0.72;
        text-transform: uppercase;
      }
      #keysInline .keysCalcFieldRow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
      }
      #keysInline .keysCalcTargetRow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      #keysInline .keysCalcFooterMain {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
      }
      #keysInline .keysCalcBank {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-start;
        min-width: 0;
      }
      #keysInline .keysCalcField.is-bank.tipHost[data-tip]:not([data-tip=""])::after {
        width: max-content;
        max-width: min(300px, calc(100vw - 48px));
        white-space: normal;
      }
      #keysInline .keysCalcBankRow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      #keysInline .keysCalcField.is-bank {
        width: 196px;
        margin-right: auto;
      }
      #keysInline .keysCalcField.is-bank .keysCalcInput {
        text-align: left;
      }
      #keysInline .keysCalcPouchIcon {
        width: 18px;
        height: 18px;
        object-fit: contain;
        flex: 0 0 auto;
        display: block;
      }
      #keysInline .keysCalcInput {
        height: 36px;
        width: 100%;
        padding: 0 10px;
        border-radius: 12px;
        border: 1px solid var(--card-border-color);
        background: rgba(0, 0, 0, 0.14);
        color: inherit;
        font: inherit;
        font-weight: 800;
        font-size: 13px;
        text-align: center;
      }
      #keysInline .keysCalcField.is-pouch .keysCalcInput {
        width: 82px;
        min-width: 82px;
      }
      #keysInline .keysCalcField.is-target .keysCalcInput {
        width: 90px;
        min-width: 90px;
      }
      #keysInline .keysCalcResetBtn {
        height: 36px;
        min-width: 54px;
        padding: 0 12px;
        border-radius: 10px;
        border: 1px solid rgba(239, 68, 68, 0.45);
        background: rgba(127, 29, 29, 0.26);
        color: #fca5a5;
        cursor: pointer;
        font: inherit;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
      }
      #keysInline .keysCalcResetBtn:hover {
        background: rgba(153, 27, 27, 0.34);
        border-color: rgba(248, 113, 113, 0.58);
        color: #fecaca;
        transform: translateY(-1px);
      }
      #keysInline .keysCalcResetBtn:focus-visible {
        outline: 2px solid rgba(248, 113, 113, 0.45);
        outline-offset: 2px;
      }
      #keysInline .keysCalcInput.is-disabled,
      #keysInline .keysCalcInput:disabled {
        opacity: 0.56;
        color: rgba(255, 255, 255, 0.62);
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.08);
        cursor: default;
      }
      #keysInline .keysCalcInput:focus-visible,
      #keysInline .keysSegBtn:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--accent) 45%, rgba(255, 255, 255, 0.18));
        outline-offset: 2px;
      }
      #keysInline .keysSeg {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px;
        width: fit-content;
        min-height: 32px;
        border-radius: 999px;
        border: 1px solid var(--card-border-color);
        background: rgba(0, 0, 0, 0.12);
      }
      #keysInline .keysSegBtn {
        min-height: 24px;
        padding: 0 10px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
        font-size: 10.5px;
        font-weight: 800;
        opacity: 0.72;
        transition: background 160ms ease, opacity 160ms ease;
      }
      #keysInline .keysSegBtn:hover {
        opacity: 0.92;
      }
      #keysInline .keysSegBtn.is-active {
        opacity: 1;
        background: color-mix(in srgb, var(--accent) 16%, rgba(255, 255, 255, 0.02));
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 24%, transparent);
      }
      #keysInline .keysCalcListTitle {
        margin: 0 0 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.05em;
        opacity: 0.76;
        text-transform: uppercase;
      }
      #keysInline .keysFragList {
        display: grid;
        gap: 8px;
      }
      #keysInline .keysFragRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
      }
      #keysInline .keysFragMeta {
        display: inline-flex;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;
        flex: 1 1 auto;
      }
      #keysInline .keysFragMeta .ico {
        width: 18px;
        height: 18px;
        margin-top: 2px;
      }
      #keysInline .keysFragText {
        min-width: 0;
      }
      #keysInline .keysFragNameRow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      #keysInline .keysFragName {
        font-size: 14px;
        font-weight: 700;
        line-height: 1.2;
      }
      #keysInline .keysFragNeed {
        position: relative;
        display: inline-flex;
        align-items: center;
        padding-bottom: 4px;
        font-size: 14px;
        font-weight: 900;
        color: color-mix(in srgb, var(--accent) 60%, var(--text));
        font-variant-numeric: tabular-nums;
      }
      #keysInline .keysFragNeed::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        border-radius: 999px;
        background:
          linear-gradient(90deg,
            transparent 0%,
            color-mix(in srgb, var(--accent) 30%, transparent) 14%,
            color-mix(in srgb, var(--accent) 92%, white) 50%,
            color-mix(in srgb, var(--accent) 30%, transparent) 86%,
            transparent 100%);
        box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 22%, transparent);
      }
      #keysInline .keysFragEach {
        font-size: 12px;
        font-weight: 700;
        opacity: 0.74;
      }
      #keysInline .keysFragOverrideInput {
        width: 128px;
        height: 24px;
        padding: 0 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.16);
        color: inherit;
        font: inherit;
        font-size: 11px;
        font-weight: 700;
        text-align: center;
      }
      #keysInline .keysFragOverrideInput::placeholder {
        opacity: 0.56;
      }
      #keysInline .keysFragValue {
        text-align: right;
        font-variant-numeric: tabular-nums;
        flex: 0 0 auto;
      }
      #keysInline .keysFragTotal {
        font-size: 16px;
        font-weight: 900;
        line-height: 1;
      }
      #keysInline .keysCalcFooter {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      #keysInline .keysCalcCost.is-inline {
        min-width: 168px;
        text-align: right;
      }

      html[data-theme="light"] #keysInline .keysZoneCard,
      html[data-theme="light"] #keysInline .keysCalcPanel,
      html[data-theme="light"] #keysInline .keysCalcEmpty {
        background: var(--surface-elev-1);
        border-color: var(--card-border-color);
      }
      html[data-theme="light"] #keysInline .keysZoneBody,
      html[data-theme="light"] #keysInline .keysCalcGrid {
        background: rgba(255, 255, 255, 0.72);
        border-color: var(--neutral-border);
      }
      html[data-theme="light"] #keysInline .keysZoneRow,
      html[data-theme="light"] #keysInline .keysCalcFooter,
      html[data-theme="light"] #keysInline .keysPlannerShell {
        border-color: rgba(31, 41, 55, 0.08);
      }
      html[data-theme="light"] #keysInline .keysZoneCols,
      html[data-theme="light"] #keysInline .refreshAge,
      html[data-theme="light"] #keysInline .keysCalcSub {
        color: rgba(31, 41, 55, 0.72);
      }
      html[data-theme="light"] #keysInline .keysZoneCard.is-selected {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--keys-accent) 14%, rgba(255,255,255,.9)) 0%, var(--surface-elev-1) 58%);
      }
      html[data-theme="light"] #keysInline .keysCalcInput,
      html[data-theme="light"] #keysInline .keysFragOverrideInput,
      html[data-theme="light"] #keysInline .keysSeg {
        background: #fff;
        border-color: var(--neutral-border);
        color: rgba(31, 41, 55, 0.96);
      }
      html[data-theme="light"] #keysInline .keysCalcResetBtn {
        background: rgba(254, 226, 226, 0.92);
        border-color: rgba(239, 68, 68, 0.34);
        color: #b91c1c;
      }
      html[data-theme="light"] #keysInline .keysCalcInput.is-disabled,
      html[data-theme="light"] #keysInline .keysCalcInput:disabled {
        color: rgba(31, 41, 55, 0.48);
        background: rgba(241, 245, 249, 0.92);
        border-color: rgba(148, 163, 184, 0.38);
      }

      @media (max-width: 1180px) {
        #keysInline .keysGrid {
          flex-wrap: wrap;
        }
        #keysInline .keysZoneCard {
          flex: 1 1 calc(50% - 6px);
        }
        #keysInline .keysZoneCard.is-selected {
          flex: 1.35 1 calc(50% - 6px);
        }
      }
      @media (max-width: 780px) {
        #keysInline .keysGrid {
          flex-direction: column;
        }
        #keysInline .keysZoneCard,
        #keysInline .keysZoneCard.is-selected {
          flex: 1 1 auto;
        }
        #keysInline .keysCalcHead {
          align-items: flex-start;
        }
        #keysInline .keysFragRow {
          align-items: flex-start;
          flex-direction: column;
        }
        #keysInline .keysFragValue {
          text-align: left;
        }
        #keysInline .keysCalcFooter {
          justify-content: flex-start;
        }
        #keysInline .keysCalcFooterMain {
          flex-direction: column;
          align-items: stretch;
        }
        #keysInline .keysCalcBank {
          width: 100%;
        }
        #keysInline .keysCalcBankRow {
          width: 100%;
        }
        #keysInline .keysCalcField.is-bank {
          width: 100%;
        }
        #keysInline .keysCalcField.is-bank .keysCalcInput {
          flex: 1 1 auto;
          width: auto;
          min-width: 0;
        }
        #keysInline .keysCalcCost.is-inline {
          text-align: left;
        }
        #keysInline .keysCalcField.is-target {
          margin-left: 0;
        }
        #keysInline .keysCalcTargetRow {
          width: 100%;
        }
        #keysInline .keysCalcField.is-target .keysCalcInput {
          flex: 1 1 auto;
          width: auto;
          min-width: 0;
        }
      }
      @media (max-width: 560px) {
        #keysInline .keysCalcField.is-pouch {
          width: 100%;
        }
        #keysInline .keysCalcFieldRow {
          width: 100%;
        }
        #keysInline .keysCalcField.is-pouch .keysCalcInput {
          flex: 0 0 78px;
        }
        #keysInline .keysCalcField.is-target { width: 100%; max-width: 168px; }
      }
    `;
    document.head.appendChild(style);
  }

  async function fetchMarketplaceJsonForSource(source = getActiveApiSource()) {
    const fetchWithFallback = getMarketShared()?.fetchWithProxyFallback;
    if (typeof fetchWithFallback !== "function") return null;
    const result = await fetchWithFallback(marketUrlForSource(source), 12000);
    return result.json;
  }

  async function ensureMarketData(opts = {}) {
    const apiSource = normalizeApiSource(opts.apiSource || getActiveApiSource());
    const force = !!opts.force;
    const freshEnough = (Date.now() - Number(marketCacheTsBySource[apiSource] || 0)) < (5 * 60 * 1000);
    if (!force && getCachedMarketData(apiSource) && freshEnough) return getCachedMarketData(apiSource);
    if (marketFetchInFlightBySource[apiSource]) return marketFetchInFlightBySource[apiSource];

    marketFetchInFlightBySource[apiSource] = (async () => {
      const cachedMarket = getCachedMarketData(apiSource);
      if (force && typeof window.DungeonAPI?.refreshPricesForAllDungeons === "function") {
        try {
          await window.DungeonAPI.refreshPricesForAllDungeons(apiSource, {
            silent: true,
            reason: "keys",
          });
        } catch (_) { }
      }
      const json = await fetchMarketplaceJsonForSource(apiSource);
      if (!hasUsableMarketplacePayload(json)) {
        if (!force && cachedMarket) return cachedMarket;
        throw new Error(t("ui.invalidApiPayload", "Invalid API payload."));
      }
      marketCacheBySource = {
        ...marketCacheBySource,
        [apiSource]: json,
      };
      const nextTs = Date.now();
      marketCacheTsBySource = {
        ...marketCacheTsBySource,
        [apiSource]: nextTs,
      };
      try { storageSetItem(keysRefreshStorageKey(apiSource), String(nextTs)); } catch (_) { }
      emitKeyImportChanged({ reason: "market-cache-updated", apiSource });
      return json;
    })();

    try {
      return await marketFetchInFlightBySource[apiSource];
    } finally {
      marketFetchInFlightBySource = {
        ...marketFetchInFlightBySource,
        [apiSource]: null,
      };
    }
  }

  function extractAskBidFromMarketJson(json, hrid) {
    const extractAskBid = getMarketShared()?.extractAskBidFromMarketJson;
    if (typeof extractAskBid === "function") return extractAskBid(json, hrid);
    return { ask: null, bid: null };
  }

  function fmtCoins(n) {
    const formatter = getNumberShared()?.formatCoinsShort;
    if (typeof formatter === "function") return formatter(n, { invalidText: "-" });
    if (n == null || !Number.isFinite(n)) return "-";
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.00$/, "") + "k";
    return Math.floor(n).toLocaleString();
  }

  function fmtCount(n) {
    if (n == null || !Number.isFinite(n)) return "-";
    const roundedWhole = Math.round(n);
    if (Math.abs(n - roundedWhole) < 0.0001) return roundedWhole.toLocaleString();
    return n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  function parseCompactNumberValue(raw) {
    const shared = getNumberShared();
    if (shared && typeof shared.parseCompactNumber === "function") {
      return shared.parseCompactNumber(raw);
    }
    if (raw == null) return null;
    const cleaned = String(raw)
      .trim()
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .toLowerCase();
    const match = cleaned.match(/^(\d+(\.\d+)?)([kmb])?$/);
    if (!match) return null;
    const base = Number(match[1]);
    if (!Number.isFinite(base)) return null;
    const mult = match[3] === "b" ? 1_000_000_000 : match[3] === "m" ? 1_000_000 : match[3] === "k" ? 1_000 : 1;
    return base * mult;
  }

  function formatCoinsCompactValue(n) {
    const formatter = getNumberShared()?.formatCoinsCompact;
    if (typeof formatter === "function") return formatter(n);
    if (!Number.isFinite(n)) return "";
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);
    const compact = (value, suffix) => {
      const rounded = Math.round(value * 10) / 10;
      const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      return `${sign}${str}${suffix}`;
    };
    if (abs >= 1_000_000_000) return compact(abs / 1_000_000_000, "b");
    if (abs >= 1_000_000) return compact(abs / 1_000_000, "m");
    if (abs >= 1_000) return compact(abs / 1_000, "k");
    return `${sign}${Math.round(abs).toLocaleString()}`;
  }

  function normalizeBankInput(raw) {
    const text = sanitizeBankInputTyping(raw);
    if (!text) return "";
    const inferred = text.match(/^(\d+(\.\d+)?)$/);
    const normalizedRaw = inferred
      ? (() => {
        const base = Number(inferred[1]);
        if (Number.isFinite(base) && base >= 1 && base <= 999) return `${inferred[1]}m`;
        return text;
      })()
      : text;
    const parsed = parseCompactNumberValue(normalizedRaw);
    if (!Number.isFinite(parsed) || parsed <= 0) return "";
    return formatCoinsCompactValue(parsed);
  }

  function sanitizeBankInputTyping(raw) {
    const text = String(raw == null ? "" : raw)
      .trim()
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .toLowerCase();
    if (!text) return "";
    let numericPart = "";
    let suffix = "";
    let seenDecimal = false;
    for (const ch of text) {
      if (/\d/.test(ch)) {
        if (!suffix) numericPart += ch;
        continue;
      }
      if (ch === ".") {
        if (!suffix && !seenDecimal) {
          numericPart += numericPart ? "." : "0.";
          seenDecimal = true;
        }
        continue;
      }
      if ((ch === "k" || ch === "m" || ch === "b") && numericPart && !suffix) {
        suffix = ch;
        continue;
      }
    }
    return `${numericPart}${suffix}`;
  }

  function shouldReplaceOnDigitKey(event) {
    if (!event || event.ctrlKey || event.metaKey || event.altKey) return false;
    return /^\d$/.test(String(event.key || ""));
  }

  function fmtSigned(n) {
    if (n == null || !Number.isFinite(n)) return "-";
    const base = fmtCoins(Math.abs(n));
    if (n > 0) return `+${base}`;
    if (n < 0) return `-${base}`;
    return base;
  }

  function formatAge(ms) {
    const format = getTimeShared()?.formatAge;
    if (typeof format === "function") return format(ms, { style: "ago", invalidText: "-" });
    return "-";
  }

  function startAgeTimer(spanEl, source = getActiveApiSource()) {
    const startTimer = getTimeShared()?.startAgeTimerFromStorage;
    if (typeof startTimer !== "function") return;
    startTimer(spanEl, {
      timerKey: AGE_TIMER_KEY,
      storageKey: keysRefreshStorageKey(source),
      invalidText: "-",
      intervalMs: 5000,
      formatter: formatAge,
    });
  }

  function fallbackFilenameFromItemHrid(itemHrid) {
    if (typeof itemHrid !== "string") return null;
    const m = itemHrid.match(/^\/items\/([^/]+)$/);
    if (!m) return null;
    const id = m[1];
    return id.length ? (id[0].toUpperCase() + id.slice(1) + ".svg") : null;
  }

  function iconPath(itemHrid) {
    const iconPathFromHrid = getItemHridShared()?.iconPathFromHrid;
    if (typeof iconPathFromHrid === "function") return iconPathFromHrid(itemHrid, "./assets/Svg/");
    const file = fallbackFilenameFromItemHrid(itemHrid);
    if (!file) return null;
    return "./assets/Svg/" + encodeURIComponent(file).replace(/%2F/g, "/");
  }

  function fallbackItemName(itemHrid) {
    const id = String(itemHrid || "").split("/").pop() || "";
    return id
      .split("_")
      .map(w => (w ? (w[0].toUpperCase() + w.slice(1)) : w))
      .join(" ");
  }

  function fragmentColorName(itemHrid, name) {
    const base = String(name || fallbackItemName(itemHrid)).trim();
    const shortened = base
      .replace(/\s*Key Fragment\s*$/i, "")
      .replace(/\s*\u94a5\u5319\u788e\u7247\s*$/u, "")
      .replace(/\s*\u9470\u5319\u788e\u7247\s*$/u, "")
      .trim();
    if (shortened) return shortened;
    const m = String(itemHrid || "").match(/^\/items\/(.+)_key_fragment$/);
    if (!m) return fallbackItemName(itemHrid);
    const color = m[1].split("_")[0] || "";
    return color ? (color[0].toUpperCase() + color.slice(1)) : fallbackItemName(itemHrid);
  }

  function compactKeyName(name, prefix) {
    const base = String(name || "").replace(/\s*(Chest|Entry)\s*Key\s*$/i, "").trim();
    if (base) return base;
    const p = String(prefix || "").trim();
    return p ? (p[0].toUpperCase() + p.slice(1)) : t("ui.key", "Key");
  }

  function ingredientLabel(itemHrid, fallbackName) {
    if (String(itemHrid || "").endsWith("_key_fragment")) return fragmentColorName(itemHrid, fallbackName);
    return fallbackName || fallbackItemName(itemHrid);
  }

  async function getInitData() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      return await shared.getInitData();
    }
    if (window.InitCharacterData) return window.InitCharacterData;
    return await window.InitLoader?.loadInitData?.();
  }

  function readDungeonCards() {
    return Array.from(document.querySelectorAll(".card[data-dungeon]"))
      .map(c => {
        const uiKey = String(c.getAttribute("data-dungeon") || "").trim();
        if (!uiKey) return null;
        const title = c.querySelector("h2")?.textContent?.trim() || uiKey;
        const prefix = uiKey.split("_")[0];
        const icon = c.querySelector(".icon img")?.getAttribute("src") || "";
        const accent = getComputedStyle(c).getPropertyValue("--card-accent").trim() || "#34d399";
        return { uiKey, prefix, title, icon, accent };
      })
      .filter(Boolean);
  }

  function prefixFromKeyHrid(hrid) {
    const m = String(hrid || "").match(/^\/items\/(.+)_(?:chest|entry)_key$/);
    return m ? m[1] : "";
  }

  function outputKey(action, keyType) {
    const suffix = normalizeKeyType(keyType) === KEY_TYPE_ENTRY ? "_entry_key" : "_chest_key";
    const out = Array.isArray(action?.outputItems) ? action.outputItems : [];
    return out.find(x => String(x?.itemHrid || "").endsWith(suffix)) || null;
  }

  function recipeInputs(action) {
    const arr = Array.isArray(action?.inputItems) ? action.inputItems : [];
    return arr
      .filter(x => String(x?.itemHrid || "").startsWith("/items/"))
      .map(x => ({
        itemHrid: String(x.itemHrid),
        count: (Number.isFinite(x.count) && x.count > 0) ? x.count : 1,
      }));
  }

  async function buildRecipesFromInit(keyTypeRaw = ensureCalcState().selectedType) {
    const keyType = normalizeKeyType(keyTypeRaw);
    if (!recipeCache || typeof recipeCache !== "object") {
      recipeCache = {
        [KEY_TYPE_CHEST]: null,
        [KEY_TYPE_ENTRY]: null,
      };
    }
    if (Array.isArray(recipeCache[keyType])) return recipeCache[keyType];

    const init = await getInitData();
    if (!init) return [];
    const actionMap = init?.actionDetailMap || {};
    const itemMap = init?.itemDetailMap || {};
    const cards = readDungeonCards();
    const byPrefix = new Map(cards.map(x => [x.prefix, x]));
    const recipes = [];

    for (const action of Object.values(actionMap)) {
      const keyOut = outputKey(action, keyType);
      if (!keyOut) continue;

      const keyHrid = String(keyOut.itemHrid || "");
      const prefix = prefixFromKeyHrid(keyHrid);
      const card = byPrefix.get(prefix);
      if (!card) continue;

      const ingredients = recipeInputs(action);
      if (!ingredients.length) continue;

      const outCount = (Number.isFinite(keyOut.count) && keyOut.count > 0) ? keyOut.count : 1;
      recipes.push({
        uiKey: card.uiKey,
        keyType,
        prefix,
        title: card.title,
        icon: card.icon,
        accent: card.accent,
        keyHrid,
        keyName: itemMap[keyHrid]?.name || fallbackItemName(keyHrid),
        outputCount: outCount,
        fragments: ingredients.map(ingredient => ({
          ...ingredient,
          name: itemMap[ingredient.itemHrid]?.name || fallbackItemName(ingredient.itemHrid),
        })),
      });
    }

    recipes.sort((a, b) => cards.findIndex(x => x.uiKey === a.uiKey) - cards.findIndex(x => x.uiKey === b.uiKey));
    recipeCache[keyType] = recipes;
    return recipeCache[keyType];
  }

  function ingredientPrice(itemHrid, market) {
    if (String(itemHrid || "") === COIN_HRID) return { ask: 1, bid: 1 };
    return extractAskBidFromMarketJson(market, itemHrid);
  }

  function ingredientArtisanMultiplier(itemHrid, options = {}) {
    // Artisan/Guzzling savings apply to the full crafting recipe, including coin costs.
    return artisanTeaMaterialMultiplier(options);
  }

  function ingredientUnitCount(recipe, ingredient, options = {}) {
    const outputCount = Math.max(1, Number(recipe?.outputCount || 1));
    const count = Number.isFinite(Number(ingredient?.count)) ? Number(ingredient.count) : 0;
    return (count / outputCount) * ingredientArtisanMultiplier(ingredient?.itemHrid, options);
  }

  function keyTypeLabel(keyType) {
    return normalizeKeyType(keyType) === KEY_TYPE_ENTRY
      ? t("ui.entryKeys", "Entry keys")
      : t("ui.chestKeys", "Chest keys");
  }

  function keyModeToggleLabel(currentType) {
    return normalizeKeyType(currentType) === KEY_TYPE_ENTRY
      ? keyTypeLabel(KEY_TYPE_CHEST)
      : keyTypeLabel(KEY_TYPE_ENTRY);
  }

  function plannerTargetLabel(keyType) {
    return tf("ui.keysTargetForType", "# of {type}", { type: keyTypeLabel(keyType) });
  }

  function plannerPricingLabel(keyType) {
    return normalizeKeyType(keyType) === KEY_TYPE_ENTRY
      ? t("ui.keysInputPricing", "Input pricing")
      : t("ui.keysFragmentPricing", "Fragment pricing");
  }

  function plannerMaterialsLabel(keyType) {
    return normalizeKeyType(keyType) === KEY_TYPE_ENTRY
      ? t("ui.keysMaterialsNeeded", "Materials needed")
      : t("ui.keysFragmentsNeeded", "Fragments needed");
  }

  function plannerBankLabel() {
    return t("ui.keysBank", "Bank");
  }

  function plannerBankHelpText() {
    return t(
      "ui.keysBankHelp",
      "Set a coin budget and the planner will reverse-calculate the maximum fragments you can afford with the current prices."
    );
  }

  function profitClass(v) {
    if (!(typeof v === "number" && Number.isFinite(v))) return "";
    if (v > 0) return "pos";
    if (v < 0) return "neg";
    return "";
  }

  function zoneCardHtml(recipe, market, selectedDungeonKey) {
    const isSelected = selectedDungeonKey === recipe.uiKey;
    const state = ensureCalcState();
    const artisanEnabled = !!normalizeArtisanEnabled(state.artisanEnabled);
    const keyPrice = extractAskBidFromMarketJson(market, recipe.keyHrid);
    const keyIcon = iconPath(recipe.keyHrid);
    const keyIconHtml = keyIcon ? `<img src="${escAttr(keyIcon)}" alt="" class="ico" loading="lazy" onerror="this.style.display='none'">` : "";
    const teaIcon = iconPath(ARTISAN_TEA_HRID);
    const teaIconHtml = teaIcon ? `<img src="${escAttr(teaIcon)}" alt="" class="ico" loading="lazy" onerror="this.style.display='none'">` : "";
    const zoneIconHtml = recipe.icon
      ? `<img src="${escAttr(recipe.icon)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : "";
    const keyLabel = compactKeyName(recipe.keyName, recipe.prefix);

    const fragRows = recipe.fragments.map((f) => {
      const p = ingredientPrice(f.itemHrid, market);
      const unitCount = ingredientUnitCount(recipe, f, state);
      const askTotal = Number.isFinite(p.ask) ? (p.ask * unitCount) : null;
      const bidTotal = Number.isFinite(p.bid) ? (p.bid * unitCount) : null;
      return { ...f, ask: p.ask, bid: p.bid, unitCount, askTotal, bidTotal };
    });

    const craftAskTea = fragRows.every((f) => Number.isFinite(f.askTotal))
      ? fragRows.reduce((sum, f) => sum + f.askTotal, 0)
      : null;
    const craftBidTea = fragRows.every((f) => Number.isFinite(f.bidTotal))
      ? fragRows.reduce((sum, f) => sum + f.bidTotal, 0)
      : null;
    const instantAskDelta = (Number.isFinite(keyPrice.ask) && Number.isFinite(craftAskTea)) ? (keyPrice.ask - craftAskTea) : null;
    const instantBidDelta = (Number.isFinite(keyPrice.bid) && Number.isFinite(craftAskTea)) ? (keyPrice.bid - craftAskTea) : null;
    const orderAskDelta = (Number.isFinite(keyPrice.ask) && Number.isFinite(craftBidTea)) ? (keyPrice.ask - craftBidTea) : null;
    const orderBidDelta = (Number.isFinite(keyPrice.bid) && Number.isFinite(craftBidTea)) ? (keyPrice.bid - craftBidTea) : null;
    const compactProfitLabel = artisanEnabled
      ? t("ui.instantArtisan", "Instant Artisan")
      : t("ui.instantCraft", "Instant Craft");
    const craftCostLabelHtml = artisanEnabled
      ? `${teaIconHtml}<span class="keysZoneName">${escHtml(t("ui.artisanCost", "Artisan Cost"))}</span>`
      : isSelected
        ? `
            ${teaIcon ? `<img src="${escAttr(teaIcon)}" alt="" class="ico keysZoneMuted" loading="lazy" onerror="this.style.display='none'">` : ""}
            <span class="keysZoneName keysZoneDeprecated keysZoneMuted">${escHtml(t("ui.artisan", "Artisan"))}</span>
            <span class="keysZoneName keysZoneNameCurrent">${escHtml(t("ui.craft", "Craft"))}</span>
            <span class="keysZoneName">${escHtml(t("ui.cost", "Cost"))}</span>
          `
        : `
            ${teaIcon ? `<img src="${escAttr(teaIcon)}" alt="" class="ico keysZoneMuted" loading="lazy" onerror="this.style.display='none'">` : ""}
            <span class="keysZoneName keysZoneNameCurrent">${escHtml(t("ui.craft", "Craft"))}</span>
          `;

    const fragHtml = fragRows.map((f) => {
      const icon = iconPath(f.itemHrid);
      const iconHtml = icon ? `<img src="${escAttr(icon)}" alt="" class="ico" loading="lazy" onerror="this.style.display='none'">` : "";
      const showAsk = recipe.keyType === KEY_TYPE_ENTRY ? f.askTotal : f.ask;
      const showBid = recipe.keyType === KEY_TYPE_ENTRY ? f.bidTotal : f.bid;
      return `
        <div class="keysZoneRow is-fragment">
          <div class="keysZoneLabel">${iconHtml}<span class="keysZoneName">${escHtml(ingredientLabel(f.itemHrid, f.name))}</span></div>
          <div class="keysZoneValue">${escHtml(fmtCoins(showAsk))}</div>
          <div class="keysZoneValue">${escHtml(fmtCoins(showBid))}</div>
        </div>
      `;
    }).join("");

    const compactProfitHtml = `
      <div class="keysZoneRow is-profit">
        <div class="keysZoneName">${escHtml(compactProfitLabel)}</div>
        <div class="keysZoneValue"><span class="keysZoneProfit ${profitClass(instantAskDelta)}">${escHtml(fmtSigned(instantAskDelta))}</span></div>
      </div>
    `;
    const detailedProfitHtml = `
      <div class="keysZoneRow is-profit">
        <div class="keysZoneName">${escHtml(t("ui.instantCraft", "Instant Craft"))}</div>
        <div class="keysZoneValue"><span class="keysZoneProfit ${profitClass(instantAskDelta)}">${escHtml(fmtSigned(instantAskDelta))}</span></div>
        <div class="keysZoneValue"><span class="keysZoneProfit ${profitClass(instantBidDelta)}">${escHtml(fmtSigned(instantBidDelta))}</span></div>
      </div>
      <div class="keysZoneRow is-profit">
        <div class="keysZoneName">${escHtml(t("ui.orderCraft", "Order Craft"))}</div>
        <div class="keysZoneValue"><span class="keysZoneProfit ${profitClass(orderAskDelta)}">${escHtml(fmtSigned(orderAskDelta))}</span></div>
        <div class="keysZoneValue"><span class="keysZoneProfit ${profitClass(orderBidDelta)}">${escHtml(fmtSigned(orderBidDelta))}</span></div>
      </div>
    `;

    return `
      <button
        class="keysZoneCard${isSelected ? " is-selected" : " is-compact"}"
        type="button"
        data-keys-zone="${escAttr(recipe.uiKey)}"
        aria-pressed="${isSelected ? "true" : "false"}"
        style="--keys-accent:${escAttr(recipe.accent || "#34d399")};"
      >
        <div class="keysZoneHead">
          ${zoneIconHtml}
          <h4>${escHtml(recipe.title)}</h4>
        </div>
        <div class="keysZoneBody">
          <div class="keysZoneCols">
            <span>${escHtml(t("ui.item", "Item"))}</span>
            <span class="keysZoneColsRight">${escHtml(t("ui.ask", "Ask"))}</span>
            <span class="keysZoneColsRight">${escHtml(t("ui.bid", "Bid"))}</span>
          </div>
          <div class="keysZoneRow is-strong">
            <div class="keysZoneLabel">${keyIconHtml}<span class="keysZoneName">${escHtml(keyLabel)}</span></div>
            <div class="keysZoneValue">${escHtml(fmtCoins(keyPrice.ask))}</div>
            <div class="keysZoneValue">${escHtml(fmtCoins(keyPrice.bid))}</div>
          </div>
          ${fragHtml}
          <div class="keysZoneRow is-strong">
            <div class="keysZoneLabel">${craftCostLabelHtml}</div>
            <div class="keysZoneValue">${escHtml(fmtCoins(craftAskTea))}</div>
            <div class="keysZoneValue">${escHtml(fmtCoins(craftBidTea))}</div>
          </div>
          <div class="keysZoneDivider" aria-hidden="true"></div>
          ${isSelected ? detailedProfitHtml : compactProfitHtml}
        </div>
      </button>
    `;
  }

  function zoneCardsHtml(recipes, market, selectedDungeonKey) {
    return `
      <div class="keysGrid">
        ${recipes.map((recipe) => zoneCardHtml(recipe, market, selectedDungeonKey)).join("")}
      </div>
    `;
  }

  function getSelectedDungeonKey() {
    const api = window.DungeonAPI || null;
    if (api && typeof api.getSelectedDungeon === "function") {
      return String(api.getSelectedDungeon() || "").trim();
    }
    return String(storageGetItem("dungeon.selectedDungeon") || "").trim();
  }

  function resolveKeysSelectedRecipe(recipes) {
    const list = Array.isArray(recipes) ? recipes : [];
    const selectedDungeonKey = getSelectedDungeonKey();
    let selectedRecipe = list.find((recipe) => recipe.uiKey === selectedDungeonKey) || null;
    let effectiveDungeonKey = selectedDungeonKey;
    let autoSelected = false;
    if (!selectedRecipe && list.length) {
      selectedRecipe = list[0] || null;
      effectiveDungeonKey = String(selectedRecipe?.uiKey || "").trim();
      autoSelected = !!effectiveDungeonKey && !selectedDungeonKey;
    }
    return { selectedDungeonKey: effectiveDungeonKey, selectedRecipe, autoSelected };
  }

  function plannerImportSummary(recipe, plannerImport) {
    const payload = normalizePlannerImport(plannerImport);
    if (!recipe || !payload || payload.uiKey !== recipe.uiKey) return "";
    const parts = [];
    const zoneCompareLabel = t("ui.zoneCompare", "Zone Compare");
    const tierLabel = payload.tier ? `${zoneCompareLabel} ${payload.tier}` : zoneCompareLabel;
    parts.push(tierLabel);
    parts.push(`${t("ui.chestKeys", "Chest keys")}: ${fmtCount(payload.chestCount)}`);
    parts.push(`${t("ui.entryKeys", "Entry keys")}: ${fmtCount(payload.entryCount)}`);
    return parts.join(" • ");
  }

  function getFragmentOverrideRaw(uiKey, itemHrid, overridesMap = ensureCalcState().overridesMap) {
    const byDungeon = overridesMap && typeof overridesMap === "object" ? overridesMap[uiKey] : null;
    return String((byDungeon && byDungeon[itemHrid]) || "").trim();
  }

  function setFragmentOverrideRaw(uiKey, itemHrid, rawValue) {
    const state = ensureCalcState();
    const nextMap = { ...(state.overridesMap || {}) };
    const nextDungeon = { ...(nextMap[uiKey] || {}) };
    const raw = String(rawValue == null ? "" : rawValue).trim();
    if (raw) nextDungeon[itemHrid] = raw;
    else delete nextDungeon[itemHrid];
    if (Object.keys(nextDungeon).length) nextMap[uiKey] = nextDungeon;
    else delete nextMap[uiKey];
    setCalcState({ overridesMap: nextMap });
  }

  function buildChestTargetEstimate(recipe, market, options = {}) {
    if (!recipe) return null;

    const useBid = normalizeBuyMode(options.buyMode) === BUY_MODE_ORDER;
    const budgetRaw = getRecipeBankRaw(recipe, recipe?.keyType, options);
    const budgetValue = parseCompactNumberValue(budgetRaw);
    const hasBudgetMode = Number.isFinite(budgetValue) && budgetValue > 0;
    const targetKeyCount = parsePositiveInteger(getRecipeTargetRaw(recipe, recipe?.keyType, options));
    if (!hasBudgetMode && !targetKeyCount) return null;

    const fragmentsBase = recipe.fragments.map((fragment) => {
      const price = ingredientPrice(fragment.itemHrid, market);
      const overrideRaw = getFragmentOverrideRaw(recipe.uiKey, fragment.itemHrid, options.overridesMap);
      const overrideValue = parseCompactNumberValue(overrideRaw);
      const unitPrice = Number.isFinite(overrideValue) ? overrideValue : (useBid ? price.bid : price.ask);
      const countPerCraft = fragment.count * ingredientArtisanMultiplier(fragment.itemHrid, options);
      return {
        ...fragment,
        countPerCraft,
        unitPrice,
        overrideRaw,
        hasOverride: Number.isFinite(overrideValue),
      };
    });

    let craftsNeeded = 0;
    let producedKeys = 0;
    let totalCost = null;
    let budgetSpend = null;

    if (hasBudgetMode) {
      const perCraftCost = fragmentsBase.every((fragment) => Number.isFinite(fragment.unitPrice))
        ? fragmentsBase.reduce((sum, fragment) => sum + (fragment.unitPrice * fragment.countPerCraft), 0)
        : null;
      craftsNeeded = perCraftCost && perCraftCost > 0
        ? Math.max(0, Math.floor((budgetValue + 1e-9) / perCraftCost))
        : 0;
      producedKeys = craftsNeeded * Math.max(1, recipe.outputCount || 1);
      budgetSpend = Number.isFinite(perCraftCost) ? (craftsNeeded * perCraftCost) : null;
      totalCost = budgetSpend;
    } else {
      craftsNeeded = Math.max(1, Math.ceil(targetKeyCount / Math.max(1, recipe.outputCount || 1)));
      producedKeys = craftsNeeded * Math.max(1, recipe.outputCount || 1);
    }

    const fragments = fragmentsBase.map((fragment) => {
      const totalCount = roundToTenths(craftsNeeded * fragment.countPerCraft);
      const totalCost = Number.isFinite(fragment.unitPrice) ? (fragment.unitPrice * totalCount) : null;
      return {
        ...fragment,
        totalCount,
        totalCost,
      };
    });

    if (!hasBudgetMode) {
      totalCost = fragments.every((fragment) => Number.isFinite(fragment.totalCost))
        ? fragments.reduce((sum, fragment) => sum + fragment.totalCost, 0)
        : null;
    }

    return {
      mode: hasBudgetMode ? "bank" : "target",
      budgetRaw,
      budgetValue: hasBudgetMode ? budgetValue : null,
      budgetSpend,
      craftsNeeded,
      producedKeys,
      totalCost,
      fragments,
    };
  }

  function countFragmentOverridesForDungeon(uiKey, overridesMap = ensureCalcState().overridesMap) {
    const byDungeon = overridesMap && typeof overridesMap === "object" ? overridesMap[uiKey] : null;
    return byDungeon && typeof byDungeon === "object" ? Object.keys(byDungeon).length : 0;
  }

  function computeImportedPriceForRecipe(recipe, market, options = {}) {
    if (!recipe || !market) return null;
    const useBid = normalizeBuyMode(options.buyMode) === BUY_MODE_ORDER;
    let total = 0;
    for (const fragment of (recipe.fragments || [])) {
      const quote = ingredientPrice(fragment.itemHrid, market);
      const overrideRaw = getFragmentOverrideRaw(recipe.uiKey, fragment.itemHrid, options.overridesMap);
      const overrideValue = parseCompactNumberValue(overrideRaw);
      const unitPrice = Number.isFinite(overrideValue) ? overrideValue : (useBid ? quote.bid : quote.ask);
      const unitCount = ingredientUnitCount(recipe, fragment, options);
      if (!Number.isFinite(unitPrice) || !Number.isFinite(unitCount)) return null;
      total += unitPrice * unitCount;
    }
    return Number.isFinite(total) ? total : null;
  }

  function buildImportedPricingSnapshot(dungeonKey, market, apiSource, options = {}, recipesByType = {}) {
    const uiKey = String(dungeonKey || "").trim();
    const state = {
      ...ensureCalcState(),
      ...(options || {}),
    };
    const entryRecipes = Array.isArray(recipesByType.entryRecipes) ? recipesByType.entryRecipes : [];
    const chestRecipes = Array.isArray(recipesByType.chestRecipes) ? recipesByType.chestRecipes : [];
    const entryRecipe = entryRecipes.find((recipe) => recipe?.uiKey === uiKey) || null;
    const chestRecipe = chestRecipes.find((recipe) => recipe?.uiKey === uiKey) || null;
    const entryPrice = computeImportedPriceForRecipe(entryRecipe, market, state);
    const chestKeyPrice = computeImportedPriceForRecipe(chestRecipe, market, state);
    let errorMessage = "";
    if (!uiKey) {
      errorMessage = t("ui.noDungeonSelected", "No dungeon selected.");
    } else if (!market) {
      errorMessage = t("ui.keysImportUnavailable", "Keys planner pricing is not ready yet.");
    } else if (!entryRecipe || !chestRecipe) {
      errorMessage = t("ui.keysImportRecipeMissing", "Missing key recipe data for the selected dungeon.");
    } else if (!Number.isFinite(entryPrice) || !Number.isFinite(chestKeyPrice)) {
      errorMessage = t("ui.keysImportMissingPrices", "Some key planner ingredients are missing prices.");
    }
    return {
      ok: Number.isFinite(entryPrice) && Number.isFinite(chestKeyPrice),
      ready: !!market,
      dungeonKey: uiKey,
      apiSource,
      buyMode: normalizeBuyMode(state.buyMode),
      artisanEnabled: normalizeArtisanEnabled(state.artisanEnabled),
      guzzlingPouchEnabled: normalizeGuzzlingPouchEnabled(state.guzzlingPouchEnabled),
      guzzlingPouchLevel: normalizeGuzzlingPouchLevel(state.guzzlingPouchLevel),
      overrideCount: countFragmentOverridesForDungeon(uiKey, state.overridesMap),
      entryPrice,
      chestKeyPrice,
      errorMessage,
    };
  }

  async function ensureImportedPricingForDungeon(dungeonKey, opts = {}) {
    const uiKey = String(dungeonKey || "").trim() || getSelectedDungeonKey();
    const apiSource = normalizeApiSource(opts.apiSource || getActiveApiSource());
    const market = await ensureMarketData({ force: !!opts.force, apiSource });
    const [entryRecipes, chestRecipes] = await Promise.all([
      buildRecipesFromInit(KEY_TYPE_ENTRY),
      buildRecipesFromInit(KEY_TYPE_CHEST),
    ]);
    return buildImportedPricingSnapshot(uiKey, market, apiSource, ensureCalcState(), {
      entryRecipes,
      chestRecipes,
    });
  }

  function getCachedImportedPricingForDungeon(dungeonKey, opts = {}) {
    const uiKey = String(dungeonKey || "").trim() || getSelectedDungeonKey();
    const apiSource = normalizeApiSource(opts.apiSource || getActiveApiSource());
    const market = getCachedMarketData(apiSource);
    const entryRecipes = Array.isArray(recipeCache?.[KEY_TYPE_ENTRY]) ? recipeCache[KEY_TYPE_ENTRY] : [];
    const chestRecipes = Array.isArray(recipeCache?.[KEY_TYPE_CHEST]) ? recipeCache[KEY_TYPE_CHEST] : [];
    return buildImportedPricingSnapshot(uiKey, market, apiSource, ensureCalcState(), {
      entryRecipes,
      chestRecipes,
    });
  }

  function calculatorPanelHtml(recipe) {
    const state = ensureCalcState();
    if (!recipe) {
      return `<div class="keysCalcEmpty">${escHtml(t("ui.keysSelectDungeonPrompt", "Select a dungeon to calculate fragment totals."))}</div>`;
    }

    const importSummary = plannerImportSummary(recipe, state.plannerImport);
    const pouchDisplayValue = formatGuzzlingPouchDisplayValue(state.guzzlingPouchLevel, state.guzzlingPouchEnabled);
    const pouchDisabled = !state.guzzlingPouchEnabled;
    const targetRaw = getRecipeTargetRaw(recipe, recipe.keyType, state);
    const bankRaw = getRecipeBankRaw(recipe, recipe.keyType, state);
    const showBankClear = bankRaw.length > 0;
    const toggleLabel = state.expanded
      ? t("ui.keysHidePlanner", "Hide planner")
      : t("ui.keysShowPlanner", "Show planner");
    return `
      <div id="keysPlannerPanel" class="keysCalcPanel${state.expanded ? "" : " is-collapsed"}" data-planner-open="${state.expanded ? "1" : "0"}">
        <div class="keysCalcHead" id="keysCalcHead" role="button" tabindex="0" aria-expanded="${state.expanded ? "true" : "false"}" aria-controls="keysCalcBody">
          <div class="keysCalcHeadMain">
            <div class="keysCalcTitle">${escHtml(t("ui.keysChestCalc", "Key cost planner"))}</div>
            <div class="keysCalcSub">${escHtml(recipe.title || recipe.uiKey)} • ${escHtml(recipe.keyName || fallbackItemName(recipe.keyHrid))}</div>
            ${importSummary ? `<div class="keysCalcImport">${escHtml(importSummary)}</div>` : ""}
          </div>
          <button class="keysCalcToggle" type="button" id="keysCalcToggleBtn" aria-expanded="${state.expanded ? "true" : "false"}" aria-label="${escAttr(toggleLabel)}" title="${escAttr(toggleLabel)}">
            <span class="chev" aria-hidden="true"></span>
          </button>
        </div>
        <div class="keysCalcBody" id="keysCalcBody">
          <div class="keysCalcGrid">
            <div class="keysCalcField is-frag-pricing">
              <span class="keysCalcFieldLabel">${escHtml(plannerPricingLabel(recipe.keyType))}</span>
              <div class="keysSeg" id="keysBuyModeSegment" role="group" aria-label="${escAttr(plannerPricingLabel(recipe.keyType))}">
                <button class="keysSegBtn" type="button" data-keys-buy-mode="${BUY_MODE_INSTANT}">${escHtml(t("ui.instant", "Instant"))}</button>
                <button class="keysSegBtn" type="button" data-keys-buy-mode="${BUY_MODE_ORDER}">${escHtml(t("ui.order", "Order"))}</button>
              </div>
            </div>
            <div class="keysCalcField is-artisan">
              <span class="keysCalcFieldLabel">${escHtml(t("ui.artisan", "Artisan"))}</span>
              <div class="keysSeg" id="keysArtisanSegment" role="group" aria-label="${escAttr(t("ui.artisan", "Artisan"))}">
                <button class="keysSegBtn" type="button" data-keys-artisan="1">${escHtml(t("ui.onShort", "On"))}</button>
                <button class="keysSegBtn" type="button" data-keys-artisan="0">${escHtml(t("ui.offShort", "Off"))}</button>
              </div>
            </div>
            <div class="keysCalcField is-pouch">
              <span class="keysCalcFieldLabel">${escHtml(t("ui.guzzlingPouchLevel", "Guzzling Pouch lv."))}</span>
              <div class="keysCalcFieldRow">
                <div class="keysSeg" id="keysPouchSegment" role="group" aria-label="${escAttr(t("ui.guzzlingPouchLevel", "Guzzling Pouch lv."))}">
                  <button class="keysSegBtn" type="button" data-keys-pouch="1">${escHtml(t("ui.onShort", "On"))}</button>
                  <button class="keysSegBtn" type="button" data-keys-pouch="0">${escHtml(t("ui.offShort", "Off"))}</button>
                </div>
                <img src="${escAttr(GUZZLING_POUCH_ICON_PATH)}" alt="" class="keysCalcPouchIcon" loading="lazy" onerror="this.style.display='none'">
                <input
                  id="keysGuzzlingPouchInput"
                  class="keysCalcInput${pouchDisabled ? " is-disabled" : ""}"
                  type="text"
                  inputmode="numeric"
                  spellcheck="false"
                  autocomplete="off"
                  value="${escAttr(pouchDisplayValue)}"
                  aria-label="${escAttr(t("ui.guzzlingPouchLevel", "Guzzling Pouch lv."))}"
                  ${pouchDisabled ? "disabled" : ""}
                >
              </div>
            </div>
            <label class="keysCalcField is-target">
              <span class="keysCalcFieldLabel">${escHtml(plannerTargetLabel(recipe.keyType))}</span>
              <div class="keysCalcTargetRow">
                <button class="keysCalcResetBtn" type="button" id="keysTargetResetBtn">${escHtml(t("ui.reset", "Reset"))}</button>
                <input
                  id="keysChestTargetInput"
                  class="keysCalcInput"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  value="${escAttr(targetRaw)}"
                >
              </div>
            </label>
          </div>
          <div id="keysCalcResults"></div>
          <div class="keysCalcFooter">
            <div class="keysCalcFooterMain">
              <div class="keysCalcBank">
                <span class="keysCalcFieldLabel">${escHtml(plannerBankLabel())}</span>
                <div class="keysCalcBankRow">
                  <label
                    class="keysCalcField is-bank tipHost"
                    data-tip="${escAttr(plannerBankHelpText())}"
                    tabindex="0"
                    role="group"
                    aria-label="${escAttr(plannerBankHelpText())}"
                  >
                    <input
                      id="keysBudgetInput"
                      class="keysCalcInput"
                      type="text"
                      inputmode="decimal"
                      spellcheck="false"
                      autocomplete="off"
                      placeholder="${escAttr(t("ui.keysBankPlaceholder", "Current Coins"))}"
                      value="${escAttr(bankRaw)}"
                      aria-label="${escAttr(plannerBankLabel())}"
                    >
                  </label>
                  <button
                    class="keysCalcResetBtn"
                    type="button"
                    id="keysBudgetClearBtn"
                    ${showBankClear ? "" : "hidden"}
                  >${escHtml(t("ui.clear", "Clear"))}</button>
                </div>
              </div>
              <div class="keysCalcCost is-inline">
                <span class="keysCalcCostLabel" id="keysCalcCostLabel">${escHtml(t("ui.keysTotalCost", "Total cost"))}</span>
                <div class="keysCalcCostValue" id="keysCalcCostValue">-</div>
                <div class="keysCalcCostLine" aria-hidden="true"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function calculatorResultsHtml(recipe, estimate) {
    const rowsHtml = estimate
      ? estimate.fragments.map((fragment) => {
        const icon = iconPath(fragment.itemHrid);
        const iconHtml = icon ? `<img src="${escAttr(icon)}" alt="" class="ico" loading="lazy" onerror="this.style.display='none'">` : "";
        const eachText = tf("ui.keysEachPrice", "@ {price} ea", { price: fmtCoins(fragment.unitPrice) });
        const manualValue = escAttr(fragment.overrideRaw || "");
        const allowOverride = String(fragment.itemHrid || "") !== COIN_HRID;
        return `
          <div class="keysFragRow">
            <div class="keysFragMeta">
              ${iconHtml}
              <div class="keysFragText">
                <div class="keysFragNameRow">
                  <div class="keysFragName">${escHtml(ingredientLabel(fragment.itemHrid, fragment.name || fallbackItemName(fragment.itemHrid)))}</div>
                  <div class="keysFragNeed">x ${escHtml(fmtCount(fragment.totalCount))}</div>
                  <div class="keysFragEach">${escHtml(eachText)}</div>
                  ${allowOverride ? `
                    <input
                      class="keysFragOverrideInput"
                      type="text"
                      inputmode="decimal"
                      spellcheck="false"
                      data-frag-override="${escAttr(fragment.itemHrid)}"
                      value="${manualValue}"
                      placeholder="${escAttr(t("ui.keysManualPrice", "Manual Price Input"))}"
                      aria-label="${escAttr(tf("ui.keysManualPrice", "Manual price", { item: fragment.name || fallbackItemName(fragment.itemHrid) }))}"
                    >
                  ` : ""}
                </div>
              </div>
            </div>
            <div class="keysFragValue">
              <div class="keysFragTotal">${escHtml(fmtCoins(fragment.totalCost))}</div>
            </div>
          </div>
        `;
      }).join("")
      : "";

    return `
      <div class="keysCalcListTitle">${escHtml(plannerMaterialsLabel(recipe?.keyType))}</div>
      <div class="keysFragList">${rowsHtml || `<div class="muted">-</div>`}</div>
    `;
  }

  function syncCalculatorButtonState(panel) {
    const state = ensureCalcState();
    const root = panel.querySelector(".keysCalcPanel");
    const head = panel.querySelector("#keysCalcHead");
    const toggleBtn = panel.querySelector("#keysCalcToggleBtn");
    const pouchInput = panel.querySelector("#keysGuzzlingPouchInput");
    const bankInput = panel.querySelector("#keysBudgetInput");
    const bankClearBtn = panel.querySelector("#keysBudgetClearBtn");
    if (root) root.classList.toggle("is-collapsed", !state.expanded);
    if (pouchInput) {
      const nextValue = formatGuzzlingPouchDisplayValue(state.guzzlingPouchLevel, state.guzzlingPouchEnabled);
      if (pouchInput.value !== nextValue) pouchInput.value = nextValue;
      pouchInput.disabled = !state.guzzlingPouchEnabled;
      pouchInput.classList.toggle("is-disabled", !state.guzzlingPouchEnabled);
    }
    if (toggleBtn) {
      const toggleLabel = state.expanded
        ? t("ui.keysHidePlanner", "Hide planner")
        : t("ui.keysShowPlanner", "Show planner");
      toggleBtn.setAttribute("aria-expanded", state.expanded ? "true" : "false");
      toggleBtn.setAttribute("aria-label", toggleLabel);
      toggleBtn.setAttribute("title", toggleLabel);
    }
    if (head) {
      head.setAttribute("aria-expanded", state.expanded ? "true" : "false");
    }
    if (bankInput) {
      const bankRaw = getRecipeBankRaw(getSelectedDungeonKey(), normalizeKeyType(state.selectedType), state);
      if (bankInput.value !== bankRaw) bankInput.value = bankRaw;
    }
    if (bankClearBtn) {
      bankClearBtn.hidden = !getRecipeBankRaw(getSelectedDungeonKey(), normalizeKeyType(state.selectedType), state);
    }
    panel.querySelectorAll("[data-keys-buy-mode]").forEach((btn) => {
      const mode = String(btn.getAttribute("data-keys-buy-mode") || "");
      btn.classList.toggle("is-active", mode === normalizeBuyMode(state.buyMode));
      btn.setAttribute("aria-pressed", mode === normalizeBuyMode(state.buyMode) ? "true" : "false");
    });
    panel.querySelectorAll("[data-keys-artisan]").forEach((btn) => {
      const enabled = String(btn.getAttribute("data-keys-artisan") || "") === "1";
      btn.classList.toggle("is-active", enabled === !!state.artisanEnabled);
      btn.setAttribute("aria-pressed", enabled === !!state.artisanEnabled ? "true" : "false");
    });
    panel.querySelectorAll("[data-keys-pouch]").forEach((btn) => {
      const enabled = String(btn.getAttribute("data-keys-pouch") || "") === "1";
      btn.classList.toggle("is-active", enabled === !!state.guzzlingPouchEnabled);
      btn.setAttribute("aria-pressed", enabled === !!state.guzzlingPouchEnabled ? "true" : "false");
    });
  }

  function updateCalculator(panel, recipe, market) {
    if (!panel || !recipe) return;
    const results = panel.querySelector("#keysCalcResults");
    const input = panel.querySelector("#keysChestTargetInput");
    const bankInput = panel.querySelector("#keysBudgetInput");
    const totalCostEl = panel.querySelector("#keysCalcCostValue");
    const totalCostLabelEl = panel.querySelector("#keysCalcCostLabel");
    const targetRaw = getRecipeTargetRaw(recipe);
    const bankRaw = getRecipeBankRaw(recipe);
    if (input && input.value !== targetRaw) {
      input.value = targetRaw;
    }
    if (bankInput && bankInput.value !== bankRaw) {
      bankInput.value = bankRaw;
    }
    syncCalculatorButtonState(panel);
    const estimate = buildChestTargetEstimate(recipe, market, ensureCalcState());
    const artisanEstimate = !!estimate && !!ensureCalcState().artisanEnabled;
    const keyIcon = recipe?.keyHrid ? iconPath(recipe.keyHrid) : "";
    if (totalCostLabelEl) {
      totalCostLabelEl.textContent = estimate?.mode === "bank"
        ? t("ui.keysTotalForBudget", "Total Keys for your budget")
        : t("ui.keysTotalCost", "Total cost");
    }
    if (totalCostEl) {
      if (!estimate) {
        totalCostEl.textContent = "-";
      } else if (artisanEstimate && estimate.mode === "bank") {
        totalCostEl.innerHTML = `
          <span
            class="keysCalcEstimateBadge tipHost"
            data-tip="${escAttr(t("ui.keysEstimateArtisanHelp", "Estimated when artisan is enabled"))}"
          >${escHtml(t("ui.keysEstimatePrefix", "~"))}</span>
          <span class="keysCalcTotalMain">
            <span>${escHtml(fmtCount(estimate.producedKeys))}</span>
            ${keyIcon ? `<img src="${escAttr(keyIcon)}" alt="" class="keysCalcTotalIcon" loading="lazy" onerror="this.style.display='none'">` : ""}
          </span>
        `;
      } else if (estimate.mode === "bank") {
        totalCostEl.innerHTML = `
          <span class="keysCalcTotalMain">
            <span>${escHtml(fmtCount(estimate.producedKeys))}</span>
            ${keyIcon ? `<img src="${escAttr(keyIcon)}" alt="" class="keysCalcTotalIcon" loading="lazy" onerror="this.style.display='none'">` : ""}
          </span>
        `;
      } else if (artisanEstimate) {
        totalCostEl.innerHTML = `
          <span
            class="keysCalcEstimateBadge tipHost"
            data-tip="${escAttr(t("ui.keysEstimateArtisanHelp", "Estimated when artisan is enabled"))}"
          >${escHtml(t("ui.keysEstimatePrefix", "~"))}</span>
          <span>${escHtml(fmtCoins(estimate.totalCost))}</span>
        `;
      } else {
        totalCostEl.textContent = fmtCoins(estimate.totalCost);
      }
    }
    if (!results) return;
    results.innerHTML = calculatorResultsHtml(recipe, estimate);
  }

  function bindCalculatorControls(panel, recipe, recipes, market) {
    if (!panel || !recipe) return;
    const plannerPanel = panel.querySelector("#keysPlannerPanel");
    const toggleHead = panel.querySelector("#keysCalcHead");

    const togglePlannerExpanded = () => {
      setCalcState({ expanded: !ensureCalcState().expanded });
      syncCalculatorButtonState(panel);
    };

    const toggleBtn = panel.querySelector("#keysCalcToggleBtn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePlannerExpanded();
      });
    }
    if (toggleHead) {
      toggleHead.addEventListener("click", () => {
        togglePlannerExpanded();
      });
      toggleHead.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        togglePlannerExpanded();
      });
    }

    const input = panel.querySelector("#keysChestTargetInput");
    if (input) {
      input.addEventListener("input", () => {
        setRecipeTargetRaw(recipe, input.value);
        updateCalculator(panel, recipe, market);
      });
      input.addEventListener("change", () => {
        const normalized = parsePositiveInteger(input.value);
        const nextRaw = normalized ? String(normalized) : DEFAULT_TARGET_RAW;
        setRecipeTargetRaw(recipe, nextRaw);
        input.value = nextRaw;
        updateCalculator(panel, recipe, market);
      });
    }
    const resetBtn = panel.querySelector("#keysTargetResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        const nextRaw = setRecipeTargetRaw(recipe, DEFAULT_TARGET_RAW);
        if (input) input.value = nextRaw;
        updateCalculator(panel, recipe, market);
      });
    }
    const bankInput = panel.querySelector("#keysBudgetInput");
    const bankClearBtn = panel.querySelector("#keysBudgetClearBtn");
    if (bankInput) {
      bankInput.addEventListener("focus", () => {
        bankInput.dataset.replaceOnDigit = bankInput.value ? "1" : "";
      });
      bankInput.addEventListener("keydown", (event) => {
        if (!bankInput.dataset.replaceOnDigit) return;
        if (shouldReplaceOnDigitKey(event)) {
          bankInput.value = "";
          bankInput.dataset.replaceOnDigit = "";
          return;
        }
        if (event.key === "Backspace" || event.key === "Delete" || event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
          bankInput.dataset.replaceOnDigit = "";
        }
      });
      bankInput.addEventListener("input", () => {
        const nextRaw = sanitizeBankInputTyping(bankInput.value);
        if (bankInput.value !== nextRaw) bankInput.value = nextRaw;
        bankInput.dataset.replaceOnDigit = "";
        setRecipeBankRaw(recipe, nextRaw);
        updateCalculator(panel, recipe, market);
      });
      bankInput.addEventListener("change", () => {
        const nextRaw = normalizeBankInput(bankInput.value);
        setRecipeBankRaw(recipe, nextRaw);
        bankInput.value = nextRaw;
        bankInput.dataset.replaceOnDigit = "";
        updateCalculator(panel, recipe, market);
      });
      bankInput.addEventListener("blur", () => {
        const nextRaw = normalizeBankInput(bankInput.value);
        setRecipeBankRaw(recipe, nextRaw);
        bankInput.value = nextRaw;
        bankInput.dataset.replaceOnDigit = "";
        updateCalculator(panel, recipe, market);
      });
    }
    if (bankClearBtn) {
      bankClearBtn.addEventListener("click", () => {
        setRecipeBankRaw(recipe, "");
        if (bankInput) bankInput.value = "";
        updateCalculator(panel, recipe, market);
      });
    }

    panel.querySelectorAll("[data-keys-buy-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCalcState({ buyMode: btn.getAttribute("data-keys-buy-mode") || BUY_MODE_INSTANT });
        updateCalculator(panel, recipe, market);
      });
    });

    panel.querySelectorAll("[data-keys-artisan]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCalcState({ artisanEnabled: String(btn.getAttribute("data-keys-artisan") || "") === "1" });
        refreshZoneCardGrid(panel, recipes, market);
        updateCalculator(panel, recipe, market);
      });
    });

    const pouchInput = panel.querySelector("#keysGuzzlingPouchInput");
    if (pouchInput) {
      pouchInput.addEventListener("focus", () => {
        pouchInput.dataset.replaceOnDigit = pouchInput.value ? "1" : "";
      });
      pouchInput.addEventListener("keydown", (event) => {
        if (!pouchInput.dataset.replaceOnDigit) return;
        if (shouldReplaceOnDigitKey(event)) {
          pouchInput.value = "";
          pouchInput.dataset.replaceOnDigit = "";
          return;
        }
        if (event.key === "Backspace" || event.key === "Delete" || event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
          pouchInput.dataset.replaceOnDigit = "";
        }
      });
      pouchInput.addEventListener("input", () => {
        setCalcState({ guzzlingPouchLevel: normalizeGuzzlingPouchLevel(String(pouchInput.value || "").replace(/[^\d]/g, "")) });
        pouchInput.dataset.replaceOnDigit = "";
        refreshZoneCardGrid(panel, recipes, market);
        updateCalculator(panel, recipe, market);
      });
      pouchInput.addEventListener("change", () => {
        const nextLevel = normalizeGuzzlingPouchLevel(String(pouchInput.value || "").replace(/[^\d]/g, ""));
        setCalcState({ guzzlingPouchLevel: nextLevel });
        pouchInput.value = formatGuzzlingPouchDisplayValue(nextLevel, true);
        pouchInput.dataset.replaceOnDigit = "";
        refreshZoneCardGrid(panel, recipes, market);
        updateCalculator(panel, recipe, market);
      });
    }

    panel.querySelectorAll("[data-keys-pouch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setCalcState({ guzzlingPouchEnabled: String(btn.getAttribute("data-keys-pouch") || "") === "1" });
        refreshZoneCardGrid(panel, recipes, market);
        updateCalculator(panel, recipe, market);
      });
    });

    plannerPanel?.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const hrid = String(target.getAttribute("data-frag-override") || "");
      if (!hrid) return;
      const parsed = parseCompactNumberValue(target.value);
      const nextRaw = Number.isFinite(parsed) ? String(target.value || "").trim() : "";
      setFragmentOverrideRaw(recipe.uiKey, hrid, nextRaw);
      updateCalculator(panel, recipe, market);
    });
  }

  function clearKeysInlinePanel(panelEl) {
    hideAndClearElement(panelEl);
  }

  function hideAndClearElement(el) {
    const shared = getUiStateShared();
    if (shared && typeof shared.hideAndClear === "function") {
      shared.hideAndClear(el);
      return;
    }
    if (!el) return;
    el.hidden = true;
    el.innerHTML = "";
  }

  function selectDungeon(uiKey) {
    const card = Array.from(document.querySelectorAll(".card[data-dungeon]"))
      .find((el) => String(el.getAttribute("data-dungeon") || "").trim() === String(uiKey || "").trim());
    if (card) card.click();
  }

  function dispatchToggleChange(inputEl) {
    if (!inputEl) return;
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function importPlannerPayload(rawPayload) {
    const payload = normalizePlannerImport(rawPayload);
    if (!payload) return false;

    const nextTargetRaw = payload.targetCount ? String(payload.targetCount) : getRecipeTargetRaw(payload.uiKey, payload.selectedType);
    setCalcState({
      expanded: true,
      selectedType: payload.selectedType,
      plannerImport: {
        ...payload,
        targetCount: parsePositiveInteger(nextTargetRaw) || payload.targetCount || null,
      },
    });
    setRecipeTargetRaw(payload.uiKey, nextTargetRaw, payload.selectedType);

    if (payload.uiKey) selectDungeon(payload.uiKey);

    const toggle = document.getElementById("keysToggle");
    if (toggle && !toggle.checked) {
      toggle.checked = true;
      dispatchToggleChange(toggle);
    } else {
      void render();
    }

    window.setTimeout(() => {
      const planner = document.getElementById("keysPlannerPanel") || document.querySelector("#keysInline .keysPlannerShell") || document.getElementById("keysInline");
      try {
        planner?.scrollIntoView({ block: "start", behavior: "smooth" });
      } catch (_) {
        try { planner?.scrollIntoView(); } catch (_) { }
      }
    }, 120);

    return true;
  }

  async function ensurePlannerOpen() {
    setCalcState({ expanded: true });
    const toggle = document.getElementById("keysToggle");
    if (toggle?.checked) {
      await render();
    }
    return true;
  }

  async function loadKeysPanelData() {
    let recipes = [];
    let market = null;
    const selectedType = normalizeKeyType(ensureCalcState().selectedType);
    try {
      recipes = await buildRecipesFromInit(selectedType);
      market = await ensureMarketData({ force: false });
    } catch (err) {
      console.error("Keys panel load failed:", err);
    }
    return { recipes, market };
  }

  async function getRelevantPricingHrids(dungeonKey = getSelectedDungeonKey()) {
    const uiKey = String(dungeonKey || "").trim() || getSelectedDungeonKey();
    if (!uiKey) return [];
    const selectedType = normalizeKeyType(ensureCalcState().selectedType);
    const recipes = await buildRecipesFromInit(selectedType);
    const recipe = recipes.find((entry) => entry?.uiKey === uiKey) || null;
    if (!recipe) return [];
    const hrids = new Set();
    if (recipe.keyHrid) hrids.add(recipe.keyHrid);
    (recipe.fragments || []).forEach((fragment) => {
      const hrid = String(fragment?.itemHrid || "").trim();
      if (hrid) hrids.add(hrid);
    });
    return Array.from(hrids);
  }

  function plannerShellHtml(selectedRecipe) {
    const selectedType = normalizeKeyType(ensureCalcState().selectedType);
    const toggleText = keyModeToggleLabel(selectedType);
    const sourceLabel = apiSourceLabel();
    const refreshTitle = tf("ui.refreshApiPricesTip", "Refresh {source} API prices", { source: sourceLabel });
    return `
      ${calculatorPanelHtml(selectedRecipe)}
      <div class="keysFoot">
        <span class="refreshAge" id="keysRefreshAge">-</span>
        <button class="miniBtn" type="button" id="keysTypeBtn" aria-label="${escAttr(toggleText)}" title="${escAttr(toggleText)}">${escHtml(toggleText)}</button>
        <button class="miniBtn" type="button" id="keysRefreshBtn" title="${escAttr(refreshTitle)}" aria-label="${escAttr(refreshTitle)}">${escHtml(t("ui.refreshPrices", "Refresh prices"))}</button>
      </div>
    `;
  }

  function updateZoneCardSelection(panel, selectedDungeonKey) {
    if (!panel) return;
    panel.querySelectorAll("[data-keys-zone]").forEach((btn) => {
      const uiKey = String(btn.getAttribute("data-keys-zone") || "").trim();
      const isSelected = !!uiKey && uiKey === String(selectedDungeonKey || "").trim();
      btn.classList.toggle("is-selected", isSelected);
      btn.classList.toggle("is-compact", !isSelected);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function bindZoneCardButtons(panel, recipes, market) {
    if (!panel) return;
    panel.querySelectorAll("[data-keys-zone]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uiKey = String(btn.getAttribute("data-keys-zone") || "").trim();
        if (!uiKey || uiKey === getSelectedDungeonKey()) return;
        updateZoneCardSelection(panel, uiKey);
        const nextRecipe = recipes.find((recipe) => recipe.uiKey === uiKey) || null;
        renderPlannerShell(panel, nextRecipe, recipes, market);
        selectDungeon(uiKey);
      });
    });
  }

  function refreshZoneCardGrid(panel, recipes, market) {
    if (!panel || !Array.isArray(recipes) || !recipes.length) return;
    const currentGrid = panel.querySelector(".keysGrid");
    if (!currentGrid) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = zoneCardsHtml(recipes, market, getSelectedDungeonKey());
    const nextGrid = wrapper.firstElementChild;
    if (!(nextGrid instanceof HTMLElement)) return;
    currentGrid.replaceWith(nextGrid);
    bindZoneCardButtons(panel, recipes, market);
  }

  function renderPlannerShell(panel, selectedRecipe, recipes, market) {
    if (!panel) return;
    const plannerShell = panel.querySelector(".keysPlannerShell");
    if (!plannerShell) return;
    plannerShell.innerHTML = plannerShellHtml(selectedRecipe);
    const ageSpan = plannerShell.querySelector("#keysRefreshAge");
    startAgeTimer(ageSpan, getActiveApiSource());
    const refreshBtn = plannerShell.querySelector("#keysRefreshBtn");
    bindKeysRefreshButton(refreshBtn);
    const typeBtn = plannerShell.querySelector("#keysTypeBtn");
    bindKeyTypeButton(typeBtn, selectedRecipe);
    if (selectedRecipe) {
      updateCalculator(panel, selectedRecipe, market);
      bindCalculatorControls(panel, selectedRecipe, recipes, market);
    }
    try {
      document.dispatchEvent(new CustomEvent("keys:planner-changed", {
        detail: {
          uiKey: String(selectedRecipe?.uiKey || ""),
          keyType: normalizeKeyType(ensureCalcState().selectedType),
        },
      }));
    } catch (_) { }
  }

  function bindKeyTypeButton(typeBtn, selectedRecipe) {
    if (!typeBtn) return;
    typeBtn.addEventListener("click", async () => {
      const nextType = normalizeKeyType(ensureCalcState().selectedType) === KEY_TYPE_ENTRY ? KEY_TYPE_CHEST : KEY_TYPE_ENTRY;
      const nextTarget = getRecipeTargetRaw(selectedRecipe, nextType);
      setCalcState({
        selectedType: nextType,
        targetRaw: nextTarget,
      });
      await render();
    });
  }

  function bindKeysRefreshButton(refreshBtn) {
    if (!refreshBtn) return;
    refreshBtn.addEventListener("click", async () => {
      if (refreshBtn.disabled) return;
      refreshBtn.disabled = true;
      try {
        await ensureMarketData({ force: true });
        await render();
      } catch (_) {
        refreshBtn.textContent = t("ui.noApi", "No API");
        window.setTimeout(() => { refreshBtn.textContent = t("ui.refreshPrices", "Refresh prices"); }, 900);
      } finally {
        if (refreshBtn.isConnected) refreshBtn.disabled = false;
      }
    });
  }

  async function render() {
    const panel = document.getElementById("keysInline");
    const toggle = document.getElementById("keysToggle");
    if (!panel || !toggle || !toggle.checked) {
      clearKeysInlinePanel(panel);
      return;
    }

    injectStyleOnce();

    const { recipes, market } = await loadKeysPanelData();
    const { selectedDungeonKey, selectedRecipe, autoSelected } = resolveKeysSelectedRecipe(recipes);

    panel.innerHTML = `
      <div class="keysShell">
        ${zoneCardsHtml(recipes, market, selectedDungeonKey)}
        <div class="keysPlannerShell">${plannerShellHtml(selectedRecipe)}</div>
      </div>
    `;
    panel.hidden = false;

    bindZoneCardButtons(panel, recipes, market);
    renderPlannerShell(panel, selectedRecipe, recipes, market);
    if (autoSelected && selectedDungeonKey) {
      window.setTimeout(() => {
        if (getSelectedDungeonKey()) return;
        selectDungeon(selectedDungeonKey);
      }, 0);
    }
  }

  function bind() {
    const toggle = document.getElementById("keysToggle");
    const panel = document.getElementById("keysInline");
    if (!toggle || !panel) return;

    const keyImportShared = getKeyPricingImportShared();
    if (typeof keyImportShared?.registerProvider === "function") {
      keyImportShared.registerProvider({
        ensureImportedPricing: ensureImportedPricingForDungeon,
        getCachedImportedPricing: getCachedImportedPricingForDungeon,
      });
    }
    void buildRecipesFromInit(KEY_TYPE_ENTRY).catch(() => null);
    void buildRecipesFromInit(KEY_TYPE_CHEST).catch(() => null);

    const apply = () => {
      document.body.classList.toggle("keys-active", !!toggle.checked);
      if (!toggle.checked) {
        clearKeysInlinePanel(panel);
        return;
      }
      render();
    };

    toggle.addEventListener("change", apply);
    document.addEventListener("site:lang-changed", () => {
      recipeCache = null;
      if (toggle.checked) void render();
    });
    document.addEventListener("dungeon:selection-changed", () => {
      if (!toggle.checked) return;
      if (!panel.querySelector(".keysShell")) {
        void render();
        return;
      }
      const recipes = recipeCache?.[normalizeKeyType(ensureCalcState().selectedType)] || [];
      const { selectedDungeonKey, selectedRecipe, autoSelected } = resolveKeysSelectedRecipe(recipes);
      updateZoneCardSelection(panel, selectedDungeonKey);
      renderPlannerShell(panel, selectedRecipe, recipes, getCachedMarketData());
      if (autoSelected && selectedDungeonKey) {
        window.setTimeout(() => {
          if (getSelectedDungeonKey()) return;
          selectDungeon(selectedDungeonKey);
        }, 0);
      }
    });
    apply();

    window.KeysInline = {
      render,
      isActive: () => !!toggle.checked,
      ensurePlannerOpen,
      importPlannerPayload,
      getRelevantPricingHrids,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();

