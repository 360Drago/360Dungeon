(function () {
  // ===== Storage keys =====
  const KEY_COUNTS = "dungeon.simCounts";
  const KEY_LOOT_COUNTS = "dungeon.lootCounts";
  const KEY_SELECTED_DUNGEON = "dungeon.selectedDungeon";
  const KEY_SELECTED_TIER = "dungeon.selectedTier";
  const KEY_PRICING_MODEL = "dungeon.pricingModel";
  const KEY_ADVANCED_MODE = "dungeon.advancedMode";
  const KEY_LOOT_OVERRIDE_ENABLED = "dungeon.lootOverrideEnabled";
  const KEY_LOOT_PRICE_OVERRIDES = "dungeon.lootPriceOverrides";
  const KEY_FOOD_PER_DAY = "dungeon.foodPerDay";
  const KEY_ZONE_COMPARE_FOOD = "dungeon.zoneCompare.food.v3";
  const KEY_ZONE_COMPARE_MINUTES = "dungeon.zoneCompare.minutes.v3";
  const KEY_FOOD_PER_DAY_BY_CONTEXT = "dungeon.foodPerDayByContext.v1";
  const DEFAULT_FOOD_PER_DAY = "10m";
  const KEY_RANGE_ENABLED = "dungeon.rangeEnabled";


  const KEY_OFFICIAL_REFRESH = "dungeon.officialLastRefresh";
  const KEY_OTHER_REFRESH = "dungeon.otherLastRefresh";
  const KEY_OFFICIAL_SOURCE_REFRESH = "dungeon.officialSourceRefresh.v1";
  const KEY_OTHER_SOURCE_REFRESH = "dungeon.otherSourceRefresh.v1";
  const KEY_OFFICIAL_PRICES = "dungeon.officialPrices"; // per-dungeon
  const KEY_OTHER_PRICES = "dungeon.otherPrices";       // per-dungeon (mooket)

  // Pricing endpoints
  const PRICE_API = {
    official: "https://www.milkywayidle.com/game_data/marketplace.json",
    mooket: "https://mooket.qi-e.top/market/api.json",
  };
  const API_FETCH_CACHE_TTL_MS = 20 * 1000;
  const apiFetchCache = {
    official: { at: 0, result: null },
    mooket: { at: 0, result: null },
  };
  const apiFetchInFlight = {
    official: null,
    mooket: null,
  };

  // Auto-refresh cadence for official API: hourly with +/- 10 minutes randomness
  const OFFICIAL_REFRESH_BASE_MS = 60 * 60 * 1000;
  const OFFICIAL_REFRESH_JITTER_MS = 10 * 60 * 1000;


  const KEY_MANUAL = "dungeon.manualInputs";
  const KEY_RUN_INPUTS = "dungeon.runInputs";
  const KEY_RUN_INPUTS_BY_CONTEXT = "dungeon.runInputsByContext.v1";

  const KEY_PANEL_OPEN = "dungeon.panelOpen"; // remembers open/closed panel states

  // ===== Elements =====
  const brand = document.getElementById("brand");
  const advModeToggle = document.getElementById("advMode");
  const tokenShopToggle = document.getElementById("tokenShopToggle");
  const keysToggle = document.getElementById("keysToggle");
  const zoneCompareToggle = document.getElementById("zoneCompareToggle");

  const cards = Array.from(document.querySelectorAll(".card"));
  const selectionBar = document.getElementById("selectionBar");
  const barMarker = document.getElementById("barMarker");

  const tierButtons = Array.from(document.querySelectorAll(".tierBtn"));
  const tierHint = document.getElementById("tierHint");
  const ALLOWED_DUNGEON_KEYS = new Set(
    cards.map((card) => String(card?.dataset?.dungeon || "").trim().toLowerCase()).filter(Boolean)
  );
  const ALLOWED_TIER_KEYS = new Set(
    tierButtons.map((btn) => String(btn?.dataset?.tier || "").trim().toUpperCase()).filter(Boolean)
  );

  function sanitizeSelectedDungeonKey(raw) {
    const key = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!key) return "";
    return ALLOWED_DUNGEON_KEYS.has(key) ? key : "";
  }

  function sanitizeSelectedTierKey(raw) {
    const tier = String(raw == null ? "" : raw).trim().toUpperCase();
    if (!tier) return "";
    return ALLOWED_TIER_KEYS.has(tier) ? tier : "";
  }

  function sanitizePricingModel(raw) {
    const model = String(raw == null ? "" : raw).trim().toLowerCase();
    return normalizeModelFromSource(model);
  }

  const selectionSummary = document.getElementById("selectionSummary");
  const quickStartHint = document.getElementById("quickStartHint");
  const resetBtn = document.getElementById("resetBtn");

  // Status stack
  const statusDungeon = document.getElementById("statusDungeon");
  const statusTier = document.getElementById("statusTier");
  const statusPricing = document.getElementById("statusPricing");
  const statusClear = document.getElementById("statusClear");
  const statusBuff = document.getElementById("statusBuff");

  // Panels
  const panels = Array.from(document.querySelectorAll(".panel.accordion"));
  const pricingPanel = document.querySelector('.panel.accordion[data-panel="pricing"]');
  const runPanel = document.querySelector('.panel.accordion[data-panel="run"]');

  const pricingSummaryLine = document.getElementById("pricingSummaryLine");
  const pricingPill = document.getElementById("pricingPill");
  const runSummaryLine = document.getElementById("runSummaryLine");
  const runPill = document.getElementById("runPill");

  // Pricing
  const pricingCards = Array.from(document.querySelectorAll(".choiceCard"));
  const pricingRadios = Array.from(document.querySelectorAll('input[name="pricing"]'));

  const officialAge = document.getElementById("officialAge");
  const officialRefreshStamp = document.getElementById("officialRefreshStamp");
  const officialRefreshBtn = document.getElementById("officialRefreshBtn");

  const otherRefreshBtn = document.getElementById("otherRefreshBtn");
  const otherStatus = document.getElementById("otherStatus");
  const apiSourceTag = document.getElementById("apiSourceTag");
  const apiSourceLines = Array.from(document.querySelectorAll("#apiSourceTag .apiSourceLine"));
  const apiSourceOfficialLabel = document.getElementById("apiSourceOfficialLabel");
  const apiSourceOfficialValue = document.getElementById("apiSourceOfficialValue");
  const apiSourceOtherLabel = document.getElementById("apiSourceOtherLabel");
  const apiSourceOtherValue = document.getElementById("apiSourceOtherValue");

  const manualEntry = document.getElementById("manualEntry");
  const manualChest = document.getElementById("manualChest");
  const manualEntryErr = document.getElementById("manualEntryErr");
  const manualChestErr = document.getElementById("manualChestErr");

  const manualEntrySlider = document.getElementById("manualEntrySlider");
  const manualChestSlider = document.getElementById("manualChestSlider");

  // Run inputs
  const clearTime = document.getElementById("clearTime");
  const clearTimeErr = document.getElementById("clearTimeErr");
  const playerBuff = document.getElementById("playerBuff");
  const playerBuffErr = document.getElementById("playerBuffErr");
  const playerBuffValue = document.getElementById("playerBuffValue");
  // Simple mode (non-advanced) quick inputs + results
  const simpleStage = document.getElementById("simpleStage");
  const simpleBuffCustom = document.getElementById("simpleBuffCustom");
  const simpleBuffErr = document.getElementById("simpleBuffErr");
  const simpleBuffValue = document.getElementById("simpleBuffValue");
  const simpleClearTime = document.getElementById("simpleClearTime");
  const simpleClearTimeErr = document.getElementById("simpleClearTimeErr");
  const simpleSimulateBtn = document.getElementById("simpleSimulateBtn");

  const simplePricingLine = document.getElementById("simplePricingLine");
  const simpleOfficialRefreshBtn = document.getElementById("simpleOfficialRefreshBtn");

  const simpleResultsCard = document.getElementById("simpleResultsCard");
  const simpleEntryKeys = document.getElementById("simpleEntryKeys");
  const simpleChestKeys = document.getElementById("simpleChestKeys");
  const simpleRunsPerDay = document.getElementById("simpleRunsPerDay");
  const simpleDungeonIcon = document.getElementById("simpleDungeonIcon");
  const simpleEntryKeyIcon = document.getElementById("simpleEntryKeyIcon");
  const simpleChestKeyIcon = document.getElementById("simpleChestKeyIcon");
  const simpleProfitBox = document.getElementById("simpleProfitBox");
  const simpleProfitDay = document.getElementById("simpleProfitDay");
  const simpleProfitHour = document.getElementById("simpleProfitHour");
  const simpleResultsSub = document.getElementById("simpleResultsSub");

  // Advanced results (advanced tab)
  const advResultsCard = document.getElementById("advResultsCard");
  const advEntryKeys = document.getElementById("advEntryKeys");
  const advChestKeys = document.getElementById("advChestKeys");
  const advRunsPerDay = document.getElementById("advRunsPerDay");
  const advDungeonIcon = document.getElementById("advDungeonIcon");
  const advEntryKeyIcon = document.getElementById("advEntryKeyIcon");
  const advChestKeyIcon = document.getElementById("advChestKeyIcon");
  const advProfitBox = document.getElementById("advProfitBox");
  const advProfitDay = document.getElementById("advProfitDay");
  const advProfitHour = document.getElementById("advProfitHour");
  const advResultsSub = document.getElementById("advResultsSub");
  const advToggleRange = document.getElementById("advToggleRange");
  const advFoodPerDay = document.getElementById("advFoodPerDay");


  // Manual loot price overrides (advanced-only)
  const lootOverrideSection = document.getElementById("lootOverrideSection");
  const lootOverrideToggle = document.getElementById("lootOverrideToggle");
  const lootOverrideToggleHost = document.getElementById("lootOverrideToggleHost");
  const lootOverrideFilter = document.getElementById("lootOverrideFilter");
  const lootOverrideResetBtn = document.getElementById("lootOverrideResetBtn");
  const lootOverrideList = document.getElementById("lootOverrideList");
  const lootOverrideHint = document.getElementById("lootOverrideHint");

  // Simulate
  const simulateBtn = document.getElementById("simulateBtn");
  // ===== Cow Peek Easter Egg =====
  const COW_PEEK_CHANCE = 0.12; // 12% chance per successful simulate click
  const cowPeekTimers = new WeakMap();

  function ensureBtnWrappedWithCow(btn) {
    if (!btn) return null;

    // If already wrapped, just return the wrapper
    const existingWrap = btn.closest(".simBtnWrap");
    if (existingWrap) return existingWrap;

    // Create wrapper and move the button into it
    const wrap = document.createElement("div");
    wrap.className = "simBtnWrap";

    const parent = btn.parentNode;
    parent.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    // Create cow layer behind the button
    const layer = document.createElement("div");
    layer.className = "cowPeekLayer";
    layer.setAttribute("aria-hidden", "true");

    const burst = document.createElement("div");
    burst.className = "cowPeekBurst";

    const img = document.createElement("img");
    img.className = "cowPeekImg";
    img.alt = "";
    img.src = "./assets/Svg/Cow.svg";

    layer.appendChild(burst);
    layer.appendChild(img);

    // Put layer behind the button (lower z-index; wrapper handles stacking)
    wrap.insertBefore(layer, btn);

    return wrap;
  }

  function maybeCowPeek(btn) {
    if (!btn) return;
    if (Math.random() > COW_PEEK_CHANCE) return;

    const wrap = ensureBtnWrappedWithCow(btn);
    if (!wrap) return;

    // Restart animation cleanly
    wrap.classList.remove("cow-peek");
    // Force reflow so animation can retrigger
    void wrap.offsetWidth;
    wrap.classList.add("cow-peek");

    const prev = cowPeekTimers.get(wrap);
    if (prev) window.clearTimeout(prev);
    const t = window.setTimeout(() => {
      wrap.classList.remove("cow-peek");
    }, 950);
    cowPeekTimers.set(wrap, t);
  }

  const toast = document.getElementById("toast");

  // Easter egg walker elements
  const eggWalker = document.getElementById("eggWalker");
  const eggWalkerImg = document.getElementById("eggWalkerImg");

  // Simulation Overview loot UI
  const lootEntryIcon = document.getElementById("lootEntryIcon");
  const lootChestKeyIcon = document.getElementById("lootChestKeyIcon");
  const lootChestIcon = document.getElementById("lootChestIcon");
  const lootRefinedIcon = document.getElementById("lootRefinedIcon");

  const lootEntryQty = document.getElementById("lootEntryQty");
  const lootChestKeyQty = document.getElementById("lootChestKeyQty");
  const lootChestQty = document.getElementById("lootChestQty");
  const lootRefinedQty = document.getElementById("lootRefinedQty");

  const lootRefinedBox = document.getElementById("lootRefinedBox");

  const lootEntryEach = document.getElementById("lootEntryEach");
  const lootEntryTotal = document.getElementById("lootEntryTotal");
  const lootChestKeyEach = document.getElementById("lootChestKeyEach");
  const lootChestKeyTotal = document.getElementById("lootChestKeyTotal");
  const lootChestEv = document.getElementById("lootChestEv");
  const lootTokenValue = document.getElementById("lootTokenValue");
  const lootRefinedChestEv = document.getElementById("lootRefinedChestEv");


  // Dungeon-specific walker sprite pool
  const WALKER_SVGS = {
    sinister_circus: ["./assets/Svg/Deranged_jester.svg"],
    enchanted_fortress: [
      "./assets/Svg/Enchanted_king.svg",
      "./assets/Svg/Enchanted_queen.svg"
    ],
    chimerical_den: ["./assets/Svg/Griffin.svg"],
    pirate_cove: ["./assets/Svg/The_kraken.svg"],
  };

  // Marketplace HRIDs for the entry key + chest key (used by official & mooket APIs)
  const MARKET_HRIDS = {
    chimerical_den: { entry: "/items/chimerical_entry_key", chestKey: "/items/chimerical_chest_key" },
    enchanted_fortress: { entry: "/items/enchanted_entry_key", chestKey: "/items/enchanted_chest_key" },
    pirate_cove: { entry: "/items/pirate_entry_key", chestKey: "/items/pirate_chest_key" },
    sinister_circus: { entry: "/items/sinister_entry_key", chestKey: "/items/sinister_chest_key" },
  };

  function marketHridsForDungeon(dungeonKey) {
    const shared = getDungeonMetaShared();
    if (shared && typeof shared.marketHridsForUiKey === "function") {
      const hrids = shared.marketHridsForUiKey(dungeonKey);
      if (hrids) return hrids;
    }
    return MARKET_HRIDS[dungeonKey] || null;
  }


  // ===== Helpers =====
  function safeJSONParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function getShared(name) {
    return window[name] || null;
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function storageCall(methodName, ...args) {
    const method = getStorageShared()?.[methodName];
    if (typeof method === "function") return method(...args);
    return localStorage[methodName](...args);
  }

  function getPricingStateShared() {
    return getShared("DungeonPricingStateShared");
  }

  function getPricingRefreshShared() {
    return getShared("DungeonPricingRefreshShared");
  }

  function getSelectionUiShared() {
    return getShared("DungeonSelectionUiShared");
  }

  function getUiStateShared() {
    return getShared("DungeonUiStateShared");
  }

  function getNumberShared() {
    return getShared("DungeonNumberShared");
  }

  function getPlayerInputShared() {
    return getShared("DungeonPlayerInputShared");
  }

  function getDungeonMetaShared() {
    return getShared("DungeonMetaShared");
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

  function storageGetJson(key, fallback) {
    const shared = getStorageShared();
    if (shared && typeof shared.getJson === "function") {
      return shared.getJson(key, fallback, safeJSONParse);
    }
    return safeJSONParse(storageGetItem(key), fallback);
  }

  function storageSetJson(key, value) {
    const shared = getStorageShared();
    if (shared && typeof shared.setJson === "function") {
      shared.setJson(key, value);
      return;
    }
    storageCall("setItem", key, JSON.stringify(value));
  }

  function loadLootPriceOverrides() {
    const obj = storageGetJson(KEY_LOOT_PRICE_OVERRIDES, {});
    if (!obj || typeof obj !== 'object') return {};
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) { cleaned[k] = Math.round(v); continue; }
      if (v && typeof v === 'object') {
        const mode = (typeof v.mode === 'string') ? v.mode : null;
        const price = (typeof v.price === 'number' && Number.isFinite(v.price)) ? Math.round(v.price) : undefined;
        if (mode === 'Bid' || mode === 'Ask') cleaned[k] = { mode };
        else if (mode === 'Custom' && typeof price === 'number') cleaned[k] = { mode: 'Custom', price };
        continue;
      }
    }
    return cleaned;
  }

  function saveLootPriceOverrides(map) {
    try {
      storageSetJson(KEY_LOOT_PRICE_OVERRIDES, map || {});
    } catch { /* ignore */ }
  }

  function setLootOverrideEnabled(on) {
    lootOverrideEnabled = !!on;
    try { storageSetItem(KEY_LOOT_OVERRIDE_ENABLED, lootOverrideEnabled ? "1" : "0"); } catch { /* ignore */ }
    if (lootOverrideToggle) lootOverrideToggle.checked = lootOverrideEnabled;
    if (lootOverrideSection) lootOverrideSection.classList.toggle("isOn", lootOverrideEnabled);
    if (lootOverrideToggleHost) {
      lootOverrideToggleHost.dataset.tip = lootOverrideEnabled
        ? i18nT("ui.toggleOff", "Toggle off")
        : i18nT("ui.toggleOn", "Toggle on");
    }
  }

  function getActiveLootOverrides() {
    if (!lootOverrideEnabled) return null;
    return lootPriceOverrides || {};
  }

  function buildMarketSlimFromJson(json, hridList) {
    const out = {};
    for (const hrid of (hridList || [])) {
      const ab = extractAskBidFromMarketJson(json, hrid);
      if (Number.isFinite(ab.ask) || Number.isFinite(ab.bid)) {
        out[hrid] = { a: ab.ask ?? null, b: ab.bid ?? null };
      }
    }
    return out;
  }

  function mergeDungeonSnapshot(store, dungeonKey, snapshot) {
    const base = (store && typeof store === "object") ? store : {};
    base[dungeonKey] = {
      ...(base[dungeonKey] || {}),
      ...(snapshot || {}),
    };
    return base;
  }

  async function computeDungeonEvSafe({ dungeonKey, marketData, sourceLabel }) {
    if (!marketData || !window.DungeonChestEV?.computeDungeonChestEV) return null;
    try {
      const ev = await window.DungeonChestEV.computeDungeonChestEV({
        dungeonKey,
        marketData,
        side: "bid",
      });
      if (ev?.missingItems?.length) console.warn("[EV missing items]", dungeonKey, ev.missingItems);
      return ev;
    } catch (e) {
      console.warn(`EV compute failed (${sourceLabel}):`, e);
      return null;
    }
  }

  async function buildMarketSlimSafe({ dungeonKey, sourceLabel, marketJson, marketData, hrids }) {
    if (!window.DungeonChestEV?.getEvRelevantHrids || !marketData) return null;
    try {
      const evHrids = await window.DungeonChestEV.getEvRelevantHrids(dungeonKey, marketData);
      const want = new Set([...(evHrids || []), hrids.entry, hrids.chestKey]);
      return buildMarketSlimFromJson(marketJson, Array.from(want));
    } catch (e) {
      console.warn(`Failed to build marketSlim (${sourceLabel}):`, e);
      return null;
    }
  }

  function resolveDungeonKeyPricesFromMarket(json, hrids) {
    const entryAB = extractAskBidFromMarketJson(json, hrids.entry);
    const chestAB = extractAskBidFromMarketJson(json, hrids.chestKey);

    // Use ASK (buy price). If ask is missing, fall back to BID.
    const entry = entryAB.ask ?? entryAB.bid;
    const chestKey = chestAB.ask ?? chestAB.bid;

    return { entryAB, chestAB, entry, chestKey };
  }


  function getEffectiveApiSource(model = pricingModel) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getEffectiveApiSource === "function") {
      return shared.getEffectiveApiSource(model);
    }
    if (model === "other") return "other";
    if (model === "manual") return "official";
    return "official";
  }

  function getSavedByApiSource(apiSource) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getSavedByApiSource === "function") {
      return shared.getSavedByApiSource(apiSource, { officialSaved, otherSaved });
    }
    return apiSource === "other" ? otherSaved : officialSaved;
  }

  function getSavedRecordByModel(dungeonKey, model = pricingModel) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getSavedRecordByModel === "function") {
      return shared.getSavedRecordByModel({ dungeonKey, model, officialSaved, otherSaved });
    }
    const saved = getSavedByApiSource(getEffectiveApiSource(model));
    return getSavedRecordFromMap(saved, dungeonKey);
  }

  function getMarketSlimForSelected() {
    return getSavedRecordByModel(selectedDungeon)?.marketSlim || null;
  }

  function getDefaultUnitPrice(hrid) {
    const slim = getMarketSlimForSelected();
    const e = slim?.[hrid];
    if (!e) return null;
    if (typeof e.b === "number") return e.b;
    if (typeof e.a === "number") return e.a;
    return null;
  }

  function getMarketShared() {
    return getShared("DungeonMarketShared");
  }

  function getTimeShared() {
    return getShared("DungeonTimeShared");
  }

  function getTextShared() {
    return getShared("DungeonTextShared");
  }

  async function fetchOfficialMarketplaceJson() {
    return fetchApiSourceJsonCached("official", async () => {
      const fetchWithFallback = getMarketShared()?.fetchWithProxyFallback;
      if (typeof fetchWithFallback !== "function") return { json: null, usedProxy: false };
      return fetchWithFallback(PRICE_API.official, 12000);
    });
  }

  async function fetchMooketJson() {
    return fetchApiSourceJsonCached("mooket", async () => {
      const fetchWithFallback = getMarketShared()?.fetchWithProxyFallback;
      if (typeof fetchWithFallback !== "function") return { json: null, usedProxy: false };
      return fetchWithFallback(PRICE_API.mooket, 12000);
    });
  }

  function readApiFetchCache(apiSource) {
    const bucket = apiFetchCache[apiSource];
    if (!bucket || !bucket.result) return null;
    if ((Date.now() - bucket.at) > API_FETCH_CACHE_TTL_MS) return null;
    return bucket.result;
  }

  function fetchApiSourceJsonCached(apiSource, fetcher) {
    const cached = readApiFetchCache(apiSource);
    if (cached) return Promise.resolve(cached);
    if (apiFetchInFlight[apiSource]) return apiFetchInFlight[apiSource];

    const run = (async () => {
      const result = await fetcher();
      apiFetchCache[apiSource] = {
        at: Date.now(),
        result,
      };
      return result;
    })().finally(() => {
      apiFetchInFlight[apiSource] = null;
    });

    apiFetchInFlight[apiSource] = run;
    return run;
  }

  function extractAskBidFromMarketJson(json, hrid) {
    const extractor = getMarketShared()?.extractAskBidFromMarketJson;
    if (typeof extractor === "function") return extractor(json, hrid);
    return { ask: null, bid: null };
  }

  function loadPerDungeonPrices(key) {
    const obj = storageGetJson(key, {});
    return (obj && typeof obj === "object") ? obj : {};
  }

  function savePerDungeonPrices(key, obj) {
    storageSetJson(key, obj || {});
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    scheduleApiSourceFooterVisibility();
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toast.classList.remove("show");
      scheduleApiSourceFooterVisibility();
    }, 1500);
  }

  function i18nT(key, fallback) {
    const translate = getTextShared()?.t;
    if (typeof translate === "function") return translate(key, fallback);
    return fallback;
  }

  function i18nF(key, fallback, vars = {}) {
    const translateFormat = getTextShared()?.tf;
    if (typeof translateFormat === "function") return translateFormat(key, fallback, vars);
    return String(fallback || "");
  }

  function normalizeApiPayloadTimestamp(raw) {
    const text = String(raw == null ? "" : raw).trim();
    return text || "";
  }

  function parseApiPayloadTimestampMs(raw) {
    const text = normalizeApiPayloadTimestamp(raw);
    if (!text) return 0;
    if (/^\d+(\.\d+)?$/.test(text)) {
      const num = Number(text);
      if (Number.isFinite(num) && num > 0) {
        return num < 1000000000000 ? Math.round(num * 1000) : Math.round(num);
      }
    }
    const direct = Date.parse(text);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const normalizedIso = text.replace(" UTC", "Z").replace(" ", "T");
    const fallback = Date.parse(normalizedIso);
    return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
  }

  function formatApiPayloadTimestamp(raw) {
    const text = normalizeApiPayloadTimestamp(raw);
    if (!text) return "—";
    const ts = parseApiPayloadTimestampMs(text);
    if (!ts) return text;
    const date = new Date(ts);
    const now = new Date();
    const opts = (date.getFullYear() === now.getFullYear())
      ? { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }
      : { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true };
    return date.toLocaleString([], opts);
  }

  function getStoredApiPayloadTimestamp(storageKey) {
    return normalizeApiPayloadTimestamp(storageGetItem(storageKey));
  }

  let apiSourceFooterVisibilityRaf = 0;
  let apiSourceFooterResizeObserver = null;

  function withOverlayMeasurement(el, options, reader) {
    if (!(el instanceof Element) || typeof reader !== "function") return null;
    if (el.hidden) return null;
    const opts = (options && typeof options === "object") ? options : {};
    const hiddenClassName = String(opts.hiddenClassName || "").trim();
    const includeTransparent = !!opts.includeTransparent;
    const hadHiddenClass = !!(hiddenClassName && el.classList.contains(hiddenClassName));
    const previousVisibility = el.style.visibility;
    if (hadHiddenClass) el.classList.remove(hiddenClassName);
    el.style.visibility = "hidden";
    try {
      const style = window.getComputedStyle(el);
      if (style.display === "none") return null;
      if (!includeTransparent) {
        if (style.visibility === "hidden") return null;
        if (Number(style.opacity || "1") <= 0.02) return null;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return null;
      return reader({ el, rect, style });
    } finally {
      el.style.visibility = previousVisibility;
      if (hadHiddenClass) el.classList.add(hiddenClassName);
    }
  }

  function isApiSourceFooterInlineMode() {
    return document.documentElement.classList.contains("mobile-compat");
  }

  function hasDirectVisibleTextNode(el) {
    if (!(el instanceof Element)) return false;
    return Array.from(el.childNodes || []).some((node) => {
      if (node?.nodeType !== Node.TEXT_NODE) return false;
      return !!String(node.textContent || "").replace(/\s+/g, " ").trim();
    });
  }

  function isMeaningfulApiFooterOverlapElement(el) {
    if (!(el instanceof Element)) return false;
    if (el.closest("#apiSourceTag")) return false;
    if (el.closest("#eggWalker")) return false;
    const tag = String(el.tagName || "").toUpperCase();
    if (tag === "HTML" || tag === "BODY" || el.id === "brand" || el.id === "heroHeader") return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || "1") <= 0.02) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    if (el.id === "creatorTag" || el.id === "toast" || el.id === "calcErrorBanner") return true;
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA|LABEL|A|IMG|SVG|TABLE|TD|TH)$/.test(tag)) return true;
    if (hasDirectVisibleTextNode(el) && /^(DIV|P|SPAN|H1|H2|H3|H4|H5|H6|LI|STRONG|SMALL)$/.test(tag)) return true;
    return false;
  }

  function apiSourceFooterWouldOverlapContent() {
    if (!apiSourceTag || apiSourceTag.hidden) return false;
    if (isApiSourceFooterInlineMode()) return false;
    return !!withOverlayMeasurement(apiSourceTag, { hiddenClassName: "is-hidden", includeTransparent: true }, ({ rect }) => {
      const inset = 4;
      const left = Math.max(0, rect.left + inset);
      const right = Math.min(window.innerWidth - 1, rect.right - inset);
      const top = Math.max(0, rect.top + inset);
      const bottom = Math.min(window.innerHeight - 1, rect.bottom - inset);
      const points = [
        [left, top],
        [right, top],
        [left, bottom],
        [right, bottom],
        [Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2)), Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2))],
      ];
      try {
        for (const [x, y] of points) {
          const stack = document.elementsFromPoint(x, y);
          for (const el of stack) {
            if (isMeaningfulApiFooterOverlapElement(el)) return true;
          }
        }
      } catch (_) {
        return false;
      }
      return false;
    });
  }

  function getBottomOverlayReserveForElement(el, minReserve = 0) {
    const hiddenClassName = (el === apiSourceTag) ? "is-hidden" : "";
    const measuredReserve = withOverlayMeasurement(el, {
      hiddenClassName,
      includeTransparent: el === apiSourceTag,
    }, ({ rect, style }) => {
      const bottom = Number.parseFloat(style.bottom || "0");
      const reserve = Math.ceil(rect.height + (Number.isFinite(bottom) ? bottom : 0) + 10);
      return reserve;
    });
    return Math.max(minReserve, measuredReserve || 0);
  }

  function getApiSourceFooterReserveBottom() {
    const footerReserve = isApiSourceFooterInlineMode()
      ? 0
      : getBottomOverlayReserveForElement(apiSourceTag, 56);
    const creatorReserve = getBottomOverlayReserveForElement(getCreatorTagElement(), 0);
    return Math.max(footerReserve, creatorReserve, 0);
  }

  function applyApiSourceFooterReserve() {
    const root = document.documentElement;
    const reserveBottom = getApiSourceFooterReserveBottom();
    if (reserveBottom > 0) {
      root.style.setProperty("--api-source-reserve-bottom", `${reserveBottom}px`);
    } else {
      root.style.removeProperty("--api-source-reserve-bottom");
    }
  }

  function applyApiSourceFooterVisibility() {
    if (!apiSourceTag) return;
    if (apiSourceTag.hidden) {
      apiSourceTag.classList.remove("is-hidden");
      return;
    }
    if (isApiSourceFooterInlineMode()) {
      apiSourceTag.classList.remove("is-hidden");
      return;
    }
    apiSourceTag.classList.toggle("is-hidden", apiSourceFooterWouldOverlapContent());
  }

  function scheduleApiSourceFooterVisibility() {
    if (apiSourceFooterVisibilityRaf) window.cancelAnimationFrame(apiSourceFooterVisibilityRaf);
    apiSourceFooterVisibilityRaf = window.requestAnimationFrame(() => {
      apiSourceFooterVisibilityRaf = 0;
      applyApiSourceFooterReserve();
      applyApiSourceFooterVisibility();
    });
  }

  function bindApiSourceFooterVisibility() {
    if (!apiSourceTag || apiSourceTag.dataset.visibilityBound === "1") return;
    apiSourceTag.dataset.visibilityBound = "1";
    window.addEventListener("resize", scheduleApiSourceFooterVisibility, { passive: true });
    window.addEventListener("scroll", scheduleApiSourceFooterVisibility, { passive: true });
    document.addEventListener("dungeon:selection-changed", () => { window.setTimeout(scheduleApiSourceFooterVisibility, 80); });
    document.addEventListener("site:lang-changed", () => { window.setTimeout(scheduleApiSourceFooterVisibility, 20); });
    if (typeof ResizeObserver === "function") {
      apiSourceFooterResizeObserver = new ResizeObserver(() => scheduleApiSourceFooterVisibility());
      const wrap = document.querySelector("main.wrap");
      if (wrap) apiSourceFooterResizeObserver.observe(wrap);
      apiSourceFooterResizeObserver.observe(apiSourceTag);
    }
    if (document.fonts?.ready) document.fonts.ready.then(scheduleApiSourceFooterVisibility).catch(() => { });
    window.setTimeout(scheduleApiSourceFooterVisibility, 120);
    window.setTimeout(scheduleApiSourceFooterVisibility, 420);
    scheduleApiSourceFooterVisibility();
  }

  function updateApiSourceFooter() {
    const showOfficial = pricingModel === "official";
    const showOther = pricingModel === "other";
    if (apiSourceTag) apiSourceTag.hidden = !(showOfficial || showOther);
    apiSourceLines.forEach((line) => {
      const isOfficial = line.contains(apiSourceOfficialLabel) || line.contains(apiSourceOfficialValue);
      const isOther = line.contains(apiSourceOtherLabel) || line.contains(apiSourceOtherValue);
      line.hidden = (isOfficial && !showOfficial) || (isOther && !showOther);
    });
    if (apiSourceOfficialLabel) apiSourceOfficialLabel.textContent = i18nT("ui.official", "Official");
    if (apiSourceOtherLabel) apiSourceOtherLabel.textContent = i18nT("ui.mooket", "Mooket");
    if (apiSourceOfficialValue) {
      apiSourceOfficialValue.textContent = formatApiPayloadTimestamp(getStoredApiPayloadTimestamp(KEY_OFFICIAL_SOURCE_REFRESH));
    }
    if (apiSourceOtherValue) {
      apiSourceOtherValue.textContent = formatApiPayloadTimestamp(getStoredApiPayloadTimestamp(KEY_OTHER_SOURCE_REFRESH));
    }
    scheduleApiSourceFooterVisibility();
  }

  function saveApiPayloadTimestamp(storageKey, raw) {
    const value = normalizeApiPayloadTimestamp(raw);
    if (value) storageSetItem(storageKey, value);
    else storageRemoveItem(storageKey);
    updateApiSourceFooter();
  }

  function getMissingMarketPriceItems(prices) {
    if (!prices || typeof prices !== "object") return [];
    const missing = [];
    const entryMissing = prices.entryAsk === -1 || prices.entryBid === -1;
    const chestMissing = prices.chestKeyAsk === -1 || prices.chestKeyBid === -1;
    if (entryMissing) missing.push(i18nT("ui.entryKey", "Entry Key"));
    if (chestMissing) missing.push(i18nT("ui.chestKey", "Chest Key"));
    return missing;
  }

  function buildMissingMarketPriceMessage(items) {
    if (!items || !items.length) return "";
    const list = items.join(` ${i18nT("ui.and", "and")} `);
    return i18nF(
      "ui.noMarketPriceMessage",
      "No market price for {items}. Please manually enter it in Advanced > Pricing model.",
      { items: list }
    );
  }

  function normalizeApiSourceFromLabel(sourceLabel) {
    return sourceLabel === "mooket" ? "other" : "official";
  }

  function dispatchPriceRefreshEvent(detail) {
    try {
      document.dispatchEvent(new CustomEvent("dungeon:prices-refreshed", { detail }));
    } catch (_) { }
  }

  function ensureProfitWarningBubble(boxEl) {
    if (!boxEl) return null;
    let bubble = boxEl.querySelector(".profitWarningBubble");
    if (bubble) return bubble;
    bubble = document.createElement("div");
    bubble.className = "profitWarningBubble";
    bubble.setAttribute("aria-live", "polite");
    boxEl.appendChild(bubble);
    return bubble;
  }

  function setProfitWarning(boxEl, message) {
    const bubble = ensureProfitWarningBubble(boxEl);
    if (!bubble) return;
    const text = String(message || "").trim();
    bubble.textContent = text;
    bubble.classList.toggle("show", !!text);
  }
  // ===== Loot icon mapping (update ITEMS_BASE if your folder name differs) =====
  const ITEMS_BASE = "./assets/Svg/";

  const DUNGEON_PREFIX = {
    chimerical_den: "Chimerical",
    sinister_circus: "Sinister",
    enchanted_fortress: "Enchanted",
    pirate_cove: "Pirate",
  };

  const ICONS_BASE = "./assets/Svg/";

  function dungeonIconPrefix(dungeonKey) {
    const shared = getDungeonMetaShared();
    if (shared && typeof shared.shortForUiKey === "function") {
      const short = shared.shortForUiKey(dungeonKey);
      if (short) return short[0].toUpperCase() + short.slice(1);
    }
    return DUNGEON_PREFIX[dungeonKey] || null;
  }

  function dungeonIconPath(dungeonKey) {
    const prefix = dungeonIconPrefix(dungeonKey);
    if (!prefix) return "";
    const suffix = String(dungeonKey).split("_").slice(1).join("_");
    return `${ICONS_BASE}${prefix}_${suffix}.svg`;
  }

  function setResultIcons(dungeonKey, dungeonIconEl, entryKeyIconEl, chestKeyIconEl) {
    const prefix = dungeonIconPrefix(dungeonKey);
    if (dungeonIconEl) {
      const src = dungeonIconPath(dungeonKey);
      if (src) dungeonIconEl.src = src;
    }
    if (prefix) {
      if (entryKeyIconEl) entryKeyIconEl.src = iconPath(prefix, "entry_key");
      if (chestKeyIconEl) chestKeyIconEl.src = iconPath(prefix, "chest_key");
    }
  }

  function iconPath(prefix, suffix) {
    return `${ITEMS_BASE}${prefix}_${suffix}.svg`;
  }

  function loadLootCounts() {
    const raw = storageGetItem(KEY_LOOT_COUNTS);
    const obj = safeJSONParse(raw, {});
    return (obj && typeof obj === "object") ? obj : {};
  }

  function saveLootCounts(v) {
    storageSetJson(KEY_LOOT_COUNTS, v);
  }

  function getLootForDungeon(dungeonKey) {
    const all = lootCounts || {};
    if (!all[dungeonKey]) {
      all[dungeonKey] = { entry: 0, chestKey: 0, chest: 0, refined: 0 };
    }
    return all[dungeonKey];
  }
  function fmtGold(n) {
    const formatter = getNumberShared()?.formatWholeNumber;
    if (typeof formatter === "function") return formatter(n, { invalidText: "-", mode: "round" });
    return "-";
  }

  function getFoodPerDayValue() {
    const raw = String(storageGetItem(KEY_ZONE_COMPARE_FOOD) || storageGetItem(KEY_FOOD_PER_DAY) || "");
    return parseFoodPerDay(raw.trim() || DEFAULT_FOOD_PER_DAY) || 0;
  }

  function computeProfitFromEvAndPrices({ chestCount, refinedCount, evBid, evAsk, prices, foodPerDay }) {
    const taxRate = Calc.getDefaultTaxRate();
    const { profitLow, profitHigh } = Calc.computeChestCenteredProfitRangeAfterTaxAndFood({
      chestCount,
      refinedCount,
      chestEvBid: evBid?.chestEv,
      chestEvAsk: evAsk?.chestEv,
      refinedEvBid: evBid?.refinedChestEv,
      refinedEvAsk: evAsk?.refinedChestEv,
      entryAsk: prices.entryAsk,
      entryBid: prices.entryBid,
      chestKeyAsk: prices.chestKeyAsk,
      chestKeyBid: prices.chestKeyBid,
      taxRate,
      foodPerDay,
    });

    const bidBidPoint = Calc.computeChestCenteredProfitPointAfterTaxAndFood({
      chestCount,
      refinedCount,
      chestEv: evBid?.chestEv,
      refinedEv: evBid?.refinedChestEv,
      entryPrice: prices.entryBid,
      chestKeyPrice: prices.chestKeyBid,
      taxRate,
      foodPerDay,
    });

    return { profitLow, profitHigh, bidBidProfit: bidBidPoint?.profit };
  }

  // Math helpers live in js/calculations.js
  const Calc = window.DungeonCalculations;
  if (!Calc) console.error("[landing.js] Missing window.DungeonCalculations. Add js/calculations.js before landing.js");

  function normalizeModelFromSource(source) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.normalizeModelFromSource === "function") {
      return shared.normalizeModelFromSource(source);
    }
    return (source === "manual" || source === "other") ? source : "official";
  }

/**
   * Returns { entry, chestKey } numeric prices or nulls
   * IMPORTANT: this expects these objects to exist:
   * - pricingModel (string: "official" | "manual" | "other")
   * - manualSaved.entry / manualSaved.chest (numbers)
   * - officialSaved.entry / officialSaved.chest (numbers)  (or adjust below)
   * - otherSaved.entry / otherSaved.chest (numbers)        (or adjust below)
   */

  function getActiveKeyPrices(dungeonKey) {
    // Always return something; never throw.
    let model =
      (typeof pricingModel !== "undefined" && pricingModel) ||
      (typeof KEY_PRICING_MODEL !== "undefined" ? storageGetItem(KEY_PRICING_MODEL) : null) ||
      "official";

    // Simple mode always uses Official API for pricing.
    if (!document.body.classList.contains("advanced-mode")) model = "official";

    const dk = dungeonKey || (typeof selectedDungeon !== "undefined" ? selectedDungeon : "") || "";

    // helper: safely pull numbers from an object with common field names
    const pick = (obj, keys) => {
      if (!obj || typeof obj !== "object") return null;
      for (const k of keys) {
        const v = obj[k];
        if (Number.isFinite(v)) return v;
      }
      return null;
    };

    if (model === "manual") {
      const baseSaved = getSavedByApiSource(getEffectiveApiSource("manual"));
      const perDungeon = (baseSaved && typeof baseSaved === "object") ? baseSaved[dk] : null;
      const baseEntry = pick(perDungeon, ["entry", "entryKey", "entryPrice"]);
      const baseChest = pick(perDungeon, ["chestKey", "chest", "chestKeyPrice"]);
      const manualEntry = pick(typeof manualSaved !== "undefined" ? manualSaved : null, ["entry", "entryKey", "entryPrice"]);
      const manualChest = pick(typeof manualSaved !== "undefined" ? manualSaved : null, ["chest", "chestKey", "chestKeyPrice"]);
      return {
        entry: Number.isFinite(manualEntry) ? manualEntry : baseEntry,
        chestKey: Number.isFinite(manualChest) ? manualChest : baseChest,
      };
    }

    if (model === "other") {
      const perDungeon = (typeof otherSaved !== "undefined" && otherSaved) ? otherSaved[dk] : null;
      return {
        entry: pick(perDungeon, ["entry", "entryKey", "entryPrice"]),
        chestKey: pick(perDungeon, ["chestKey", "chest", "chestKeyPrice"]),
      };
    }

    // OFFICIAL (default)
    const perDungeon = (typeof officialSaved !== "undefined" && officialSaved) ? officialSaved[dk] : null;
    return {
      entry: pick(perDungeon, ["entry", "entryKey", "entryPrice"]),
      chestKey: pick(perDungeon, ["chestKey", "chest", "chestKeyPrice"]),
    };
  }


  function updateEachAndTotalsForDungeon(dungeonKey) {
    if (!dungeonKey) return;

    const data = getLootForDungeon(dungeonKey);
    const prices = getActiveKeyPrices(dungeonKey); // returns { entry, chestKey }

    const entryEach = prices?.entry ?? null;
    const chestEach = prices?.chestKey ?? null;

    if (typeof lootEntryEach !== "undefined" && lootEntryEach) {
      lootEntryEach.textContent = fmtGold(entryEach);
    }
    if (typeof lootEntryTotal !== "undefined" && lootEntryTotal) {
      lootEntryTotal.textContent = (entryEach == null) ? "-" : fmtGold(entryEach * (data.entry || 0));
    }

    if (typeof lootChestKeyEach !== "undefined" && lootChestKeyEach) {
      lootChestKeyEach.textContent = fmtGold(chestEach);
    }
    if (typeof lootChestKeyTotal !== "undefined" && lootChestKeyTotal) {
      lootChestKeyTotal.textContent = (chestEach == null) ? "-" : fmtGold(chestEach * (data.chestKey || 0));
    }

  }

  function formatCoinsCompact(v) {
    const formatter = getNumberShared()?.formatCoinsCompact;
    if (typeof formatter === "function") return formatter(v);
    return "-";
  }

  function clamp01(x) {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(1, x));
  }

  function clearProfitTint(boxEl) {
    if (!boxEl) return;
    boxEl.classList.remove("profitTinted", "is-profit-pos", "is-profit-neg");
    [
      "--profitBoxBg",
      "--profitBoxBorder",
      "--profitBoxGlow",
      "--profitValueColor",
      "--profitMetaColor",
    ].forEach((name) => boxEl.style.removeProperty(name));
  }

  function setProfitTintFromLow(lowProfitPerDay, boxEl = simpleProfitBox) {
    if (!boxEl) return;
    clearProfitTint(boxEl);
    if (!Number.isFinite(lowProfitPerDay)) return;

    const abs = Math.abs(lowProfitPerDay);
    if (abs < 1_000_000) return;
    const isLightTheme = document.documentElement?.dataset?.theme === "light";

    if (lowProfitPerDay > 0) {
      const start = 5_000_000;
      const full = 220_000_000;
      const rawT = clamp01((lowProfitPerDay - start) / (full - start));
      const t = Math.pow(rawT, 1.9);
      boxEl.classList.add("profitTinted", "is-profit-pos");
      boxEl.style.setProperty("--profitBoxBorder", `rgba(34, 197, 94, ${0.14 + (0.60 * t)})`);
      boxEl.style.setProperty("--profitBoxBg", `rgba(34, 197, 94, ${0.05 + (0.23 * t)})`);
      boxEl.style.setProperty("--profitBoxGlow", `0 0 0 1px rgba(34, 197, 94, ${0.08 + (0.18 * t)}) inset, 0 0 28px rgba(34, 197, 94, ${0.04 + (0.22 * t)})`);
      boxEl.style.setProperty("--profitValueColor", isLightTheme
        ? `color-mix(in srgb, #16a34a ${Math.round(42 + (58 * t))}%, var(--title-color))`
        : `color-mix(in srgb, #22c55e ${Math.round(18 + (82 * t))}%, var(--title-color))`);
      boxEl.style.setProperty("--profitMetaColor", isLightTheme
        ? `color-mix(in srgb, #166534 ${Math.round(18 + (54 * t))}%, var(--title-color))`
        : `color-mix(in srgb, #bbf7d0 ${Math.round(10 + (56 * t))}%, var(--muted-color))`);
      return;
    }

    const start = 3_000_000;
    const full = 140_000_000;
    const rawT = clamp01((abs - start) / (full - start));
    const t = Math.pow(rawT, 1.7);
    boxEl.classList.add("profitTinted", "is-profit-neg");
    boxEl.style.setProperty("--profitBoxBorder", `rgba(251, 113, 133, ${0.18 + (0.62 * t)})`);
    boxEl.style.setProperty("--profitBoxBg", `rgba(239, 68, 68, ${0.06 + (0.22 * t)})`);
    boxEl.style.setProperty("--profitBoxGlow", `0 0 0 1px rgba(251, 113, 133, ${0.10 + (0.16 * t)}) inset, 0 0 28px rgba(239, 68, 68, ${0.05 + (0.22 * t)})`);
    boxEl.style.setProperty("--profitValueColor", isLightTheme
      ? `color-mix(in srgb, #e11d48 ${Math.round(38 + (62 * t))}%, var(--title-color))`
      : `color-mix(in srgb, #fb7185 ${Math.round(22 + (78 * t))}%, var(--title-color))`);
    boxEl.style.setProperty("--profitMetaColor", isLightTheme
      ? `color-mix(in srgb, #9f1239 ${Math.round(16 + (56 * t))}%, var(--title-color))`
      : `color-mix(in srgb, #fecdd3 ${Math.round(12 + (54 * t))}%, var(--muted-color))`);
  }







  function updateLootOverview() {
    if (!selectedDungeon) return;

    const prefix = dungeonIconPrefix(selectedDungeon);
    if (!prefix) return;

    // Set icons based on selected dungeon
    if (lootEntryIcon) lootEntryIcon.src = iconPath(prefix, "entry_key");
    if (lootChestKeyIcon) lootChestKeyIcon.src = iconPath(prefix, "chest_key");
    if (lootChestIcon) lootChestIcon.src = iconPath(prefix, "chest");
    if (lootRefinedIcon) lootRefinedIcon.src = iconPath(prefix, "refinement_chest");

    // Update quantities (stored totals)
    const data = getLootForDungeon(selectedDungeon);
    if (lootEntryQty) lootEntryQty.textContent = String(data.entry || 0);
    if (lootChestKeyQty) lootChestKeyQty.textContent = String(data.chestKey || 0);
    if (lootChestQty) lootChestQty.textContent = String(data.chest || 0);
    if (lootRefinedQty) lootRefinedQty.textContent = String(data.refined || 0);
    if (typeof updateEachAndTotalsForDungeon === "function") {
      updateEachAndTotalsForDungeon(selectedDungeon);
    }

    // Grey out refined chest on T0
    const refinedDisabled = (selectedTier === "T0");
    const refinedDashed = (selectedTier === "T1");

    if (lootRefinedBox) {
      lootRefinedBox.classList.toggle("is-disabled", refinedDisabled);
      lootRefinedBox.classList.toggle("is-dashed", refinedDashed);

      // Tooltip: only on T1
      if (refinedDashed && !refinedDisabled) {
        lootRefinedBox.dataset.tip = i18nT("ui.drop33", "~33% drop rate");
      } else {
        lootRefinedBox.dataset.tip = "";
      }

      // Avoid native browser tooltip
      lootRefinedBox.title = "";
    }

  }

  function playSimFeedback(card) {
    if (!card) return;

    // Restart bump animation
    card.classList.remove("bump");
    void card.offsetWidth; // force reflow to restart animation
    card.classList.add("bump");
    window.setTimeout(() => card.classList.remove("bump"), 320);

    // "+1" pop (place it right after the number)
    const wrap = card.querySelector(".simCountWrap") || card;

    const existing = wrap.querySelector(".plusOne");
    if (existing) existing.remove();

    const plus = document.createElement("span");
    plus.className = "plusOne";
    plus.textContent = "+1";
    wrap.appendChild(plus);

    plus.addEventListener("animationend", () => plus.remove(), { once: true });

  }

  function setBodyStage(stageDungeon, stageTier) {
    const shared = getUiStateShared();
    if (shared && typeof shared.setBodyStage === "function") {
      shared.setBodyStage(stageDungeon, stageTier);
      return;
    }
    document.body.classList.toggle("stage-dungeon", !!stageDungeon);
    document.body.classList.toggle("stage-tier", !!stageTier);
  }

  function isInlineTopPanelActive() {
    return !!(
      (tokenShopToggle && tokenShopToggle.checked) ||
      (keysToggle && keysToggle.checked) ||
      (zoneCompareToggle && zoneCompareToggle.checked)
    );
  }

  function setRootAccentFromCard(card) {
    if (!card) return;
    const accent = getComputedStyle(card).getPropertyValue("--card-accent").trim();
    if (accent) document.documentElement.style.setProperty("--accent", accent);
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function updateMarkerPosition() {
    const selectedCard = document.querySelector(".card.is-selected");
    if (!selectedCard || !selectionBar || !barMarker) return;

    const barRect = selectionBar.getBoundingClientRect();
    const cardRect = selectedCard.getBoundingClientRect();

    const center = cardRect.left + cardRect.width / 2;
    const desiredW = clamp(cardRect.width * 0.58, 72, 150);
    const left = center - barRect.left - desiredW / 2;

    barMarker.style.width = `${desiredW}px`;
    barMarker.style.left = `${left}px`;
  }
  // ===== Easter egg walker =====
  let eggTimeout = null;
  let eggRunning = false;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function cancelEasterEgg() {
    if (eggTimeout) clearTimeout(eggTimeout);
    eggTimeout = null;
    eggRunning = false;

    if (eggWalker) {
      eggWalker.classList.remove("show");
      eggWalker.style.transform = "translateX(-200px)";
    }
  }

  function canRunEasterEgg() {
    if (!eggWalker || !eggWalkerImg) return false;
    if (!selectedDungeon) return false;

    // Only run once the user is fully "in" (dungeon + tier)
    if (!document.body.classList.contains("stage-tier")) return false;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

    return true;
  }

  function setWalkerForDungeon(dungeonKey) {
    const list = WALKER_SVGS[dungeonKey];
    if (!list || !list.length) return false;

    const src = list[Math.floor(Math.random() * list.length)];
    eggWalkerImg.src = src;
    return true;
  }


  async function walkBetween(fromX, toX, direction /* "left" | "right" */) {
    if (!eggWalker) return;

    eggWalker.classList.add("show");

    // Your SVGs face LEFT by default:
    // - moving LEFT => normal (scaleX(1))
    // - moving RIGHT => flipped (scaleX(-1))
    eggWalkerImg.style.transform = direction === "left" ? "scaleX(1)" : "scaleX(-1)";

    // Random speed
    const speed = rand(90, 140); // px/sec

    // Random pauses (1-3)
    const pauseCount = Math.floor(rand(1, 4));
    const pauseFracs = Array.from({ length: pauseCount }, () => rand(0.18, 0.82)).sort((a, b) => a - b);

    let currentX = fromX;

    // Ensure it starts exactly at fromX
    eggWalker.style.transform = `translateX(${fromX}px)`;

    for (let i = 0; i <= pauseFracs.length; i++) {
      const frac = i < pauseFracs.length ? pauseFracs[i] : 1;
      const targetX = fromX + (toX - fromX) * frac;

      const segDist = Math.abs(targetX - currentX);
      const segDur = (segDist / speed) * 1000;

      await eggWalker.animate(
        [{ transform: `translateX(${currentX}px)` }, { transform: `translateX(${targetX}px)` }],
        { duration: Math.max(80, segDur), easing: "linear", fill: "forwards" }
      ).finished;

      currentX = targetX;

      // Pause (except at the end)
      if (i < pauseFracs.length) {
        await sleep(rand(450, 1200));
      }
    }

    // Keep the final position "real" in case next move starts immediately
    eggWalker.style.transform = `translateX(${toX}px)`;
  }


  async function runEasterEggOnce() {
    if (!canRunEasterEgg()) return;
    if (eggRunning) return;

    const ok = setWalkerForDungeon(selectedDungeon);
    if (!ok) return;

    eggRunning = true;

    try {
      const w = eggWalker.getBoundingClientRect().width || 78;
      const padding = 40;

      // Start OFFSCREEN on the RIGHT
      const startX = window.innerWidth + w + padding;

      // Pick a random visible "turnaround" point (so the direction change is seen)
      const minX = 40;
      const maxX = Math.max(60, window.innerWidth - w - 40);
      let midX = rand(window.innerWidth * 0.18, window.innerWidth * 0.55);
      midX = Math.max(minX, Math.min(maxX, midX));

      // End OFFSCREEN on the RIGHT (walk back out)
      const endX = window.innerWidth + w + padding;

      // Walk RIGHT -> LEFT (they face left by default)
      await walkBetween(startX, midX, "left");

      // Pause + turn around (visible flip)
      await sleep(rand(600, 1400));
      eggWalkerImg.style.transform = "scaleX(-1)"; // now facing right
      await sleep(220);

      // Walk LEFT -> RIGHT back offscreen
      await walkBetween(midX, endX, "right");

      await sleep(150);
      if (eggWalker) eggWalker.classList.remove("show");
    } finally {
      eggRunning = false;
    }
  }


  function scheduleEasterEgg() {
    cancelEasterEgg();
    if (!canRunEasterEgg()) return;

    // Random delay before appearing
    const delay = rand(9000, 22000);
    eggTimeout = setTimeout(() => {
      runEasterEggOnce();
    }, delay);
  }

  function formatAge(ms) {
    const format = getTimeShared()?.formatAge;
    if (typeof format === "function") return format(ms, { style: "compact" });
    return "-";
  }

  function formatStamp(ts) {
    const format = getTimeShared()?.formatStamp;
    if (typeof format === "function") return format(ts);
    return "";
  }

  // Accept: 600,000 / 600000 / 600k / 6m (case-insensitive)
  function parseCompactNumber(input) {
    const parser = getNumberShared()?.parseCompactNumber;
    if (typeof parser === "function") return parser(input);
    return null;
  }

  function normalizeFoodPerDayInput(input) {
    const normalizer = getNumberShared()?.normalizeFoodPerDayInput;
    if (typeof normalizer === "function") return normalizer(input);
    return input == null ? "" : String(input).trim();
  }

  function parseFoodPerDay(input) {
    const parser = getNumberShared()?.parseFoodPerDay;
    if (typeof parser === "function") return parser(input);
    return null;
  }

  function isRecordObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeManualSavedState(raw) {
    const obj = isRecordObject(raw) ? raw : {};
    const entryRaw = obj.entryRaw == null ? "" : String(obj.entryRaw);
    const chestRaw = obj.chestRaw == null ? "" : String(obj.chestRaw);
    const parsedEntry = parseCompactNumber(entryRaw);
    const parsedChest = parseCompactNumber(chestRaw);
    const fallbackEntry = obj.entry;
    const fallbackChest = obj.chest;
    return {
      entryRaw,
      chestRaw,
      entry: parsedEntry !== null ? parsedEntry : (Number.isFinite(fallbackEntry) ? fallbackEntry : null),
      chest: parsedChest !== null ? parsedChest : (Number.isFinite(fallbackChest) ? fallbackChest : null),
    };
  }

  function normalizeRunSavedByContextMap(raw) {
    if (!isRecordObject(raw)) return {};
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
      const safeKey = String(key || "").trim();
      if (!safeKey) continue;
      out[safeKey] = normalizeRunSaved(value);
    }
    return out;
  }

  function normalizeFoodSavedByContextMap(raw) {
    if (!isRecordObject(raw)) return {};
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
      const safeKey = String(key || "").trim();
      if (!safeKey) continue;
      const normalized = normalizeFoodPerDayInput(value);
      if (normalized) out[safeKey] = normalized;
    }
    return out;
  }

  function assertUsableMarketPayload(json, marketData) {
    if (isRecordObject(json) && isRecordObject(marketData)) return;
    throw new Error(i18nT("ui.invalidApiPayload", "Invalid API payload."));
  }

  function niceDungeonName(key) {
    if (!key) return "-";
    const shared = getDungeonMetaShared();
    if (shared && typeof shared.displayNameForUiKey === "function") {
      const mapped = shared.displayNameForUiKey(key);
      if (mapped && mapped !== key) return mapped;
    }
    return key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // ===== Accordion panels =====
  function getPanelKey(panelName) {
    return `${KEY_PANEL_OPEN}.${panelName}`;
  }

  function isPanelOpen(panelEl) {
    const shared = getUiStateShared();
    if (shared && typeof shared.isPanelOpen === "function") {
      return shared.isPanelOpen(panelEl);
    }
    return panelEl.classList.contains("is-open");
  }

  function setPanelOpen(panelEl, open) {
    const shared = getUiStateShared();
    if (shared && typeof shared.setPanelOpen === "function") {
      shared.setPanelOpen(panelEl, open);
      return;
    }
    panelEl.classList.toggle("is-open", !!open);
    const toggle = panelEl.querySelector(".panelToggle");
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function persistPanelOpenState(panelName, open) {
    storageSetItem(getPanelKey(panelName), open ? "1" : "0");
  }

  function setPanelOpenAndPersist(panelEl, panelName, open) {
    if (!panelEl) return;
    const resolvedName = panelName || panelEl.getAttribute("data-panel") || "unknown";
    setPanelOpen(panelEl, open);
    persistPanelOpenState(resolvedName, open);
  }

  function ensureRunPanelOpen() {
    if (runPanel && !isPanelOpen(runPanel)) {
      setPanelOpenAndPersist(runPanel, "run", true);
    }
  }

  function togglePanel(panelEl) {
    const open = !isPanelOpen(panelEl);
    setPanelOpenAndPersist(panelEl, panelEl.getAttribute("data-panel"), open);
  }

  panels.forEach((panel) => {
    const btn = panel.querySelector(".panelToggle");
    if (btn) btn.addEventListener("click", () => togglePanel(panel));
  });

  // ===== Counts =====
  function loadCounts() {
    const raw = storageGetItem(KEY_COUNTS);
    const obj = safeJSONParse(raw, {});
    return typeof obj === "object" && obj ? obj : {};
  }

  function saveCounts(counts) {
    storageSetJson(KEY_COUNTS, counts);
  }

  function updateCountsUI(counts) {
    const nodes = document.querySelectorAll("[data-count-for]");
    nodes.forEach((el) => {
      const key = el.getAttribute("data-count-for");
      const v = Number(counts[key] || 0);
      el.textContent = String(v);
    });
  }

  // ===== State =====
  let counts = loadCounts();
  updateCountsUI(counts);

  let lootCounts = loadLootCounts();

  window.setTimeout(() => {
    if (typeof updateLootOverview === "function") updateLootOverview();
  }, 0);


  let selectedDungeon = sanitizeSelectedDungeonKey(storageGetItem(KEY_SELECTED_DUNGEON));
  let selectedTier = sanitizeSelectedTierKey(storageGetItem(KEY_SELECTED_TIER));
  let pricingModel = sanitizePricingModel(storageGetItem(KEY_PRICING_MODEL));
  if (!selectedDungeon) selectedTier = "";
  let runSavedByContext = normalizeRunSavedByContextMap(storageGetJson(KEY_RUN_INPUTS_BY_CONTEXT, {}));
  let foodSavedByContext = normalizeFoodSavedByContextMap(storageGetJson(KEY_FOOD_PER_DAY_BY_CONTEXT, {}));

  function runContextKey(dungeonKey = selectedDungeon, tierKey = selectedTier) {
    const d = String(dungeonKey || "").trim();
    const t = String(tierKey || "").trim();
    return (d && t) ? `${d}::${t}` : "";
  }

  function normalizeRunSaved(raw) {
    const obj = (raw && typeof raw === "object") ? raw : {};
    const clearRaw = obj.clearTime == null ? "" : String(obj.clearTime);
    const buffRaw = obj.buff == null ? "20" : String(obj.buff);
    return { clearTime: clearRaw, buff: buffRaw };
  }

  function loadSharedZoneMinutesMap() {
    const obj = storageGetJson(KEY_ZONE_COMPARE_MINUTES, {});
    return (obj && typeof obj === "object") ? obj : {};
  }

  function getSharedClearTimeForContext(dungeonKey = selectedDungeon, tierKey = selectedTier) {
    const dk = String(dungeonKey || "").trim();
    const tk = String(tierKey || "").trim();
    if (!dk || !tk) return "";
    const all = loadSharedZoneMinutesMap();
    return String(all?.[dk]?.[tk] ?? "");
  }

  function setSharedClearTimeForContext(raw, dungeonKey = selectedDungeon, tierKey = selectedTier) {
    const dk = String(dungeonKey || "").trim();
    const tk = String(tierKey || "").trim();
    if (!dk || !tk) return;
    const all = loadSharedZoneMinutesMap();
    if (!all[dk] || typeof all[dk] !== "object") all[dk] = { T0: "", T1: "", T2: "" };
    all[dk][tk] = String(raw == null ? "" : raw);
    storageSetJson(KEY_ZONE_COMPARE_MINUTES, all);
  }

  const LEGACY_RUN_INPUT_DEFAULT = normalizeRunSaved(storageGetJson(KEY_RUN_INPUTS, { clearTime: "", buff: "20" }));
  const LEGACY_FOOD_PER_DAY_DEFAULT = normalizeFoodPerDayInput(storageGetItem(KEY_FOOD_PER_DAY) || "") || DEFAULT_FOOD_PER_DAY;

  function getRunSavedForCurrentContext(fallback = LEGACY_RUN_INPUT_DEFAULT) {
    const key = runContextKey();
    if (key && runSavedByContext[key] && typeof runSavedByContext[key] === "object") {
      return normalizeRunSaved(runSavedByContext[key]);
    }
    return normalizeRunSaved(fallback);
  }

  function getFoodSavedForCurrentContext() {
    const key = runContextKey();
    if (key && typeof foodSavedByContext[key] === "string" && String(foodSavedByContext[key]).trim()) {
      return normalizeFoodPerDayInput(foodSavedByContext[key]);
    }
    return LEGACY_FOOD_PER_DAY_DEFAULT;
  }

  function applyContextInputsFromSelection() {
    const nextRun = getRunSavedForCurrentContext();
    nextRun.clearTime = getSharedClearTimeForContext(selectedDungeon, selectedTier);
    runSaved = nextRun;
    if (clearTime) clearTime.value = String(nextRun.clearTime || "");
    if (playerBuff) playerBuff.value = String(nextRun.buff || "20");
    if (simpleClearTime) simpleClearTime.value = String(nextRun.clearTime || "");
    updateRangeUI(playerBuff, playerBuffValue);
    if (simpleBuffCustom) {
      setRangeValueAndRefresh(simpleBuffCustom, simpleBuffValue, String(nextRun.buff || "20"));
    }

    const nextFood = normalizeFoodPerDayInput(
      storageGetItem(KEY_ZONE_COMPARE_FOOD) || storageGetItem(KEY_FOOD_PER_DAY) || ""
    ) || DEFAULT_FOOD_PER_DAY;
    const foodEls = [document.getElementById("foodPerDay"), advFoodPerDay].filter(Boolean);
    foodEls.forEach((el) => { el.value = nextFood; });
    storageSetItem(KEY_FOOD_PER_DAY, nextFood);
    storageSetItem(KEY_ZONE_COMPARE_FOOD, nextFood);
  }

  function ensureSelectedDungeon(opts = {}) {
    const silent = !!opts.silent;
    const message = opts.message || i18nT("ui.pickDungeonFirst", "Pick a dungeon first.");
    if (selectedDungeon) return true;
    if (!silent) showToast(message);
    return false;
  }

  function ensureSelectedTier(opts = {}) {
    const silent = !!opts.silent;
    const message = opts.message || i18nT("ui.pickTierFirst", "Pick a tier first.");
    if (selectedTier) return true;
    if (!silent) showToast(message);
    return false;
  }

  function getFirstAvailableDungeonKey() {
    const cardMatch = cards.find((card) => sanitizeSelectedDungeonKey(card?.dataset?.dungeon));
    if (cardMatch) return sanitizeSelectedDungeonKey(cardMatch.dataset.dungeon);
    const fallbackKey = Object.keys(MARKET_HRIDS || {}).find((key) => sanitizeSelectedDungeonKey(key));
    return sanitizeSelectedDungeonKey(fallbackKey);
  }

  function autoSelectFirstDungeonForTokenShop() {
    const tokenOn = !!(tokenShopToggle && tokenShopToggle.checked);
    if (!tokenOn || selectedDungeon) return false;
    const nextDungeon = getFirstAvailableDungeonKey();
    if (!nextDungeon) return false;
    setSelectedDungeon(nextDungeon, { fromUser: false });
    return true;
  }

  // Manual loot price overrides (global across all dungeons)
  let lootOverrideEnabled = storageGetItem(KEY_LOOT_OVERRIDE_ENABLED) === "1";
  let lootPriceOverrides = loadLootPriceOverrides();
  let lootOverrideItemsCache = []; // current dungeon items (for reset/filter)
  let landingResetSuppressedUntil = 0;



  // Advanced mode (UI toggle only for now)
  let advancedMode = storageGetItem(KEY_ADVANCED_MODE) === "1";
  function resetResultsCardState(opts = {}) {
    const {
      resultsCardEl,
      profitDayEl,
      profitHourEl,
      entryKeysEl,
      chestKeysEl,
      runsEl,
      profitBoxEl,
      subEl,
      subText,
    } = opts;
    if (resultsCardEl) resultsCardEl.hidden = true;
    if (profitDayEl) profitDayEl.textContent = "-";
    if (profitHourEl) profitHourEl.textContent = "-";
    if (entryKeysEl) entryKeysEl.textContent = "-";
    if (chestKeysEl) chestKeysEl.textContent = "-";
    if (runsEl) runsEl.textContent = "-";
    if (subEl && typeof subText === "string") subEl.textContent = subText;
    if (profitBoxEl) profitBoxEl.dataset.tip = "";
    setProfitWarning(profitBoxEl, "");
    setProfitTintFromLow(NaN, profitBoxEl);
  }

  function setAdvancedMode(on, opts = {}) {
    const save = (opts.save !== false);
    advancedMode = !!on;

    // Prevent panel flash: normalize panel states before revealing advanced UI.
    if (advancedMode) {
      // First-time default: advanced mode starts with range view enabled.
      const savedRange = storageGetItem(KEY_RANGE_ENABLED);
      if (savedRange !== "1" && savedRange !== "0") {
        const rangeToggles = [document.getElementById("toggleRange"), advToggleRange].filter(Boolean);
        rangeToggles.forEach((el) => { el.checked = true; });
        storageSetItem(KEY_RANGE_ENABLED, "1");
      }
      if (pricingPanel) {
        setPanelOpenAndPersist(pricingPanel, "pricing", false);
      }
    } else {
      // When leaving advanced mode, clear advanced results so simple mode starts clean.
      resetResultsCardState({
        resultsCardEl: advResultsCard,
        profitDayEl: advProfitDay,
        profitHourEl: advProfitHour,
        entryKeysEl: advEntryKeys,
        chestKeysEl: advChestKeys,
        runsEl: advRunsPerDay,
        profitBoxEl: advProfitBox,
      });
    }

    document.body.classList.toggle("advanced-mode", advancedMode);
    window.DungeonAdvancedMode = advancedMode;

    // If no dungeon is selected, keep landing stage while toggling advanced.
    if (!selectedDungeon) {
      applyLandingStage();
    }


    if (advModeToggle) advModeToggle.checked = advancedMode;
    if (save) storageSetItem(KEY_ADVANCED_MODE, advancedMode ? "1" : "0");
  }

  // Initialize checkbox state + listener
  if (advModeToggle) {
    advModeToggle.checked = advancedMode;
    advModeToggle.addEventListener("change", () => setAdvancedMode(advModeToggle.checked));
  }

  function renderInlinePanels(opts = {}) {
    try { window.TokenShopInline && window.TokenShopInline.render(opts); } catch (_) { }
    try { window.KeysInline && window.KeysInline.render(); } catch (_) { }
    try { window.ZoneCompareInline && window.ZoneCompareInline.render(); } catch (_) { }
  }

  function clearInlinePanels() {
    const tokenPanel = document.getElementById("tokenShopInline");
    const keysPanel = document.getElementById("keysInline");
    const zonePanel = document.getElementById("zoneCompareInline");
    hideAndClearElement(tokenPanel);
    hideAndClearElement(keysPanel);
    hideAndClearElement(zonePanel);
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

  function syncInlineModeBodyClasses() {
    const tokenOn = !!(tokenShopToggle && tokenShopToggle.checked);
    const keysOn = !!(keysToggle && keysToggle.checked);
    const zoneOn = !!(zoneCompareToggle && zoneCompareToggle.checked);
    document.body.classList.toggle("token-shop-active", tokenOn);
    document.body.classList.toggle("keys-active", keysOn);
    document.body.classList.toggle("zone-compare-active", zoneOn);
  }

  function applyInlineModePostToggle() {
    syncInlineModeBodyClasses();
    if (autoSelectFirstDungeonForTokenShop()) return;
    // Recompute stage classes so quick/advanced panels hide/show correctly when top inline tools change.
    if (selectedDungeon) applySelectedStage(selectedTier);
    else applyLandingStage();
    updateMarkerPosition();
    applyContextInputsFromSelection();
    validateAndSavePlayerInputs();
    updateAllSummaries();
    renderInlinePanels();
  }

  function disableAdvancedModeIfEnabled() {
    if (!advModeToggle || !advModeToggle.checked) return;
    advModeToggle.checked = false;
    setAdvancedMode(false);
  }

  function refreshEvAndInlinePanels() {
    updateChestEvUI();
    renderInlinePanels();
  }

  function refreshSummariesAndEvPanels() {
    updateAllSummaries();
    refreshEvAndInlinePanels();
  }

  function tierStageVisible(hasTierSelection) {
    return isInlineTopPanelActive() ? false : !!hasTierSelection;
  }

  function uncheckZoneCompareWithEvent() {
    if (!zoneCompareToggle || !zoneCompareToggle.checked) return;
    zoneCompareToggle.checked = false;
    zoneCompareToggle.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Mutually exclusive: Advanced, Token Shop, Keys, and Zone Compare
  if (advModeToggle && tokenShopToggle && keysToggle && zoneCompareToggle) {
    advModeToggle.addEventListener("change", () => {
      if (advModeToggle.checked) {
        document.body.classList.remove('token-shop-active', 'keys-active', 'zone-compare-active');
        // turn off token shop/keys if they were on
        if (tokenShopToggle.checked) {
          tokenShopToggle.checked = false;
        }
        if (keysToggle.checked) keysToggle.checked = false;
        uncheckZoneCompareWithEvent();
        clearInlinePanels();
      }
      applyInlineModePostToggle();
    });
    tokenShopToggle.addEventListener("change", () => {
      if (tokenShopToggle.checked) {
        if (keysToggle.checked) keysToggle.checked = false;
        uncheckZoneCompareWithEvent();
        disableAdvancedModeIfEnabled();
      }
      applyInlineModePostToggle();
    });
    keysToggle.addEventListener("change", () => {
      if (keysToggle.checked) {
        if (tokenShopToggle.checked) tokenShopToggle.checked = false;
        uncheckZoneCompareWithEvent();
        disableAdvancedModeIfEnabled();
      }
      applyInlineModePostToggle();
    });
    zoneCompareToggle.addEventListener("change", () => {
      if (zoneCompareToggle.checked) {
        if (tokenShopToggle.checked) tokenShopToggle.checked = false;
        if (keysToggle.checked) keysToggle.checked = false;
        disableAdvancedModeIfEnabled();
      }
      applyInlineModePostToggle();
    });
  }
  syncInlineModeBodyClasses();
  // Apply initial state without re-saving
  setAdvancedMode(advancedMode, { save: false });


  // Manual saved (store raw + parsed numeric)
  // API-saved prices (per dungeon)
  let officialSaved = loadPerDungeonPrices(KEY_OFFICIAL_PRICES);
  let otherSaved = loadPerDungeonPrices(KEY_OTHER_PRICES);
  let manualSaved = normalizeManualSavedState(storageGetJson(KEY_MANUAL, { entryRaw: "", chestRaw: "", entry: null, chest: null }));
  if (manualSaved && typeof manualSaved === "object") {
    if (manualEntry && manualSaved.entryRaw != null) manualEntry.value = manualSaved.entryRaw;
    if (manualChest && manualSaved.chestRaw != null) manualChest.value = manualSaved.chestRaw;
  }
  // Run inputs saved
  let runSaved = getRunSavedForCurrentContext();
  if (runSaved && typeof runSaved === "object") {
    if (clearTime && runSaved.clearTime !== undefined) clearTime.value = runSaved.clearTime;
    if (playerBuff && runSaved.buff !== undefined) playerBuff.value = runSaved.buff;
  }
    // Default combat buff to 20 for slider UX (migrates old empty values).
    const buffInitRaw = String(playerBuff?.value || "").trim();
    const buffInitNum = buffInitRaw === "" ? NaN : Number(buffInitRaw);
    const buffInitOk = Number.isFinite(buffInitNum) && buffInitNum >= 0 && buffInitNum <= 20;
    if (!buffInitOk) {
      if (playerBuff) playerBuff.value = "20";
      runSaved.buff = "20";
      storageSetJson(KEY_RUN_INPUTS, runSaved);
    }



  // Restore panel open states (collapsed by default)
  [pricingPanel, runPanel].forEach((p) => {
    if (!p) return;
    const name = p.getAttribute("data-panel");
    const raw = storageGetItem(getPanelKey(name));
    const open = raw === "1";
    setPanelOpen(p, open);
  });

  // ===== Pricing selection =====
  function ensureApiPricesForDungeon(dungeonKey, model = pricingModel) {
    if (!dungeonKey) return;
    const apiSource = getEffectiveApiSource(model);
    if (apiSource === "official" && !officialSaved?.[dungeonKey]) {
      refreshApiSourceForDungeon(dungeonKey, apiSource, { silent: true, reason: "auto" });
    }
    if (apiSource === "other" && !otherSaved?.[dungeonKey]) {
      refreshApiSourceForDungeon(dungeonKey, apiSource, { silent: true, reason: "auto" });
    }
  }

  function applyPricingSelectionUi(model) {
    pricingCards.forEach((c) => c.classList.remove("is-selected"));
    pricingRadios.forEach((r) => { r.checked = (r.value === model); });
    const selectedCard = pricingCards.find((c) => c.dataset.choice === model);
    if (selectedCard) selectedCard.classList.add("is-selected");
  }

  function syncOfficialAutoRefreshForModel(model = pricingModel) {
    if (getEffectiveApiSource(model) === "official") startOfficialAutoRefresh();
    else stopOfficialAutoRefresh();
  }

  function applyPricingSelection(model) {
    pricingModel = sanitizePricingModel(model);
    storageSetItem(KEY_PRICING_MODEL, pricingModel);

    applyPricingSelectionUi(pricingModel);

    updateAllSummaries();
    updatePricingAvailability();
    refreshEvAndInlinePanels();

    // Keep base API data available (manual mode uses this for non-key prices).
    syncOfficialAutoRefreshForModel(pricingModel);

    ensureApiPricesForDungeon(selectedDungeon, pricingModel);

    // Ask for next selection
    ensureRunPanelOpen();
    if (!String(clearTime.value || "").trim()) {
      openRunPanelAndFocusClearTime();
    }

    showToast(i18nT("ui.nextSetClearBuff", "Next: set clear time + combat buff."));
  }

  pricingCards.forEach((card) => {
    card.addEventListener("click", () => {
      applyPricingSelection(card.dataset.choice);
    });
  });



  // ===== Manual inputs validation + save =====
  function validateAndSaveManual() {
    const entryRaw = manualEntry ? manualEntry.value : "";
    const chestRaw = manualChest ? manualChest.value : "";

    const entry = parseCompactNumber(entryRaw);
    const chest = parseCompactNumber(chestRaw);

    const entryOk = entryRaw.trim() === "" || entry !== null;
    const chestOk = chestRaw.trim() === "" || chest !== null;

    if (manualEntryErr) manualEntryErr.classList.toggle("show", !entryOk);
    if (manualChestErr) manualChestErr.classList.toggle("show", !chestOk);

    // Sync sliders from typed values (do NOT overwrite what the user typed)
    if (manualEntrySlider && entry !== null) {
      const clamped = Math.max(0, Math.min(1000000, entry));
      const snapped = Math.round(clamped / 20000) * 20000;
      manualEntrySlider.value = String(snapped);
    }
    if (manualChestSlider && chest !== null) {
      const clamped = Math.max(1000000, Math.min(8000000, chest));
      const snapped = Math.round(clamped / 100000) * 100000;
      manualChestSlider.value = String(snapped);
    }

    manualSaved = normalizeManualSavedState({ entryRaw, chestRaw, entry, chest });
    storageSetJson(KEY_MANUAL, manualSaved);
    updateAllSummaries();
  }

  async function resetManualKeyInputsToOfficial() {
    if (!manualEntry || !manualChest) return;
    if (!selectedDungeon) {
      manualEntry.value = "";
      manualChest.value = "";
      validateAndSaveManual();
      return;
    }

    // Try to refresh first so reset mirrors current Official API values.
    try {
      await refreshOfficialPricesForDungeon(selectedDungeon, { silent: true, reason: "reset-manual" });
    } catch (_) { }

    const official = getOfficialKeyPricesAB(selectedDungeon);
    const entryAskValid = Number.isFinite(official.entryAsk) && official.entryAsk >= 0;
    const entryBidValid = Number.isFinite(official.entryBid) && official.entryBid >= 0;
    const chestAskValid = Number.isFinite(official.chestKeyAsk) && official.chestKeyAsk >= 0;
    const chestBidValid = Number.isFinite(official.chestKeyBid) && official.chestKeyBid >= 0;

    const entry = entryAskValid ? official.entryAsk : (entryBidValid ? official.entryBid : null);
    const chest = chestAskValid ? official.chestKeyAsk : (chestBidValid ? official.chestKeyBid : null);

    manualEntry.value = Number.isFinite(entry) ? Number(entry).toLocaleString() : "";
    manualChest.value = Number.isFinite(chest) ? Number(chest).toLocaleString() : "";
    validateAndSaveManual();
  }


  if (manualEntry) manualEntry.addEventListener("input", validateAndSaveManual);
  if (manualChest) manualChest.addEventListener("input", validateAndSaveManual);

  if (manualEntrySlider) {
    manualEntrySlider.addEventListener("input", () => {
      manualEntry.value = Number(manualEntrySlider.value).toLocaleString();
      validateAndSaveManual();
    });
  }

  if (manualChestSlider) {
    manualChestSlider.addEventListener("input", () => {
      manualChest.value = Number(manualChestSlider.value).toLocaleString();
      validateAndSaveManual();
    });
  }

  validateAndSaveManual();


  // ===== Run inputs save =====
  function parseClearAndBuffValues(clearRaw, buffRaw) {
    const parser = getPlayerInputShared()?.parseClearAndBuff;
    if (typeof parser === "function") return parser(clearRaw, buffRaw);
    return {
      ctRaw: String(clearRaw == null ? "" : clearRaw).trim(),
      buffRaw: String(buffRaw == null ? "" : buffRaw).trim(),
      ctNum: NaN,
      buffNum: NaN,
      ctOk: false,
      buffOk: false,
    };
  }

  function parsePositiveMinutesValue(raw) {
    const parser = getPlayerInputShared()?.parsePositiveMinutes;
    if (typeof parser === "function") return parser(raw);
    return { raw: String(raw == null ? "" : raw).trim(), num: NaN, ok: false };
  }

  function getPlayerParsed() {
    const ctRaw = (runSaved && runSaved.clearTime != null) ? String(runSaved.clearTime) : "";
    const buffRaw = (runSaved && runSaved.buff != null) ? String(runSaved.buff) : "";
    return parseClearAndBuffValues(ctRaw, buffRaw);
  }

  function validateAndSavePlayerInputs() {
    const parsed = parseClearAndBuffValues(clearTime?.value, playerBuff?.value);
    const { ctRaw, buffRaw, ctOk, buffOk } = parsed;
    // Minimal required highlight when clear time is empty
    if (clearTime) clearTime.classList.toggle("requiredInput", ctRaw === "");


    if (clearTimeErr) clearTimeErr.classList.toggle("show", ctRaw !== "" && !ctOk);
    if (playerBuffErr) playerBuffErr.classList.toggle("show", buffRaw !== "" && !buffOk);

    runSaved = { clearTime: ctRaw, buff: buffRaw };
    storageSetJson(KEY_RUN_INPUTS, runSaved);
    setSharedClearTimeForContext(ctRaw);
    const key = runContextKey();
    if (key) {
      runSavedByContext[key] = { clearTime: ctRaw, buff: buffRaw };
      storageSetJson(KEY_RUN_INPUTS_BY_CONTEXT, runSavedByContext);
    }
  }

  function savePlayerInputsAndSummaries() {
    validateAndSavePlayerInputs();
    updateAllSummaries();
  }

  function clearRunInputValues(opts = {}) {
    const includeSimple = !!opts.includeSimple;
    const clearAllContexts = !!opts.clearAllContexts;
    if (clearTime) clearTime.value = "";
    if (includeSimple && simpleClearTime) simpleClearTime.value = "";
    if (clearAllContexts) {
      runSavedByContext = {};
      storageSetJson(KEY_RUN_INPUTS_BY_CONTEXT, runSavedByContext);
      storageSetJson(KEY_ZONE_COMPARE_MINUTES, {});
    } else {
      setSharedClearTimeForContext("");
    }
    validateAndSavePlayerInputs();
  }

  function clearClearTimeInput() {
    if (!clearTime) return;
    clearRunInputValues({ includeSimple: true });
    updateAllSummaries();
    resetSimpleResults();

    if (advancedMode) {
      openRunPanelAndFocusClearTime();
    } else {
      focusSimpleClearTime();
    }
  }

  function focusAndSelectInput(inputEl) {
    if (!inputEl) return;
    window.requestAnimationFrame(() => {
      inputEl.focus();
      if (typeof inputEl.select === "function") inputEl.select();
    });
  }

  function openRunPanelAndFocusClearTime() {
    // Ensure Player Information is open
    ensureRunPanelOpen();

    // Focus the clear-time box so user can type immediately
    // Small delay so the panel can finish opening/layout
    focusAndSelectInput(clearTime);
  }

  function resetSimpleResults() {
    resetResultsCardState({
      resultsCardEl: simpleResultsCard,
      profitDayEl: simpleProfitDay,
      profitHourEl: simpleProfitHour,
      entryKeysEl: simpleEntryKeys,
      chestKeysEl: simpleChestKeys,
      runsEl: simpleRunsPerDay,
      profitBoxEl: simpleProfitBox,
      subEl: simpleResultsSub,
      subText: i18nT("ui.keysProfitPrediction", "Keys + profit prediction."),
    });
  }

  function clampCombatBuff(raw) {
    const clamp = getPlayerInputShared()?.clampCombatBuff;
    if (typeof clamp === "function") return clamp(raw);
    return { ok: false, num: 20 };
  }

  function updateRangeUI(rangeEl, valueEl) {
    if (!rangeEl) return;
    const parsed = clampCombatBuff(String(rangeEl.value || "").trim());
    const val = parsed.num;
    rangeEl.value = String(val);
    if (valueEl) valueEl.textContent = String(val);

    const min = Number(rangeEl.min || 0);
    const max = Number(rangeEl.max || 20);
    const pct = max > min ? ((val - min) / (max - min)) * 100 : 100;
    rangeEl.style.setProperty("--pct", `${pct}%`);
  }

  function setRangeValueAndRefresh(rangeEl, valueEl, value) {
    if (!rangeEl) return;
    rangeEl.value = String(value);
    updateRangeUI(rangeEl, valueEl);
  }

  function setSimpleBuffCustomEnabled(_on) {
    // Legacy shim: slider is always enabled; keep it synced with current run-input buff.
    if (!simpleBuffCustom) return;
    const current = String(playerBuff?.value || runSaved?.buff || "20");
    setRangeValueAndRefresh(simpleBuffCustom, simpleBuffValue, current);
  }

  function getSimpleBuffValue() {
    const raw = String(simpleBuffCustom?.value || "").trim();
    const parsed = clampCombatBuff(raw);

    if (simpleBuffErr) simpleBuffErr.classList.toggle("show", raw !== "" && !parsed.ok);
    return { ok: parsed.ok, value: parsed.num, raw: String(parsed.num) };
  }

  function getSimpleClearTimeValue() {
    const parsed = parsePositiveMinutesValue(simpleClearTime?.value || "");
    if (simpleClearTimeErr) simpleClearTimeErr.classList.toggle("show", parsed.raw !== "" && !parsed.ok);
    return { ok: parsed.ok, value: parsed.ok ? parsed.num : NaN, raw: parsed.raw };
  }

  function syncSimpleInputsToRunInputs() {
    if (!playerBuff || !clearTime) return;

    const buff = getSimpleBuffValue();
    const ct = getSimpleClearTimeValue();

    // Always mirror raw strings so validation behaves the same as advanced inputs.
    if (buff && buff.raw != null) playerBuff.value = String(buff.raw);
    updateRangeUI(playerBuff, playerBuffValue);
    if (ct && ct.raw != null) clearTime.value = String(ct.raw);

    savePlayerInputsAndSummaries();
  }

  function focusSimpleClearTime() {
    focusAndSelectInput(simpleClearTime);
  }

  function prepareSimpleInputsForTier() {
    // Keep quick + advanced inputs aligned with currently loaded context values.
    const buffNow = String(playerBuff?.value || runSaved?.buff || "20");
    setRangeValueAndRefresh(simpleBuffCustom, simpleBuffValue, buffNow);
    setRangeValueAndRefresh(playerBuff, playerBuffValue, buffNow);

    if (simpleClearTime && clearTime && String(clearTime.value || "").trim() !== "") {
      simpleClearTime.value = String(clearTime.value || "");
    }

    validateAndSavePlayerInputs();
    resetSimpleResults();
  }

  if (clearTime) {
    clearTime.addEventListener("input", () => { savePlayerInputsAndSummaries(); });
  }
  if (playerBuff) {
    playerBuff.addEventListener("input", () => {
      updateRangeUI(playerBuff, playerBuffValue);
      if (simpleBuffCustom) {
        setRangeValueAndRefresh(simpleBuffCustom, simpleBuffValue, String(playerBuff.value || "20"));
      }
      savePlayerInputsAndSummaries();
    });
  }

  // Simple mode listeners (keep the underlying run inputs in sync)

  if (simpleBuffCustom) {
    simpleBuffCustom.addEventListener("input", () => {
      updateRangeUI(simpleBuffCustom, simpleBuffValue);
      syncSimpleInputsToRunInputs();
      resetSimpleResults();
    });
  }
  if (simpleClearTime) {
    simpleClearTime.addEventListener("input", () => { syncSimpleInputsToRunInputs(); resetSimpleResults(); });
  }

  updateRangeUI(playerBuff, playerBuffValue);
  updateRangeUI(simpleBuffCustom, simpleBuffValue);
  validateAndSavePlayerInputs();

  function suppressLandingResetForManualLootToggle() {
    // Guard against scroll-intent reset firing while interacting with override controls.
    landingResetSuppressedUntil = Date.now() + 1600;
    landingReturnArmed = false;
    noScrollReturnArmedUntil = 0;
  }

  async function handleManualLootOverrideToggleChange() {
    if (!lootOverrideToggle) return;
    const enabled = !!lootOverrideToggle.checked;
    suppressLandingResetForManualLootToggle();

    if (enabled) {
      setLootOverrideEnabled(true);
      await renderLootOverrideList();
      scheduleOverrideEvRecompute();
      return;
    }

    // Toggle-off behavior: restore API-backed pricing state and close Player Information panel.
    setLootOverrideEnabled(false);
    if (lootOverrideFilter) lootOverrideFilter.value = "";
    lootPriceOverrides = {};
    saveLootPriceOverrides(lootPriceOverrides);

    await resetManualKeyInputsToOfficial();
    await renderLootOverrideList();
    updateChestEvUI();
    updateAllSummaries();

    if (runPanel) setPanelOpenAndPersist(runPanel, "run", false);
  }

  // ===== Manual loot override UI wiring =====
  if (lootOverrideToggle) {
    lootOverrideToggle.addEventListener("change", () => {
      void handleManualLootOverrideToggleChange();
    });
  }

  if (lootOverrideFilter) {
    lootOverrideFilter.addEventListener("input", () => {
      if (lootOverrideFilter._debounceT) window.clearTimeout(lootOverrideFilter._debounceT);
      lootOverrideFilter._debounceT = window.setTimeout(() => {
        lootOverrideFilter._debounceT = null;
        void renderLootOverrideList();
      }, 120);
    });
  }

  if (lootOverrideResetBtn) {
    lootOverrideResetBtn.addEventListener("click", async () => {
      if (!selectedDungeon) return;
      // Ensure cache is current
      await renderLootOverrideList({ keepScroll: true, ensureCache: true });

      const toClear = lootOverrideItemsCache
        .map((x) => x.hrid)
        .filter((x) => typeof x === "string" && x.startsWith("/items/"));

      if (!toClear.length) return;

      for (const hrid of toClear) delete lootPriceOverrides[hrid];
      saveLootPriceOverrides(lootPriceOverrides);

      renderLootOverrideList({ keepScroll: true });
      scheduleOverrideEvRecompute();
      showToast(i18nT("ui.overridesClearedDungeon", "Overrides cleared for this dungeon."));
    });
  }

  // Initial render state
  renderLootOverrideList();

  // ===== Official refresh timer =====
  function getOfficialRefreshTs() {
    const n = Number(storageGetItem(KEY_OFFICIAL_REFRESH));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function nextOfficialAutoDelayMs() {
    const jitter = (Math.random() * 2 - 1) * OFFICIAL_REFRESH_JITTER_MS; // [-jitter, +jitter]
    return Math.max(5 * 60 * 1000, OFFICIAL_REFRESH_BASE_MS + jitter);
  }

  let officialAutoTimer = null;
  function stopOfficialAutoRefresh() {
    if (officialAutoTimer) window.clearTimeout(officialAutoTimer);
    officialAutoTimer = null;
  }

  function refreshSelectedDungeonPanels(dungeonKey) {
    if (dungeonKey !== selectedDungeon) return;
    renderLootOverrideList({ keepScroll: true });
    refreshEvAndInlinePanels();
  }

  function applyPostPriceRefreshUpdates(dungeonKey) {
    updateEachAndTotalsForDungeon(dungeonKey);
    refreshSummariesAndEvPanels();
  }

  async function refreshApiPricesForDungeon(dungeonKey, opts, cfg) {
    const { silent = false } = opts || {};

    const refreshShared = getPricingRefreshShared();
    let hrids = null;
    if (refreshShared && typeof refreshShared.getDungeonHrids === "function") {
      hrids = refreshShared.getDungeonHrids(MARKET_HRIDS, dungeonKey);
    }
    if (!hrids) hrids = marketHridsForDungeon(dungeonKey);
    if (!hrids) {
      if (!ensureSelectedDungeon({ silent })) return { ok: false, error: i18nT("ui.noDungeonSelected", "No dungeon selected.") };
      if (!silent) showToast(i18nT("ui.pickDungeonFirst", "Pick a dungeon first."));
      return { ok: false, error: i18nT("ui.noHridMapping", "No HRID mapping for selected dungeon.") };
    }

    try {
      const now = Date.now();
      const { json, usedProxy } = await cfg.fetchJson();
      const sourceTimestamp = normalizeApiPayloadTimestamp(json?.timestamp);
      const marketData = cfg.selectMarketData(json);
      assertUsableMarketPayload(json, marketData);
      const ev = await computeDungeonEvSafe({ dungeonKey, marketData, sourceLabel: cfg.sourceLabel });

      const { entryAB, chestAB, entry, chestKey } = resolveDungeonKeyPricesFromMarket(json, hrids);
      const marketSlim = await buildMarketSlimSafe({
        dungeonKey,
        sourceLabel: cfg.sourceLabel,
        marketJson: json,
        marketData,
        hrids,
      });

      const hasValidPrices = (refreshShared && typeof refreshShared.hasValidKeyPrices === "function")
        ? refreshShared.hasValidKeyPrices(entry, chestKey)
        : (Number.isFinite(entry) && Number.isFinite(chestKey));
      if (!hasValidPrices) {
        throw new Error(i18nT("ui.missingKeyPriceData", "Missing price data for selected dungeon keys."));
      }

      const snapshot = (refreshShared && typeof refreshShared.buildRefreshSnapshot === "function")
        ? refreshShared.buildRefreshSnapshot({
          entry,
          chestKey,
          entryAB,
          chestAB,
          now,
          usedProxy,
          marketSlim,
          ev,
        })
        : {
          entry,
          chestKey,
          entryAsk: entryAB.ask,
          entryBid: entryAB.bid,
          chestKeyAsk: chestAB.ask,
          chestKeyBid: chestAB.bid,
          fetchedAt: now,
          usedProxy,
          marketSlim,
          ev,
        };
      const nextSaved = mergeDungeonSnapshot(cfg.getSaved(), dungeonKey, snapshot);

      cfg.setSaved(nextSaved);
      savePerDungeonPrices(cfg.savedStorageKey, nextSaved);
      refreshSelectedDungeonPanels(dungeonKey);

      cfg.afterSourceTimestamp?.(sourceTimestamp);
      cfg.afterTimestamp?.(now, usedProxy);
      dispatchPriceRefreshEvent({
        dungeonKey,
        apiSource: normalizeApiSourceFromLabel(cfg.sourceLabel),
        fetchedAt: now,
      });
      if (!silent) showToast(cfg.successToast(usedProxy));
      applyPostPriceRefreshUpdates(dungeonKey);
      return { ok: true, fetchedAt: now, usedProxy };
    } catch (err) {
      console.error(cfg.errorPrefix, err);
      const savedMap = (typeof cfg.getSaved === "function") ? cfg.getSaved() : null;
      const hasSavedData = hasSavedApiCoreForDungeon(savedMap, dungeonKey);
      const errorToast = (typeof cfg.errorToast === "function")
        ? cfg.errorToast({ dungeonKey, hasSavedData, err })
        : cfg.errorToast;
      if (!silent && errorToast) showToast(errorToast);
      cfg.onError?.(err, { dungeonKey, hasSavedData });
      return { ok: false, error: err?.message || i18nT("ui.apiRefreshFailed", "Couldn't refresh prices right now.") };
    }
  }

  function startOfficialAutoRefresh() {
    stopOfficialAutoRefresh();
    officialAutoTimer = window.setTimeout(async () => {
      // only refresh if we are still in official mode
      if (pricingModel === "official" && selectedDungeon) {
        await refreshOfficialPricesForDungeon(selectedDungeon, { silent: true, reason: "auto" });
      }
      startOfficialAutoRefresh(); // schedule the next tick
    }, nextOfficialAutoDelayMs());
  }

  function saveRefreshTimestamp(storageKey, now) {
    storageSetItem(storageKey, String(now));
  }

  function updateOfficialRefreshStatus(now, usedProxy) {
    saveRefreshTimestamp(KEY_OFFICIAL_REFRESH, now);
    if (officialRefreshStamp) {
      officialRefreshStamp.textContent = `${formatStamp(now)}${usedProxy ? i18nT("ui.proxySuffix", " (proxy)") : ""}`;
    }
  }

  function updateOtherRefreshStatus(now, usedProxy) {
    saveRefreshTimestamp(KEY_OTHER_REFRESH, now);
    if (otherStatus) {
      otherStatus.textContent = i18nF("ui.mooketUpdated", "Mooket updated: {time}{proxy}", {
        time: new Date(now).toLocaleString(),
        proxy: usedProxy ? i18nT("ui.proxySuffix", " (proxy)") : "",
      });
    }
  }

  function hasSavedApiCoreForDungeon(savedMap, dungeonKey) {
    const per = getSavedRecordFromMap(savedMap, dungeonKey);
    return !!(
      per &&
      (
        Number.isFinite(per.entryAsk) ||
        Number.isFinite(per.entryBid) ||
        Number.isFinite(per.entry) ||
        Number.isFinite(per.chestKeyAsk) ||
        Number.isFinite(per.chestKeyBid) ||
        Number.isFinite(per.chestKey) ||
        !!per.marketSlim
      )
    );
  }

  function buildPublicApiRefreshErrorToast(sourceLabel, hasSavedData) {
    if (sourceLabel === "mooket") {
      return hasSavedData
        ? i18nT("ui.mooketApiRefreshUsingSaved", "Couldn't refresh Mooket prices right now. Using your last saved prices.")
        : i18nT("ui.mooketApiRefreshRetry", "Couldn't refresh Mooket prices right now. Please try again in a moment.");
    }
    return hasSavedData
      ? i18nT("ui.officialApiRefreshUsingSaved", "Couldn't refresh Official prices right now. Using your last saved prices.")
      : i18nT("ui.officialApiRefreshRetry", "Couldn't refresh Official prices right now. Please try again in a moment.");
  }

  function buildOfficialRefreshConfig() {
    return {
      sourceLabel: "official",
      fetchJson: () => fetchOfficialMarketplaceJson(),
      selectMarketData: (json) => json?.marketData || null,
      getSaved: () => officialSaved,
      setSaved: (next) => { officialSaved = next; },
      savedStorageKey: KEY_OFFICIAL_PRICES,
      afterSourceTimestamp: (raw) => saveApiPayloadTimestamp(KEY_OFFICIAL_SOURCE_REFRESH, raw),
      afterTimestamp: updateOfficialRefreshStatus,
      successToast: (usedProxy) => i18nF("ui.officialApiRefreshed", "Official API refreshed{proxy}.", {
        proxy: usedProxy ? i18nT("ui.proxyViaSuffix", " (via proxy)") : "",
      }),
      errorPrefix: i18nT("ui.officialApiRefreshFailedPrefix", "Official API refresh failed:"),
      errorToast: ({ hasSavedData }) => buildPublicApiRefreshErrorToast("official", hasSavedData),
    };
  }

  function buildOtherRefreshConfig() {
    return {
      sourceLabel: "mooket",
      fetchJson: () => fetchMooketJson(),
      selectMarketData: (json) => json?.marketData ?? json,
      getSaved: () => otherSaved,
      setSaved: (next) => { otherSaved = next; },
      savedStorageKey: KEY_OTHER_PRICES,
      afterSourceTimestamp: (raw) => saveApiPayloadTimestamp(KEY_OTHER_SOURCE_REFRESH, raw),
      afterTimestamp: updateOtherRefreshStatus,
      successToast: () => i18nT("ui.mooketApiRefreshed", "Mooket API refreshed."),
      errorPrefix: i18nT("ui.mooketApiRefreshFailedPrefix", "Mooket API refresh failed:"),
      errorToast: ({ hasSavedData }) => buildPublicApiRefreshErrorToast("mooket", hasSavedData),
      onError: (_, ctx = {}) => {
        if (otherStatus) {
          otherStatus.textContent = buildPublicApiRefreshErrorToast("mooket", !!ctx.hasSavedData);
        }
      },
    };
  }

  async function refreshOfficialPricesForDungeon(dungeonKey, opts = {}) {
    return refreshApiPricesForDungeon(dungeonKey, opts, buildOfficialRefreshConfig());
  }

  async function refreshOtherPricesForDungeon(dungeonKey, opts = {}) {
    return refreshApiPricesForDungeon(dungeonKey, opts, buildOtherRefreshConfig());
  }

  function refreshApiSourceForDungeon(dungeonKey, apiSource, opts = {}) {
    if (apiSource === "other") {
      return refreshOtherPricesForDungeon(dungeonKey, opts);
    }
    return refreshOfficialPricesForDungeon(dungeonKey, opts);
  }

  async function refreshApiSourceForAllDungeons(apiSource, opts = {}) {
    const dungeonKeys = Object.keys(MARKET_HRIDS || {});
    const results = await Promise.all(dungeonKeys.map(async (dungeonKey) => {
      const result = await refreshApiSourceForDungeon(dungeonKey, apiSource, opts);
      return [dungeonKey, result || { ok: false, error: i18nT("ui.unknownRefreshState", "Unknown refresh state.") }];
    }));
    const out = {};
    for (const [dungeonKey, result] of results) out[dungeonKey] = result;
    return out;
  }

  // Don't seed a fake refresh timestamp on first load; we only set it after a real fetch.

  function triggerManualApiRefresh(refreshFn) {
    return refreshFn(selectedDungeon, { silent: false, reason: "manual" });
  }

  async function rerenderVisibleResults(opts = {}) {
    const includeSimple = opts.includeSimple !== false;
    const includeAdvanced = opts.includeAdvanced !== false;
    if (includeSimple && simpleResultsCard && !simpleResultsCard.hidden) {
      await renderSimpleResults();
    }
    if (includeAdvanced && advResultsCard && !advResultsCard.hidden) {
      await renderAdvancedResults();
    }
  }

  function bindManualRefreshButton(btn, refreshFn, afterRefresh) {
    if (!btn) return;
    btn.addEventListener("click", async () => {
      await triggerManualApiRefresh(refreshFn);
      if (typeof afterRefresh === "function") {
        await afterRefresh();
      }
    });
  }

  bindManualRefreshButton(officialRefreshBtn, refreshOfficialPricesForDungeon);

  bindManualRefreshButton(simpleOfficialRefreshBtn, refreshOfficialPricesForDungeon, async () => {
    await rerenderVisibleResults({ includeAdvanced: false });
  });

  // Other refresh
  bindManualRefreshButton(otherRefreshBtn, refreshOtherPricesForDungeon);

  function tickTimers() {
    const ts = getOfficialRefreshTs();
    const age = ts ? formatAge(Date.now() - ts) : "-";
    if (officialAge) officialAge.textContent = age;
    if (officialRefreshStamp) officialRefreshStamp.textContent = ts ? formatStamp(ts) : "";
    if (simplePricingLine) {
      simplePricingLine.textContent = i18nF("ui.officialApiLastRefreshDash", "Official API - Last refresh: {age}", { age });
    }
    updatePricingHeaderLine();
  }

  tickTimers();
  bindApiSourceFooterVisibility();
  updateApiSourceFooter();
  window.setInterval(tickTimers, 5000);
  document.addEventListener("site:lang-changed", updateApiSourceFooter);

  // ===== Dungeon selection =====
  function clearClearTimeOnSelectionChange(fromUser, prevValue, nextValue) {
    // Preserve per-context run inputs instead of clearing on dungeon/tier changes.
    applyContextInputsFromSelection();
    validateAndSavePlayerInputs();
  }

  function applyPressedSelectionState(items, selectedValue, valueOf, onEach) {
    const list = Array.isArray(items) ? items : [];
    const resolver = (typeof valueOf === "function") ? valueOf : (() => undefined);
    const shared = getSelectionUiShared();
    if (shared && typeof shared.applyPressedSelectionState === "function") {
      shared.applyPressedSelectionState(list, selectedValue, resolver);
    } else {
      for (const el of list) {
        if (!el) continue;
        const is = resolver(el) === selectedValue;
        el.classList.toggle("is-selected", is);
        el.setAttribute("aria-pressed", is ? "true" : "false");
      }
    }
    if (typeof onEach === "function") {
      for (const el of list) onEach(el);
    }
  }

  function applySelectedStage(hasTierSelection) {
    setBodyStage(true, tierStageVisible(hasTierSelection));
  }

  function applyLandingStage() {
    setBodyStage(false, false);
  }

  function applyDungeonOnlyStage() {
    setBodyStage(true, false);
  }

  function applyDungeonSelectionPostUi() {
    applySelectedStage(selectedTier);
    updateMarkerPosition();
    refreshSummariesAndEvPanels();
  }

  function applyTierSelectionPostUi() {
    applySelectedStage(true);
    updatePricingAvailability();
    if (!advancedMode) {
      // Keep panels collapsed by default; user can expand manually.
      prepareSimpleInputsForTier();
    }
    updateAllSummaries();
  }

  function persistSelectionAndClearTime(storageKey, fromUser, prevValue, nextValue) {
    storageSetItem(storageKey, nextValue);
    // Restore per-context run/food inputs when user switches dungeons/tiers.
    clearClearTimeOnSelectionChange(fromUser, prevValue, nextValue);
    document.dispatchEvent(new CustomEvent("dungeon:selection-changed", {
      detail: { dungeonKey: selectedDungeon, tierKey: selectedTier }
    }));
  }

  function setSelectedDungeon(dungeonKey, opts = {}) {
    const nextDungeon = sanitizeSelectedDungeonKey(dungeonKey);
    const prevDungeon = selectedDungeon;
    const fromUser = !!opts.fromUser;
    selectedDungeon = nextDungeon;
    if (!selectedDungeon) selectedTier = "";
    persistSelectionAndClearTime(KEY_SELECTED_DUNGEON, fromUser, prevDungeon, selectedDungeon);
    if (!selectedDungeon) storageRemoveItem(KEY_SELECTED_TIER);

    applyPressedSelectionState(
      cards,
      selectedDungeon,
      (c) => c?.dataset?.dungeon,
      () => { scheduleEasterEgg(); }
    );

    const selectedCard = cards.find((c) => c.dataset.dungeon === selectedDungeon);
    setRootAccentFromCard(selectedCard);

    applyDungeonSelectionPostUi();

    if (!advancedMode) {
      // Keep quick mode clean and deterministic for each selection
      if (simpleClearTime && clearTime) simpleClearTime.value = String(clearTime.value || "");
      setSimpleBuffCustomEnabled(false);
      resetSimpleResults();
    }

    // Ensure API prices are available for this dungeon (non-blocking)
    ensureApiPricesForDungeon(selectedDungeon, pricingModel);


    renderInlinePanels({ selectionOnly: true, suppressBump: true });
    window.setTimeout(updateMarkerPosition, 80);
  }

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      setSelectedDungeon(card.dataset.dungeon, { fromUser: true });
    });

    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") {
        card.classList.add("touch-hover");
        window.setTimeout(() => card.classList.remove("touch-hover"), 420);
      }
    });
  });

  function updatePricingAvailability() {
    // Grey out anything that is NOT the currently selected pricing model
    pricingCards.forEach((card) => {
      const choice = card.dataset.choice;
      const inactive = (choice !== pricingModel);

      card.classList.toggle("is-inactive", inactive);

      // Disable form controls inside inactive cards (but keep card clickable)
      card.querySelectorAll("input, select, textarea, button").forEach((el) => {
        // Don't disable the radio itself (so a11y / checked state stays normal)
        if (el.tagName === "INPUT" && el.type === "radio") return;
        el.disabled = inactive;
      });
    });
  }



  // ===== Tier selection =====
  function setSelectedTier(tier, opts = {}) {
    const nextTier = sanitizeSelectedTierKey(tier);
    const prevTier = selectedTier;
    const fromUser = !!opts.fromUser;
    const silent = !!opts.silent;

    selectedTier = nextTier;
    persistSelectionAndClearTime(KEY_SELECTED_TIER, fromUser, prevTier, selectedTier);

    scheduleEasterEgg();

    applyPressedSelectionState(tierButtons, selectedTier, (b) => b?.dataset?.tier);

    tierHint.textContent = i18nF("ui.tierSelected", "Tier selected: {tier}", { tier: selectedTier });
    applyTierSelectionPostUi();
    if (!silent && advancedMode) showToast(i18nT("ui.nowChoosePricing", "Now choose a pricing model."));
  }

  tierButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextTier = String(btn.dataset.tier || "");
      if (!nextTier) return;
      if (selectedDungeon && selectedTier && nextTier === selectedTier) {
        returnToLandingPreserveState();
        return;
      }
      if (!ensureSelectedDungeon()) return;
      setSelectedTier(nextTier, { fromUser: true });
    });
  });

  // ===== Summaries / status =====

  function pricingHeaderTexts(model = pricingModel, age = "—") {
    if (model === "manual") {
      return {
        pill: i18nT("ui.manualKeys", "Manual keys"),
        line: i18nT("ui.manualKeysLine", "Manual keys + Official API • Entry/Chest accepted (k,m)"),
      };
    }
    if (model === "other") {
      return {
        pill: i18nT("ui.otherApi", "Mooket API"),
        line: i18nT("ui.mooketApiLine", "Mooket API • Player-collected"),
      };
    }
    return {
      pill: i18nT("ui.officialApi", "Official API"),
      line: i18nF("ui.officialApiLastRefresh", "Official API • Last refresh: {age}", { age }),
    };
  }

  function updatePricingHeaderLine() {
    const ts = getOfficialRefreshTs();
    const age = ts ? formatAge(Date.now() - ts) : "—";

    const texts = pricingHeaderTexts(pricingModel, age);
    pricingPill.textContent = texts.pill;
    pricingSummaryLine.textContent = texts.line;
    updateApiSourceFooter();
  }

  function playerStatusTexts(parsed = getPlayerParsed()) {
    const ctRaw = parsed?.ctRaw;
    const buffRaw = parsed?.buffRaw;
    const ctOk = !!parsed?.ctOk;
    const buffOk = !!parsed?.buffOk;
    return {
      runClear: ctRaw ? i18nF("ui.runClearFmt", "{value} min", { value: ctRaw }) : "-",
      runBuff: buffRaw ? i18nF("ui.runBuffFmt", "{value}/20", { value: buffRaw }) : "-",
      runPill: (ctOk && buffOk) ? i18nT("ui.set", "Set") : i18nT("ui.needed", "Needed"),
      statusClear: ctRaw ? i18nF("ui.statusClearFmt", "{value}m", { value: ctRaw }) : "-",
      statusBuff: buffRaw ? `${buffRaw}` : "-",
    };
  }

  function updateRunHeaderLine() {
    const texts = playerStatusTexts(getPlayerParsed());
    runSummaryLine.textContent = i18nF("ui.runSummary", "Clear time: {clear} - Buff: {buff}", {
      clear: texts.runClear,
      buff: texts.runBuff,
    });
    runPill.textContent = texts.runPill;

  }


  let overrideEvTimer = 0;
  let overrideEvToken = 0;

  function applyEvToUI(ev) {
    if (!lootChestEv || !lootTokenValue) return;
    if (!ev || typeof ev.chestEv !== "number") {
      lootChestEv.textContent = "-";
      lootTokenValue.textContent = "-";
      if (lootRefinedChestEv) lootRefinedChestEv.textContent = "-";
      return;
    }

    lootChestEv.textContent = fmtGold(ev.chestEv);
    const best = ev.bestConversion?.item ? ` (best: ${ev.bestConversion.item})` : "";
    lootTokenValue.textContent = fmtGold(ev.tokenValue) + best;
    if (lootRefinedChestEv) {
      lootRefinedChestEv.textContent = (typeof ev.refinedChestEv === "number") ? fmtGold(ev.refinedChestEv) : "-";
    }
  }

  function scheduleOverrideEvRecompute() {
    window.clearTimeout(overrideEvTimer);
    overrideEvTimer = window.setTimeout(() => { void recomputeOverrideEv(); }, 180);
  }

  async function recomputeOverrideEv() {
    const usingApi = !!getEffectiveApiSource(pricingModel);
    if (!usingApi || !selectedDungeon) return;

    const record = getSavedRecordByModel(selectedDungeon, pricingModel);

    const marketSlim = record?.marketSlim || null;
    if (!marketSlim || !window.DungeonChestEV?.computeDungeonChestEV) return;

    const overrides = getActiveLootOverrides();
    if (!overrides) return;

    const token = ++overrideEvToken;
    try {
      const ev = await window.DungeonChestEV.computeDungeonChestEV({
        dungeonKey: selectedDungeon,
        marketData: marketSlim,
        side: "bid",
        priceOverrides: overrides,
      });
      if (token !== overrideEvToken) return;
      applyEvToUI(ev);
    } catch (e) {
      console.warn("Override EV recompute failed:", e);
    }
  }

  async function renderLootOverrideList(opts = {}) {
    const { keepScroll = false, ensureCache = false } = opts;

    if (!lootOverrideSection || !lootOverrideList) return;

    // Section is advanced-only via CSS; here we handle runtime enablement + content.
    lootOverrideSection.classList.toggle("isOn", lootOverrideEnabled);

    const usingApi = !!getEffectiveApiSource(pricingModel);
    if (!lootOverrideEnabled || !usingApi || !selectedDungeon) {
      lootOverrideList.innerHTML = "";
      lootOverrideItemsCache = [];
      if (lootOverrideHint) {
        lootOverrideHint.textContent = !usingApi
          ? i18nT("ui.selectApiForDefaults", "Select Official API or Mooket API to view market defaults.")
          : i18nT("ui.enableManualLootEdit", "Enable Manual loot prices to edit item values.");
      }
      return;
    }

    const prevScroll = keepScroll ? lootOverrideList.scrollTop : 0;

    const marketSlim = getMarketSlimForSelected();
    if (!marketSlim && lootOverrideHint) {
      lootOverrideHint.textContent = i18nT("ui.refreshPricingDefaults", "Refresh pricing to load market defaults for these items.");
    } else if (lootOverrideHint) {
      lootOverrideHint.textContent = i18nT("ui.pricesShownMarket", "Prices shown are current market values (placeholder). Enter a value to override. Leave blank to use the market.");
    }

    // Load items list (cached per dungeon)
    let items = lootOverrideItemsCache;
    if (ensureCache || !items.length || items._dungeonKey !== selectedDungeon) {
      if (window.DungeonChestEV?.getDungeonChestItems) {
        try {
          items = await window.DungeonChestEV.getDungeonChestItems(selectedDungeon, marketSlim);
        } catch (e) {
          console.warn("Failed to load dungeon items:", e);
          items = [];
        }
      } else {
        items = [];
      }
      items._dungeonKey = selectedDungeon;
      lootOverrideItemsCache = items;
    }

    const q = String(lootOverrideFilter?.value || "").trim().toLowerCase();
    const filtered = q
      ? items.filter((x) => String(x.name || "").toLowerCase().includes(q))
      : items;

    // Build rows
    lootOverrideList.innerHTML = "";
    for (const item of filtered) {
      const hrid = item.hrid;
      const row = document.createElement("div");
      row.className = "lootOverrideRow";

      const icon = document.createElement("div");
      icon.className = "lootOverrideIcon";
      if (item.iconPath) {
        const img = document.createElement("img");
        img.src = item.iconPath;
        img.alt = "";
        img.loading = "lazy";
        img.onerror = () => { img.style.display = "none"; };
        icon.appendChild(img);
      }
      row.appendChild(icon);

      const name = document.createElement("div");
      name.className = "lootOverrideName";
      name.textContent = item.name || "-";
      row.appendChild(name);

      // Mode switch (Bid/Ask/Custom)
      const modeWrap = document.createElement('div');
      modeWrap.className = 'lootOverrideMode';
      const modes = ['Bid', 'Ask', 'Custom'];
      const currentOv = (typeof hrid === 'string') ? lootPriceOverrides[hrid] : undefined;
      const currentMode = (currentOv && typeof currentOv === 'object' && currentOv.mode) ? currentOv.mode : (typeof currentOv === 'number' ? 'Custom' : '');
      for (const m of modes) {
        const lab = document.createElement('label');
        const rb = document.createElement('input');
        rb.type = 'radio'; rb.name = `mode-${hrid}`; rb.value = m;
        if (m === currentMode) rb.checked = true;
        lab.appendChild(rb); lab.appendChild(document.createTextNode(m));
        modeWrap.appendChild(lab);
        rb.addEventListener('change', () => {
          if (m === 'Custom') {
            const v = parseCompactNumber(input.value);
            if (typeof hrid === 'string') lootPriceOverrides[hrid] = (Number.isFinite(v) ? Math.round(v) : { mode: 'Custom' });
            input.disabled = false;
          } else {
            if (typeof hrid === 'string') lootPriceOverrides[hrid] = { mode: m };
            input.disabled = true;
          }
          saveLootPriceOverrides(lootPriceOverrides);
          scheduleOverrideEvRecompute();
        });
      }


      const input = document.createElement("input");
      input.type = "text";
      input.inputMode = "decimal";
      input.placeholder = "-";

      const overrideVal = (typeof hrid === "string") ? lootPriceOverrides[hrid] : undefined;
      const isObj = overrideVal && typeof overrideVal === 'object';
      const isCustom = (typeof overrideVal === 'number') || (isObj && overrideVal.mode === 'Custom');
      if (isCustom) {
        row.classList.add("isCustom");
        const v = (typeof overrideVal === 'number') ? overrideVal : (overrideVal.price || 0);
        input.value = v ? fmtGold(v) : '';
        input.disabled = false;
      } else {
        row.classList.add("isDefault");
        input.value = "";
        const def = (typeof hrid === "string") ? getDefaultUnitPrice(hrid) : null;
        if (typeof def === "number") input.placeholder = fmtGold(def);
      }

      input.addEventListener("input", () => {
        const raw = input.value;
        if (!raw.trim()) {
          // Clear override
          if (typeof hrid === "string") delete lootPriceOverrides[hrid];
          row.classList.remove("isInvalid");
          row.classList.remove("isCustom");
          row.classList.add("isDefault");
          saveLootPriceOverrides(lootPriceOverrides);
          scheduleOverrideEvRecompute();
          return;
        }

        const n = parseCompactNumber(raw);
        if (n == null) {
          row.classList.add("isInvalid");
          return;
        }

        row.classList.remove("isInvalid");
        row.classList.remove("isDefault");
        row.classList.add("isCustom");

        if (typeof hrid === "string") {
          const ov = lootPriceOverrides[hrid];
          if (ov && typeof ov === 'object') lootPriceOverrides[hrid] = { mode: 'Custom', price: Math.round(n) };
          else lootPriceOverrides[hrid] = Math.round(n);
        }
        saveLootPriceOverrides(lootPriceOverrides);
        scheduleOverrideEvRecompute();
      });

      input.addEventListener("blur", () => {
        const n = parseCompactNumber(input.value);
        if (n != null) input.value = fmtGold(n);
      });

      // Reset-to-API button
      const resetBtn = document.createElement("button");
      resetBtn.className = "lootOverrideResetOne tipHost";
      resetBtn.dataset.tip = i18nT("ui.reset", "Reset");
      resetBtn.title = "";
      resetBtn.setAttribute("aria-label", i18nT("ui.reset", "Reset"));
      resetBtn.textContent = "R";
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof hrid === "string") {
          delete lootPriceOverrides[hrid];
          saveLootPriceOverrides(lootPriceOverrides);
          renderLootOverrideList({ keepScroll: true });
          scheduleOverrideEvRecompute();
        }
      });
      row.appendChild(input);
      row.appendChild(resetBtn);
      lootOverrideList.appendChild(row);
    }

    if (keepScroll) lootOverrideList.scrollTop = prevScroll;
  }


  function updateChestEvUI() {
    if (!lootChestEv || !lootTokenValue) return;

    const usingApi = !!getEffectiveApiSource(pricingModel);
    if (!usingApi || !selectedDungeon) {
      applyEvToUI(null);
      return;
    }

    const record = getSavedRecordByModel(selectedDungeon, pricingModel);

    // Always show the latest base EV we computed on refresh (fast path)
    if (record?.ev) applyEvToUI(record.ev);
    else applyEvToUI(null);

    // If overrides are enabled, recompute EV from slim market snapshot
    if (lootOverrideEnabled && record?.marketSlim) scheduleOverrideEvRecompute();
  }


  function pricingModelLabel(model = pricingModel) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.pricingModelLabel === "function") {
      return shared.pricingModelLabel(model);
    }
    if (model === "official") return i18nT("ui.official", "Official");
    if (model === "manual") return i18nT("ui.manualPlusOfficial", "Manual + Official");
    return i18nT("ui.mooket", "Mooket");
  }

  function selectedDungeonLabel(dungeonKey = selectedDungeon) {
    return dungeonKey ? niceDungeonName(dungeonKey) : "-";
  }

  function updateStatusStack() {
    statusDungeon.textContent = selectedDungeonLabel(selectedDungeon);
    statusTier.textContent = selectedTier || "-";
    statusPricing.textContent = pricingModelLabel(pricingModel);

    const texts = playerStatusTexts(getPlayerParsed());
    statusClear.textContent = texts.statusClear;
    statusBuff.textContent = texts.statusBuff;

  }

  function updateSelectionSummary() {
    const d = selectedDungeonLabel(selectedDungeon);
    const t = selectedTier || "-";
    const p = pricingModelLabel(pricingModel);
    selectionSummary.textContent = i18nF("ui.selectionSummary", "Dungeon: {dungeon} - Tier: {tier} - Pricing: {pricing}", {
      dungeon: d,
      tier: t,
      pricing: p,
    });
  }

  function updateQuickStartHint() {
    if (!quickStartHint) return;
    if (selectedDungeon) {
      quickStartHint.hidden = true;
      return;
    }

    const keysOn = !!(keysToggle && keysToggle.checked);
    const zoneOn = !!(zoneCompareToggle && zoneCompareToggle.checked);
    if (keysOn || zoneOn) {
      quickStartHint.hidden = true;
      return;
    }

    const tokenOn = !!(tokenShopToggle && tokenShopToggle.checked);
    const advOn = !!advancedMode || !!(advModeToggle && advModeToggle.checked);
    if (tokenOn) {
      quickStartHint.textContent = i18nT("ui.quickStartHintTokenShop", "Pick a dungeon for Token Shop");
    } else if (advOn) {
      quickStartHint.textContent = i18nT("ui.quickStartHintAdvanced", "Pick a dungeon for Advanced");
    } else {
      quickStartHint.textContent = i18nT("ui.quickStartHintDefault", "Pick a dungeon for quick start");
    }

    quickStartHint.hidden = false;
  }

  function updateAllSummaries() {
    updatePricingHeaderLine();
    updateRunHeaderLine();
    updateStatusStack();
    updateSelectionSummary();
    updateQuickStartHint();
    updateLootOverview();
  }

  // ===== Simulate increments counter =====
  async function getOfficialSavedForSimple(dungeonKey) {
    // Quick mode always uses Official API pricing.
    const per = getSavedRecordFromMap(officialSaved, dungeonKey);
    const hasCore =
      per &&
      (Number.isFinite(per.entryAsk) || Number.isFinite(per.entryBid) || Number.isFinite(per.entry)) &&
      (Number.isFinite(per.chestKeyAsk) || Number.isFinite(per.chestKeyBid) || Number.isFinite(per.chestKey)) &&
      per.marketSlim;

    if (!hasCore) {
      try {
        await refreshOfficialPricesForDungeon(dungeonKey, { silent: true, reason: "quick" });
      } catch (e) {
        console.warn("Quick mode official refresh failed:", e);
      }
    }
    return getSavedRecordFromMap(officialSaved, dungeonKey);
  }

  function getSavedRecordFromMap(savedMap, dungeonKey) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getSavedRecordFromMap === "function") {
      return shared.getSavedRecordFromMap(savedMap, dungeonKey);
    }
    return (savedMap && typeof savedMap === "object") ? savedMap[dungeonKey] : null;
  }

  function pickFiniteOrFallback(obj, primaryKey, fallbackKey) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.pickFiniteOrFallback === "function") {
      return shared.pickFiniteOrFallback(obj, primaryKey, fallbackKey);
    }
    if (obj && Number.isFinite(obj[primaryKey])) return obj[primaryKey];
    if (obj && Number.isFinite(obj[fallbackKey])) return obj[fallbackKey];
    return null;
  }

  function getSavedKeyPricesAB(savedMap, dungeonKey) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getSavedKeyPricesAB === "function") {
      return shared.getSavedKeyPricesAB(savedMap, dungeonKey);
    }
    const per = getSavedRecordFromMap(savedMap, dungeonKey);
    const entryAsk = pickFiniteOrFallback(per, "entryAsk", "entry");
    const entryBid = pickFiniteOrFallback(per, "entryBid", "entry");
    const chestAsk = pickFiniteOrFallback(per, "chestKeyAsk", "chestKey");
    const chestBid = pickFiniteOrFallback(per, "chestKeyBid", "chestKey");

    return { entryAsk, entryBid, chestKeyAsk: chestAsk, chestKeyBid: chestBid };
  }

  function getOfficialKeyPricesAB(dungeonKey) {
    return getSavedKeyPricesAB(officialSaved, dungeonKey);
  }

  function getOtherKeyPricesAB(dungeonKey) {
    return getSavedKeyPricesAB(otherSaved, dungeonKey);
  }

  function getManualKeyPricesAB(dungeonKey) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getPricesABForModel === "function") {
      return shared.getPricesABForModel({
        dungeonKey,
        model: "manual",
        officialSaved,
        otherSaved,
        manualSaved,
      });
    }
    const base = getOfficialKeyPricesAB(dungeonKey);
    const entry = (manualSaved && Number.isFinite(manualSaved.entry)) ? manualSaved.entry : null;
    const chest = (manualSaved && Number.isFinite(manualSaved.chest)) ? manualSaved.chest : null;
    return {
      entryAsk: Number.isFinite(entry) ? entry : base.entryAsk,
      entryBid: Number.isFinite(entry) ? entry : base.entryBid,
      chestKeyAsk: Number.isFinite(chest) ? chest : base.chestKeyAsk,
      chestKeyBid: Number.isFinite(chest) ? chest : base.chestKeyBid,
    };
  }

  function getPricesABForModel(dungeonKey, model) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.getPricesABForModel === "function") {
      return shared.getPricesABForModel({
        dungeonKey,
        model,
        officialSaved,
        otherSaved,
        manualSaved,
      });
    }
    if (model === "manual") return getManualKeyPricesAB(dungeonKey);
    if (model === "other") return getOtherKeyPricesAB(dungeonKey);
    return getOfficialKeyPricesAB(dungeonKey);
  }

  function derivePricesAndMissingState(dungeonKey, model, opts = {}) {
    const useOfficial = !!opts.useOfficial;
    const prices = useOfficial
      ? getOfficialKeyPricesAB(dungeonKey)
      : getPricesABForModel(dungeonKey, model);
    const missingPriceItems = getMissingMarketPriceItems(prices);
    const missingPriceMsg = buildMissingMarketPriceMessage(missingPriceItems);
    return { prices, missingPriceItems, missingPriceMsg };
  }


  async function getOfficialEvCached(dungeonKey, side) {
    const per = getSavedRecordFromMap(officialSaved, dungeonKey);
    const key = (side === "ask") ? "evAsk" : "evBid";
    const fallbackKey = (side === "bid") ? "ev" : null;

    const existing = per ? (per[key] || (fallbackKey ? per[fallbackKey] : null)) : null;
    if (existing && (Number.isFinite(existing.chestEv) || Number.isFinite(existing.refinedChestEv))) return existing;

    const marketData = per?.marketSlim || null;
    if (!marketData || !window.DungeonChestEV?.computeDungeonChestEV) return null;

    try {
      const ev = await window.DungeonChestEV.computeDungeonChestEV({ dungeonKey, marketData, side });
      if (!ev) return null;

      officialSaved = (officialSaved && typeof officialSaved === "object") ? officialSaved : {};
      officialSaved[dungeonKey] = { ...(officialSaved[dungeonKey] || {}), [key]: ev };
      savePerDungeonPrices(KEY_OFFICIAL_PRICES, officialSaved);
      return ev;
    } catch (e) {
      console.warn("EV compute failed (quick):", e);
      return null;
    }
  }

  function readResultLootAndRuns(dungeonKey) {
    const loot = getLootForDungeon(dungeonKey);
    const entryKeys = Number(loot.entry || 0);
    const chestKeys = Number(loot.chestKey || 0);
    const chestCount = Number(loot.chest || 0);
    const refinedCount = Number(loot.refined || 0);
    const player = getPlayerParsed();
    const runs = player.ctOk ? Calc.computeRunsPerDay(player.ctNum) : 0;
    return { entryKeys, chestKeys, chestCount, refinedCount, runs };
  }

  function applyResultHeaderStats(opts) {
    const {
      dungeonKey,
      dungeonIconEl,
      entryKeyIconEl,
      chestKeyIconEl,
      entryKeysEl,
      chestKeysEl,
      runsEl,
    } = opts || {};

    setResultIcons(dungeonKey, dungeonIconEl, entryKeyIconEl, chestKeyIconEl);
    const stats = readResultLootAndRuns(dungeonKey);
    if (entryKeysEl) entryKeysEl.textContent = stats.entryKeys.toLocaleString();
    if (chestKeysEl) chestKeysEl.textContent = stats.chestKeys.toLocaleString();
    if (runsEl) runsEl.textContent = String(stats.runs);
    return stats;
  }

  function applyMissingPriceResultState(opts = {}) {
    const {
      missingItems,
      profitBoxEl,
      profitDayEl,
      profitHourEl,
      resultsCardEl,
    } = opts;
    if (!Array.isArray(missingItems) || !missingItems.length) return false;
    if (profitBoxEl) profitBoxEl.dataset.tip = "";
    if (profitDayEl) profitDayEl.textContent = i18nT("ui.profitDash", "Profit: -");
    if (profitHourEl) profitHourEl.textContent = "-";
    setProfitTintFromLow(NaN, profitBoxEl);
    if (resultsCardEl) resultsCardEl.hidden = false;
    return true;
  }

  function applyMissingPriceWarningAndState(opts = {}) {
    const {
      dungeonKey,
      model,
      deriveOptions,
      profitBoxEl,
      profitDayEl,
      profitHourEl,
      resultsCardEl,
    } = opts;
    const { prices, missingPriceItems, missingPriceMsg } = derivePricesAndMissingState(
      dungeonKey,
      model,
      deriveOptions
    );
    setProfitWarning(profitBoxEl, missingPriceMsg);
    const isMissing = applyMissingPriceResultState({
      missingItems: missingPriceItems,
      profitBoxEl,
      profitDayEl,
      profitHourEl,
      resultsCardEl,
    });
    return { prices, missingPriceItems, missingPriceMsg, isMissing };
  }

  function isRangeEnabled(opts = {}) {
    const includeAdvancedToggle = !!opts.includeAdvancedToggle;
    return (
      (storageGetItem(KEY_RANGE_ENABLED) === "1") ||
      (includeAdvancedToggle && !!advToggleRange && advToggleRange.checked) ||
      (document.getElementById("toggleRange")?.checked)
    );
  }

  function resultsSubText(rangeOn, label = "") {
    if (label) {
      return rangeOn
        ? `${label}: ${i18nT("ui.rangeSubInline", "low uses loot @ bid + keys @ ask; high uses loot @ ask + keys @ bid.")}`
        : `${label}: ${i18nT("ui.standardSubInline", "standard uses loot @ bid - 2% tax; keys @ bid.")}`;
    }
    return rangeOn
      ? i18nT("ui.rangeSub", "Range: low uses loot @ bid + keys @ ask; high uses loot @ ask + keys @ bid.")
      : i18nT("ui.standardSub", "Standard: instant sell @ bid - 2% tax; keys @ bid.");
  }

  function applyResultsSubText(subEl, rangeOn, label = "") {
    if (subEl) subEl.textContent = resultsSubText(rangeOn, label);
  }

  function buildProfitMathTip({ rangeOn, profitLow, profitHigh, bidBidProfit, foodPerDay, label = "" }) {
    const fmtC = (n) => formatCoinsCompact(Number.isFinite(n) ? n : 0);

    if (rangeOn && Number.isFinite(profitLow) && Number.isFinite(profitHigh)) {
      const grossLow = profitLow + foodPerDay;
      const grossHigh = profitHigh + foodPerDay;
      const title = label
        ? i18nF("ui.rangeMathTitle", "{label} range math (after tax)", { label })
        : i18nT("ui.rangeMathTitleNoLabel", "Range math (after tax)");
      return `${title}
${i18nT("ui.lowDay", "Low/day")}: ${fmtC(grossLow)} - ${fmtC(foodPerDay)} = ${fmtC(profitLow)}
${i18nT("ui.highDay", "High/day")}: ${fmtC(grossHigh)} - ${fmtC(foodPerDay)} = ${fmtC(profitHigh)}
${i18nT("ui.lowHour", "Low/hour")}: ${fmtC(profitLow / 24)}
${i18nT("ui.highHour", "High/hour")}: ${fmtC(profitHigh / 24)}`;
    }

    if (!rangeOn && Number.isFinite(bidBidProfit)) {
      const gross = bidBidProfit + foodPerDay;
      const title = label
        ? i18nF("ui.standardMathTitle", "{label} standard math (after tax)", { label })
        : i18nT("ui.standardMathTitleNoLabel", "Standard math (after tax)");
      return `${title}
${i18nT("ui.netDay", "Net/day")}: ${fmtC(gross)} - ${fmtC(foodPerDay)} = ${fmtC(bidBidProfit)}
${i18nT("ui.netHour", "Net/hour")}: ${fmtC(bidBidProfit / 24)}`;
    }

    return "";
  }

  function setProfitTip(boxEl, tip) {
    if (boxEl) boxEl.dataset.tip = tip;
  }

  function updateProfitTipSafe(boxEl, tipArgs) {
    try {
      setProfitTip(boxEl, buildProfitMathTip(tipArgs));
    } catch (_) {
      setProfitTip(boxEl, "");
    }
  }

  function applyProfitValueState(opts = {}) {
    const {
      rangeOn,
      profitLow,
      profitHigh,
      bidBidProfit,
      profitDayEl,
      profitHourEl,
      profitBoxEl,
    } = opts;

    if (rangeOn) {
      if (!Number.isFinite(profitLow) || !Number.isFinite(profitHigh)) {
        if (profitDayEl) profitDayEl.textContent = i18nT("ui.profitDash", "Profit: -");
        if (profitHourEl) profitHourEl.textContent = "-";
        setProfitTintFromLow(NaN, profitBoxEl);
      } else {
        if (profitDayEl) {
          profitDayEl.textContent = i18nF("ui.rangePerDay", "{low} - {high} / day", {
            low: formatCoinsCompact(profitLow),
            high: formatCoinsCompact(profitHigh),
          });
        }
        if (profitHourEl) {
          profitHourEl.textContent = i18nF("ui.rangePerHour", "{low} - {high} / hour", {
            low: formatCoinsCompact(profitLow / 24),
            high: formatCoinsCompact(profitHigh / 24),
          });
        }
        setProfitTintFromLow(profitLow, profitBoxEl);
      }
      return;
    }

    if (!Number.isFinite(bidBidProfit)) {
      if (profitDayEl) profitDayEl.textContent = i18nT("ui.profitDash", "Profit: -");
      if (profitHourEl) profitHourEl.textContent = "-";
      setProfitTintFromLow(NaN, profitBoxEl);
      return;
    }

    if (profitDayEl) {
      profitDayEl.textContent = i18nF("ui.valuePerDay", "{value} / day", {
        value: formatCoinsCompact(bidBidProfit),
      });
    }
    if (profitHourEl) {
      profitHourEl.textContent = i18nF("ui.valuePerHour", "{value} / hour", {
        value: formatCoinsCompact(bidBidProfit / 24),
      });
    }
    setProfitTintFromLow(bidBidProfit, profitBoxEl);
  }

  function applyProfitTipAndValueState(opts = {}) {
    const {
      rangeOn,
      profitLow,
      profitHigh,
      bidBidProfit,
      foodPerDay,
      label = "",
      profitBoxEl,
      profitDayEl,
      profitHourEl,
    } = opts;

    updateProfitTipSafe(profitBoxEl, {
      rangeOn,
      profitLow,
      profitHigh,
      bidBidProfit,
      foodPerDay,
      label,
    });

    applyProfitValueState({
      rangeOn,
      profitLow,
      profitHigh,
      bidBidProfit,
      profitDayEl,
      profitHourEl,
      profitBoxEl,
    });
  }

  async function ensureAdvancedMarketSnapshot(opts = {}) {
    const {
      dungeonKey,
      evSource,
      savedMap,
    } = opts;

    const hasSlim = !!(savedMap?.[dungeonKey]?.marketSlim);
    if (hasSlim) return;

    try {
      await refreshApiSourceForDungeon(dungeonKey, evSource, { silent: true, reason: "profit" });
    } catch (e) {
      console.warn("Price refresh failed (advanced results):", e);
    }
  }

  async function computeAdvancedEvValues(opts = {}) {
    const {
      dungeonKey,
      marketSlim,
      record,
    } = opts;

    let evBid = null;
    let evAsk = null;

    if (marketSlim && window.DungeonChestEV?.computeDungeonChestEV) {
      const overrides = getActiveLootOverrides();
      try {
        if (!overrides && record?.ev) evBid = record.ev;
        else evBid = await window.DungeonChestEV.computeDungeonChestEV({
          dungeonKey,
          marketData: marketSlim,
          side: "bid",
          priceOverrides: overrides
        });

        evAsk = await window.DungeonChestEV.computeDungeonChestEV({
          dungeonKey,
          marketData: marketSlim,
          side: "ask",
          priceOverrides: overrides
        });
      } catch (e) {
        console.warn("Failed to compute EV (advanced results):", e);
      }
    }

    return { evBid, evAsk };
  }

  async function renderSimpleResults() {
    if (!selectedDungeon) return;
    if (!simpleResultsCard) return;

    const {
      chestCount,
      refinedCount,
    } = applyResultHeaderStats({
      dungeonKey: selectedDungeon,
      dungeonIconEl: simpleDungeonIcon,
      entryKeyIconEl: simpleEntryKeyIcon,
      chestKeyIconEl: simpleChestKeyIcon,
      entryKeysEl: simpleEntryKeys,
      chestKeysEl: simpleChestKeys,
      runsEl: simpleRunsPerDay,
    });

    if (simpleResultsSub) {
      simpleResultsSub.textContent = i18nT("ui.standardSub", "Standard: instant sell @ bid - 2% tax; keys @ bid.");
    }

    // Profit requires official prices + EV
    await getOfficialSavedForSimple(selectedDungeon);

    const { prices, isMissing } = applyMissingPriceWarningAndState({
      dungeonKey: selectedDungeon,
      model: "official",
      deriveOptions: { useOfficial: true },
      profitBoxEl: simpleProfitBox,
      profitDayEl: simpleProfitDay,
      profitHourEl: simpleProfitHour,
      resultsCardEl: simpleResultsCard,
    });
    if (isMissing) return;

    const evBid = await getOfficialEvCached(selectedDungeon, "bid");
    const evAsk = await getOfficialEvCached(selectedDungeon, "ask");

    const foodPerDay = getFoodPerDayValue();
    const { profitLow, profitHigh, bidBidProfit } = computeProfitFromEvAndPrices({
      chestCount,
      refinedCount,
      evBid,
      evAsk,
      prices,
      foodPerDay,
    });

    const rangeOn = isRangeEnabled();
    applyResultsSubText(simpleResultsSub, rangeOn);
    applyProfitTipAndValueState({
      rangeOn,
      profitLow,
      profitHigh,
      bidBidProfit,
      foodPerDay,
      dungeonKey: selectedDungeon,
      model: "official",
      profitBoxEl: simpleProfitBox,
      profitDayEl: simpleProfitDay,
      profitHourEl: simpleProfitHour,
    });

    simpleResultsCard.hidden = false;
  }

  


async function renderAdvancedResults() {
  if (!selectedDungeon) return;
  if (!advResultsCard) return;

  const {
    chestCount,
    refinedCount,
  } = applyResultHeaderStats({
    dungeonKey: selectedDungeon,
    dungeonIconEl: advDungeonIcon,
    entryKeyIconEl: advEntryKeyIcon,
    chestKeyIconEl: advChestKeyIcon,
    entryKeysEl: advEntryKeys,
    chestKeysEl: advChestKeys,
    runsEl: advRunsPerDay,
  });

  const model = pricingModel || "official";
  const label = (model === "official") ? "Official" : (model === "other") ? "Mooket" : "Manual";
  const rangeOn = isRangeEnabled({ includeAdvancedToggle: true });
  applyResultsSubText(advResultsSub, rangeOn, label);

  const foodPerDay = getFoodPerDayValue();

  // EV source:
  // - Official: official market
  // - Mooket: mooket market
  // - Manual: official market for EV, manual overrides for entry/chest keys
  const evSource = getEffectiveApiSource(model);
  const saved = (evSource === "other") ? otherSaved : officialSaved;

  // Ensure we have market snapshot if possible
  await ensureAdvancedMarketSnapshot({
    dungeonKey: selectedDungeon,
    evSource,
    savedMap: saved,
  });

  const record = getSavedRecordFromMap(saved, selectedDungeon);
  const marketSlim = record?.marketSlim || null;

  const { prices, isMissing } = applyMissingPriceWarningAndState({
    dungeonKey: selectedDungeon,
    model,
    profitBoxEl: advProfitBox,
    profitDayEl: advProfitDay,
    profitHourEl: advProfitHour,
    resultsCardEl: advResultsCard,
  });
  if (isMissing) return;

  const { evBid, evAsk } = await computeAdvancedEvValues({
    dungeonKey: selectedDungeon,
    marketSlim,
    record,
  });

  const { profitLow, profitHigh, bidBidProfit } = computeProfitFromEvAndPrices({
    chestCount,
    refinedCount,
    evBid,
    evAsk,
    prices,
    foodPerDay,
  });

  applyProfitTipAndValueState({
    rangeOn,
    profitLow,
    profitHigh,
    bidBidProfit,
    foodPerDay,
    label,
    dungeonKey: selectedDungeon,
    model,
    profitBoxEl: advProfitBox,
    profitDayEl: advProfitDay,
    profitHourEl: advProfitHour,
  });

  advResultsCard.hidden = false;
}

  function validateSimpleSimulationInputs() {
    syncSimpleInputsToRunInputs();
    const ct = getSimpleClearTimeValue();
    const buff = getSimpleBuffValue();

    // Force errors visible on click
    if (!ct.ok) {
      if (simpleClearTimeErr) simpleClearTimeErr.classList.add("show");
      focusSimpleClearTime();
      showToast(i18nT("ui.clearTimeRequired", "Clear time is required."));
      return false;
    }
    if (!buff.ok) {
      if (simpleBuffErr) simpleBuffErr.classList.add("show");
      if (simpleBuffCustom) simpleBuffCustom.focus();
      showToast(i18nT("ui.buffMustRange", "Combat buff must be 0-20."));
      return false;
    }
    return true;
  }

  function handleMissingPlayerInfoForSimulation(source, playerCheck) {
    if (source === "simple") {
      if (!playerCheck.ctOk) {
        if (simpleClearTimeErr) simpleClearTimeErr.classList.add("show");
        focusSimpleClearTime();
      }
      showToast(i18nT("ui.playerInfoRequired", "Player Information is required (buff 0-20, clear time)."));
      return;
    }

    // Advanced: nudge user to open the accordion
    if (playerCheck.ctRaw === "" && clearTime) {
      clearTime.classList.add("requiredInput");
      ensureRunPanelOpen();
      clearTime.focus();
    }
    showToast(i18nT("ui.playerInfoRequired", "Player Information is required (buff 0-20, clear time)."));
  }

  function incrementSimulationCount(dungeonKey) {
    counts[dungeonKey] = Number(counts[dungeonKey] || 0) + 1;
    saveCounts(counts);
    updateCountsUI(counts);
  }

  function getPlayerParsedForSimulation() {
    return (typeof getPlayerParsed === "function")
      ? getPlayerParsed()
      : { ctNum: NaN, ctOk: false, buffNum: 0 };
  }

  function applySimulationLootResult(dungeonKey, sim) {
    const loot = getLootForDungeon(dungeonKey);
    loot.entry = sim.entry;        // entry keys track regular chest drops (buffed)
    loot.chest = sim.chest;        // buffed
    loot.refined = sim.refined;    // buffed
    loot.chestKey = sim.chestKey;  // chest + refined
    lootCounts[dungeonKey] = loot;
    saveLootCounts(lootCounts);
  }

  function shouldAutoScrollResults() {
    return !document.documentElement.classList.contains("mobile-compat");
  }

  async function renderResultsForSource(source) {
    if (source === "simple") {
      await renderSimpleResults();
      if (simpleResultsCard && shouldAutoScrollResults()) {
        simpleResultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }
    await renderAdvancedResults();
    if (advResultsCard && shouldAutoScrollResults()) {
      advResultsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  async function handleSimulateClick(source) {
    try {
      if (!ensureSelectedDungeon()) return;
      if (!ensureSelectedTier()) return;

      if (source === "simple" && !validateSimpleSimulationInputs()) return;

      // Require run inputs (advanced or synced-from-simple)
      const playerCheck = getPlayerParsed();
      if (!playerCheck.ctOk || !playerCheck.buffOk) {
        handleMissingPlayerInfoForSimulation(source, playerCheck);
        return;
      }

      maybeCowPeek(source === "simple" ? simpleSimulateBtn : simulateBtn);

      incrementSimulationCount(selectedDungeon);

      const playerParsed = getPlayerParsedForSimulation();

      const buffTier = Number.isFinite(playerParsed.buffNum) ? playerParsed.buffNum : 0;

      const sim = Calc.computeLootCountsFor24h({
        clearMinutes: playerParsed.ctNum,
        buffTier,
        tierKey: selectedTier,
      });

      applySimulationLootResult(selectedDungeon, sim);

      updateLootOverview();
      playSimFeedback(document.querySelector(".card.is-selected"));

      await renderResultsForSource(source);
    } catch (err) {
      console.error("Calculation failed:", err);
      showToast(
        err && err.message
          ? i18nF("ui.calculationFailedPrefix", "Calculation failed: {error}", { error: err.message })
          : i18nT("ui.calculationFailedConsole", "Calculation failed (see console).")
      );
    }
  }

  simulateBtn.addEventListener("click", () => { void handleSimulateClick("advanced"); });
  if (simpleSimulateBtn) {
    simpleSimulateBtn.addEventListener("click", () => { void handleSimulateClick("simple"); });
  }

  function triggerActiveCalculateFromEnter() {
    if (zoneCompareToggle?.checked) {
      const zcCalc = document.getElementById("zcCalc");
      if (zcCalc && !zcCalc.disabled) {
        zcCalc.click();
        return;
      }
      return;
    }
    if (advancedMode) {
      if (simulateBtn && !simulateBtn.disabled) simulateBtn.click();
      return;
    }
    if (simpleSimulateBtn && !simpleSimulateBtn.disabled) {
      simpleSimulateBtn.click();
      return;
    }
    if (simulateBtn && !simulateBtn.disabled) {
      simulateBtn.click();
    }
  }

  function bindEnterToActiveCalculate(el) {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      triggerActiveCalculateFromEnter();
    });
  }

  bindEnterToActiveCalculate(clearTime);
  bindEnterToActiveCalculate(playerBuff);
  bindEnterToActiveCalculate(simpleClearTime);
  bindEnterToActiveCalculate(simpleBuffCustom);
  bindEnterToActiveCalculate(document.getElementById("foodPerDay"));
  bindEnterToActiveCalculate(advFoodPerDay);

  function resetToLanding() {
    // Clear only the currently selected dungeon+tier context.
    clearRunInputValues({ includeSimple: true });

    selectedDungeon = "";
    selectedTier = "";
    storageRemoveItem(KEY_SELECTED_DUNGEON);
    storageRemoveItem(KEY_SELECTED_TIER);

    resetSelectionUiToLanding();
    collapsePanelsForLanding();

    applyLandingStage();
    updateAllSummaries();
    openRunPanelAndFocusClearTime();
    cancelEasterEgg();
  }

  function returnToLandingPreserveState() {
    selectedDungeon = "";
    selectedTier = "";
    storageRemoveItem(KEY_SELECTED_DUNGEON);
    storageRemoveItem(KEY_SELECTED_TIER);

    resetSelectionUiToLanding();
    collapsePanelsForLanding();

    applyLandingStage();
    updateAllSummaries();
    cancelEasterEgg();
  }

  function resetSelectionUiToLanding() {
    applyPressedSelectionState(cards, "", (c) => c?.dataset?.dungeon);
    applyPressedSelectionState(tierButtons, "", (b) => b?.dataset?.tier);

    document.documentElement.style.setProperty("--accent", "#34d399");
    tierHint.textContent = i18nT("ui.tierHintDefault", "Choose a tier to unlock options.");
  }

  function collapsePanelsForLanding() {
    // collapse panels
    if (pricingPanel) setPanelOpenAndPersist(pricingPanel, "pricing", false);
    if (runPanel) setPanelOpen(runPanel, true);
    persistPanelOpenState("run", false);
  }

  function clearFoodPerDayState() {
    const baseFood = document.getElementById("foodPerDay");
    if (baseFood) baseFood.value = "";
    if (advFoodPerDay) advFoodPerDay.value = "";
    foodSavedByContext = {};
    storageSetJson(KEY_FOOD_PER_DAY_BY_CONTEXT, foodSavedByContext);
    storageRemoveItem(KEY_FOOD_PER_DAY);
    storageRemoveItem(KEY_ZONE_COMPARE_FOOD);
  }

  function resetLootOverrideState() {
    if (lootOverrideFilter) lootOverrideFilter.value = "";
    setLootOverrideEnabled(false);
    lootPriceOverrides = {};
    saveLootPriceOverrides(lootPriceOverrides);
    void renderLootOverrideList();
  }

  async function resetAdvancedModeState() {
    // Clear only the currently selected dungeon+tier context.
    clearRunInputValues({ includeSimple: true });
    resetLootOverrideState();
    await resetManualKeyInputsToOfficial();

    updateChestEvUI();
    updateAllSummaries();
    await rerenderVisibleResults({ includeSimple: false });
    showToast(i18nT("ui.clearedInputsResetManualOfficial", "Cleared inputs and reset manual key prices to Official API."));
  }

  // ===== Reset =====
  resetBtn.addEventListener("click", async () => {
    if (advancedMode) {
      // Advanced-mode reset: clear only player inputs/overrides, keep current dungeon+tier/context.
      await resetAdvancedModeState();
      return;
    }

    resetToLanding();
  });

  // ===== Restore previous selection =====
  function restoreSelectionStateOnInit() {
    if (selectedDungeon) setSelectedDungeon(selectedDungeon);
    if (selectedTier) {
      setSelectedTier(selectedTier, { silent: true });
    } else if (selectedDungeon) {
      applyDungeonOnlyStage();
    } else {
      applyLandingStage();
    }
  }

  function initializeUiOnInit() {
    restoreSelectionStateOnInit();
    autoSelectFirstDungeonForTokenShop();
    applyPricingSelectionUi(pricingModel);
    updatePricingAvailability();

    // Start/stop the official hourly auto-refresh based on saved pricing mode.
    syncOfficialAutoRefreshForModel(pricingModel);

    updateAllSummaries();
    window.addEventListener("resize", updateMarkerPosition);
    window.setTimeout(updateMarkerPosition, 120);
  }

  initializeUiOnInit();

  // Creator tag: show only when scrolled to the bottom
  const creatorTag = document.getElementById("creatorTag");

  function getCreatorTagElement() {
    return creatorTag || document.getElementById("creatorTag");
  }

  function isDocumentScrollable(threshold = 20) {
    return document.documentElement.scrollHeight > window.innerHeight + threshold;
  }

  function updateCreatorTagVisibility() {
    const el = getCreatorTagElement();
    if (!el) return;

    const scrollPos = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    // If there's nothing to scroll, never show it
    const scrollable = isDocumentScrollable(20);
    if (!scrollable) {
      el.classList.remove("show");
      scheduleApiSourceFooterVisibility();
      return;
    }

    const nearBottom = scrollPos >= pageHeight - 12; // small threshold
    const hasScrolled = window.scrollY > 0;

    el.classList.toggle("show", nearBottom && hasScrolled);
    scheduleApiSourceFooterVisibility();
  }


  function bindCreatorTagVisibilityHandlers() {
    window.addEventListener("scroll", updateCreatorTagVisibility, { passive: true });
    window.addEventListener("resize", updateCreatorTagVisibility);
    updateCreatorTagVisibility();
  }

  let creatorTagPulseT;
  function pulseCreatorTag() {
    const el = getCreatorTagElement();
    if (!el) return;
    el.classList.add("show");
    scheduleApiSourceFooterVisibility();
    clearTimeout(creatorTagPulseT);
    creatorTagPulseT = setTimeout(() => {
      el.classList.remove("show");
      scheduleApiSourceFooterVisibility();
    }, 2200);
  }


  // Scroll can return to landing, but must be deliberate and must not clear inputs.
  const ENABLE_SCROLL_RETURN_TO_LANDING = false;
  const SCROLL_RETURN_ARM_Y = 180;
  const SCROLL_RETURN_TOP_Y = 6;
  const SCROLL_RETURN_CONFIRM_MS = 2200;
  const SCROLL_INTENT_COOLDOWN_MS = 450;
  const WHEEL_INTENT_MIN = 28;
  const TOUCH_INTENT_MIN = 64;
  // Return to landing when user scrolls back to top (only after dungeon+tier selected)
  let landingReturnArmed = false;
  let scrollTopReturnConfirmUntil = 0;
  function canScrollResetToLanding() {
    if (!ENABLE_SCROLL_RETURN_TO_LANDING) return false;
    return document.body.classList.contains("stage-tier") || document.body.classList.contains("stage-dungeon");
  }

  function handleScrollReturnToLanding() {
    if (!ENABLE_SCROLL_RETURN_TO_LANDING) {
      landingReturnArmed = false;
      return;
    }
    const now = Date.now();
    if (now < landingResetSuppressedUntil) {
      landingReturnArmed = false;
      return;
    }

    // Allow return while choosing tier or after tier is selected
    if (!canScrollResetToLanding()) {
      landingReturnArmed = false;
      return;
    }

    // Arm only after the user scrolls down enough.
    if (window.scrollY > SCROLL_RETURN_ARM_Y) {
      landingReturnArmed = true;
      scrollTopReturnConfirmUntil = 0;
    }

    // First trip back to top only arms confirmation; second up-intent performs return.
    if (landingReturnArmed && window.scrollY < SCROLL_RETURN_TOP_Y) {
      landingReturnArmed = false;
      scrollTopReturnConfirmUntil = now + SCROLL_RETURN_CONFIRM_MS;
      if (typeof showToast === "function") showToast(i18nT("ui.scrollUpAgainReturn", "Scroll up again to return to landing."));
    }
  }

  function bindScrollReturnToLandingHandlers() {
    window.addEventListener("scroll", handleScrollReturnToLanding, { passive: true });
    handleScrollReturnToLanding();
  }

  // ----- Scroll-intent fallback (works even when page can't scroll) -----
  function isPageScrollable() {
    return isDocumentScrollable(20);
  }

  let touchStartY = null;
  let lastIntentAt = 0;
  let noScrollReturnArmedUntil = 0;

  function isLandingResetSuppressed(now = Date.now()) {
    return now < landingResetSuppressedUntil;
  }

  function handleNoScrollCreatorTagIntent(direction) {
    if (direction === "down" && typeof pulseCreatorTag === "function") {
      pulseCreatorTag(); // shows briefly if you used the pulse version
    }
  }

  function handleNoScrollLandingResetIntent(direction, now) {
    if (isLandingResetSuppressed(now)) {
      noScrollReturnArmedUntil = 0;
      return;
    }

    if (direction === "up") {
      if (now < noScrollReturnArmedUntil) {
        noScrollReturnArmedUntil = 0;
        returnToLandingPreserveState();
      } else {
        noScrollReturnArmedUntil = now + SCROLL_RETURN_CONFIRM_MS;
        if (typeof showToast === "function") showToast(i18nT("ui.scrollUpAgainReturn", "Scroll up again to return to landing."));
      }
      return;
    }
    if (direction === "down") {
      // Downward intent disarms accidental pending reset.
      noScrollReturnArmedUntil = 0;
      scrollTopReturnConfirmUntil = 0;
    }
  }

  function handleScrollIntent(direction) {
    // direction: "down" or "up"
    const now = Date.now();
    if (now - lastIntentAt < SCROLL_INTENT_COOLDOWN_MS) return; // cooldown to reduce accidental triggers
    lastIntentAt = now;
    const scrollable = isPageScrollable();

    // Deliberate confirm at top: second upward intent returns to landing without clearing inputs.
    if (direction === "up" && canScrollResetToLanding() && window.scrollY < SCROLL_RETURN_TOP_Y && now < scrollTopReturnConfirmUntil) {
      scrollTopReturnConfirmUntil = 0;
      returnToLandingPreserveState();
      return;
    }

    // 1) Creator tag: if page isn't scrollable, treat "down" as "hit bottom"
    if (!scrollable) handleNoScrollCreatorTagIntent(direction);

    // 2) Return to landing (non-scrollable): require deliberate double-up intent
    if (!scrollable && canScrollResetToLanding()) {
      handleNoScrollLandingResetIntent(direction, now);
    } else {
      noScrollReturnArmedUntil = 0;
    }
  }

  function handleWheelIntent(e) {
    // deltaY > 0 => scroll down, deltaY < 0 => scroll up
    if (e.deltaY > WHEEL_INTENT_MIN) handleScrollIntent("down");
    else if (e.deltaY < -WHEEL_INTENT_MIN) handleScrollIntent("up");
  }

  function handleTouchIntentStart(e) {
    touchStartY = e.touches && e.touches[0] ? e.touches[0].clientY : null;
  }

  function handleTouchIntentMove(e) {
    if (touchStartY == null) return;
    const y = e.touches && e.touches[0] ? e.touches[0].clientY : null;
    if (y == null) return;

    const dy = y - touchStartY;

    // Finger moves up (dy negative) => user intends to scroll down
    if (dy < -TOUCH_INTENT_MIN) handleScrollIntent("down");

    // Finger moves down (dy positive) => user intends to scroll up
    if (dy > TOUCH_INTENT_MIN) handleScrollIntent("up");
  }

  function handleTouchIntentEnd() {
    touchStartY = null;
  }

  function bindScrollIntentFallbackHandlers() {
    // Mouse wheel / trackpad intent
    window.addEventListener("wheel", handleWheelIntent, { passive: true });

    // Touch intent (mobile)
    window.addEventListener("touchstart", handleTouchIntentStart, { passive: true });
    window.addEventListener("touchmove", handleTouchIntentMove, { passive: true });
    window.addEventListener("touchend", handleTouchIntentEnd, { passive: true });
  }

  bindCreatorTagVisibilityHandlers();
  bindScrollReturnToLandingHandlers();
  bindScrollIntentFallbackHandlers();

  function getPlayerParsedForApi() {
    return (typeof getPlayerParsed === "function") ? getPlayerParsed() : null;
  }

  function getRunsPerDayFromParsed(parsed) {
    return Number.isFinite(parsed?.ctNum) ? Calc.computeRunsPerDay(parsed.ctNum) : 0;
  }

  // ======= Public bridge for Dev Tools & shared calculator =======
  window.DungeonAPI = {
    getSelectedDungeon: () => (typeof selectedDungeon !== "undefined" ? selectedDungeon : null),
    getSelectedTier: () => (typeof selectedTier !== "undefined" ? selectedTier : null),
    getPricingModel: () => (typeof pricingModel !== "undefined" ? pricingModel : "official"),
    getClearMinutes: () => {
      const p = getPlayerParsedForApi();
      return p?.ctNum ?? NaN;
    },
    getRunsPerDay: () => {
      const p = getPlayerParsedForApi();
      return getRunsPerDayFromParsed(p);
    },
    combatBuffExtraRate: Calc.combatBuffExtraRate,
    getBuffTier: () => {
      const p = getPlayerParsedForApi();
      return p?.buffNum ?? 0;
    },
    getDefaultTaxPct: () => 2,
    getFoodPerRun: () => {
      const day = getFoodPerDayValue();
      const runs = (window.DungeonAPI && window.DungeonAPI.getRunsPerDay) ? window.DungeonAPI.getRunsPerDay() : 0;
      if (!Number.isFinite(day) || !Number.isFinite(runs) || runs <= 0) return 0;
      return day / runs;
    },

    getMarketSlim: (dungeonKey, source) => {
      const model = normalizeModelFromSource(source);
      return getSavedRecordByModel(dungeonKey, model)?.marketSlim || null;
    },
    getKeyPricesAB: (dungeonKey, source) => {
      const model = normalizeModelFromSource(source);
      return getPricesABForModel(dungeonKey, model);
    },
    refreshPricesForDungeon: async (dungeonKey, source, opts = {}) => {
      const model = normalizeModelFromSource(source || pricingModel);
      const apiSource = getEffectiveApiSource(model);
      return refreshApiSourceForDungeon(dungeonKey, apiSource, {
        silent: opts.silent !== false,
        reason: opts.reason || "zone-compare",
      });
    },
    refreshPricesForAllDungeons: async (source, opts = {}) => {
      const model = normalizeModelFromSource(source || pricingModel);
      const apiSource = getEffectiveApiSource(model);
      return refreshApiSourceForAllDungeons(apiSource, {
        silent: opts.silent !== false,
        reason: opts.reason || "zone-compare",
      });
    },
    ensureTokenShopDungeonSelection: () => autoSelectFirstDungeonForTokenShop(),
    getActiveLootOverrides: () => (typeof getActiveLootOverrides === "function" ? getActiveLootOverrides() : null),
    getOfficialEvCached: (dungeonKey, side) => (typeof getOfficialEvCached === "function" ? getOfficialEvCached(dungeonKey, side) : null),
  };

  function bindRangeToggleRerender(rangeEls, onRerender) {
    const list = Array.isArray(rangeEls) ? rangeEls.filter(Boolean) : [];
    if (!list.length) return;
    const rerender = (typeof onRerender === "function") ? onRerender : (() => { });

    const init = storageGetItem(KEY_RANGE_ENABLED);
    if (init === "1") {
      list.forEach((el) => { el.checked = true; });
    }

    list.forEach((el) => {
      el.addEventListener("change", () => {
        const on = !!el.checked;
        list.forEach((e) => { e.checked = on; });
        storageSetItem(KEY_RANGE_ENABLED, on ? "1" : "0");
        rerender();
      });
    });
  }

  function bindFoodPerDayRerender(foodEls, onRerender) {
    const list = Array.isArray(foodEls) ? foodEls.filter(Boolean) : [];
    if (!list.length) return;
    const rerender = (typeof onRerender === "function") ? onRerender : (() => { });

    const syncFromContext = () => {
      const v = normalizeFoodPerDayInput(
        storageGetItem(KEY_ZONE_COMPARE_FOOD) || storageGetItem(KEY_FOOD_PER_DAY) || ""
      ) || DEFAULT_FOOD_PER_DAY;
      if (v) storageSetItem(KEY_FOOD_PER_DAY, v);
      else storageRemoveItem(KEY_FOOD_PER_DAY);
      if (v) storageSetItem(KEY_ZONE_COMPARE_FOOD, v);
      else storageRemoveItem(KEY_ZONE_COMPARE_FOOD);
      list.forEach((el) => { if (String(el.value || "").trim() !== v) el.value = v; });
    };
    syncFromContext();

    const persistFood = (val) => {
      const v = String(val == null ? "" : val).trim();
      if (v) storageSetItem(KEY_FOOD_PER_DAY, v);
      else storageRemoveItem(KEY_FOOD_PER_DAY);
      if (v) storageSetItem(KEY_ZONE_COMPARE_FOOD, v);
      else storageRemoveItem(KEY_ZONE_COMPARE_FOOD);
      return v;
    };

    const commitLive = (el) => {
      const raw = String(el?.value == null ? "" : el.value);
      const v = persistFood(raw);
      list.forEach((peer) => {
        if (peer === el) return;
        if (String(peer.value || "") !== v) peer.value = v;
      });
      rerender();
    };

    const commitNormalized = (el) => {
      const v = normalizeFoodPerDayInput(el?.value);
      const stored = persistFood(v);
      list.forEach((peer) => { if (String(peer.value || "").trim() !== stored) peer.value = stored; });
      if (el && String(el.value || "").trim() !== stored) el.value = stored;
      rerender();
    };

    list.forEach((el) => {
      el.addEventListener("input", () => commitLive(el));
      el.addEventListener("change", () => commitNormalized(el));
      el.addEventListener("blur", () => commitNormalized(el));
    });

    document.addEventListener("dungeon:selection-changed", () => {
      syncFromContext();
    });
  }

  // === Range toggle and Consumables/day binding ===
  (function () {
    const rerender = () => {
      void rerenderVisibleResults();
    };

    const rangeEls = [document.getElementById("toggleRange"), advToggleRange].filter(Boolean);
    bindRangeToggleRerender(rangeEls, rerender);

    const foodEls = [document.getElementById("foodPerDay"), advFoodPerDay].filter(Boolean);
    bindFoodPerDayRerender(foodEls, rerender);
  })();



})();





