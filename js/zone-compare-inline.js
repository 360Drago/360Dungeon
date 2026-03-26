// js/zone-compare-inline.js
(() => {
  "use strict";

  const STYLE_ID = "zoneCompareInlineStyleV14";
  const TIERS = ["T0", "T1", "T2"];
  const STORAGE = {
    minutes: "dungeon.zoneCompare.minutes.v3",
    buff: "dungeon.zoneCompare.buff.v3",
    food: "dungeon.zoneCompare.food.v3",
    lowDrop: "dungeon.zoneCompare.removeLowDrops.v3",
    mirrorBackslot: "dungeon.zoneCompare.mirrorBackslot.v1",
  };
  const LEGACY_LOOT_STORAGE = {
    manualLoot: "dungeon.zoneCompare.manualLoot.v1",
    manualOverrides: "dungeon.zoneCompare.manualOverrides.v1",
  };
  const SHARED_LOOT_OVERRIDE_ENABLED_KEY = "dungeon.lootOverrideEnabled";
  const SHARED_LOOT_PRICE_OVERRIDES_KEY = "dungeon.lootPriceOverrides";
  const SHARED_FOOD_KEY = "dungeon.foodPerDay";
  const MIRROR_HRID = "/items/mirror_of_protection";
  const BACKSLOT_HRIDS = [
    "/items/enchanted_cloak",
    "/items/sinister_cape",
    "/items/chimerical_quiver",
  ];
  const UI_TO_SHORT = {
    chimerical_den: "chimerical",
    sinister_circus: "sinister",
    enchanted_fortress: "enchanted",
    pirate_cove: "pirate",
  };
  const CHESTS = {
    chimerical: { chest: "/items/chimerical_chest", refined: "/items/chimerical_refinement_chest" },
    sinister: { chest: "/items/sinister_chest", refined: "/items/sinister_refinement_chest" },
    enchanted: { chest: "/items/enchanted_chest", refined: "/items/enchanted_refinement_chest" },
    pirate: { chest: "/items/pirate_chest", refined: "/items/pirate_refinement_chest" },
  };
  const LARGE_CHEST_HRID = "/items/large_treasure_chest";
  const FALLBACK_ZONES = [
    { key: "chimerical_den", title: "Chimerical Den", icon: "./assets/Svg/Chimerical_den.svg", accent: "#34d399" },
    { key: "sinister_circus", title: "Sinister Circus", icon: "./assets/Svg/Sinister_circus.svg", accent: "#f472b6" },
    { key: "enchanted_fortress", title: "Enchanted Fortress", icon: "./assets/Svg/Enchanted_fortress.svg", accent: "#a78bfa" },
    { key: "pirate_cove", title: "Pirate Cove", icon: "./assets/Svg/Pirate_cove.svg", accent: "#fb923c" },
  ];

  let state = loadState();
  let calcRunToken = 0;
  let apiWarnings = [];
  let apiWarningsOpen = false;
  let minutesPlaceholderMeasureCanvas = null;

  function getShared(name) {
    return window[name] || null;
  }

  function getTextShared() {
    return getShared("DungeonTextShared");
  }

  function t(key, fallback) {
    const translate = getTextShared()?.t;
    if (typeof translate === "function") return translate(key, fallback);
    return fallback;
  }

  function tf(key, fallback, vars = {}) {
    const translateFormat = getTextShared()?.tf;
    if (typeof translateFormat === "function") return translateFormat(key, fallback, vars);
    return String(fallback || "");
  }

  function getMinutesPlaceholderText() {
    return t("ui.minutesWord", "Minutes");
  }

  function getMinutesPlaceholderShortText() {
    return t("ui.min", "Min");
  }

  function measureTextWidthPx(text, font) {
    const label = String(text || "");
    if (!label) return 0;
    const canvas = minutesPlaceholderMeasureCanvas || document.createElement("canvas");
    minutesPlaceholderMeasureCanvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return label.length * 8;
    ctx.font = font;
    return ctx.measureText(label).width;
  }

  function resolveMinutesPlaceholderForInput(input) {
    const longLabel = getMinutesPlaceholderText();
    const shortLabel = getMinutesPlaceholderShortText();
    if (!input) return longLabel;
    const style = window.getComputedStyle(input);
    const font = style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const padLeft = Number.parseFloat(style.paddingLeft) || 0;
    const padRight = Number.parseFloat(style.paddingRight) || 0;
    const availableWidth = Math.max(0, input.clientWidth - padLeft - padRight - 2);
    return measureTextWidthPx(longLabel, font) <= availableWidth ? longLabel : shortLabel;
  }

  function syncZoneMinutePlaceholders(root = byId("zoneCompareInline")) {
    const host = root || byId("zoneCompareInline");
    if (!host) return;
    host.querySelectorAll(".zcTierInput").forEach((input) => {
      input.placeholder = resolveMinutesPlaceholderForInput(input);
    });
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function getNumberShared() {
    return getShared("DungeonNumberShared");
  }

  function getPlayerInputShared() {
    return getShared("DungeonPlayerInputShared");
  }

  function getItemHridShared() {
    return getShared("DungeonItemHridShared");
  }

  function getMarketShared() {
    return getShared("DungeonMarketShared");
  }

  function storageCall(methodName, ...args) {
    const method = getStorageShared()?.[methodName];
    if (typeof method === "function") return method(...args);
    return localStorage[methodName](...args);
  }

  function storageGet(key) {
    return storageCall("getItem", key);
  }

  function storageSet(key, val) {
    storageCall("setItem", key, val);
  }

  function parseJSON(raw, fallback) {
    if (raw == null || raw === "") return fallback;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function asText(v) {
    return String(v == null ? "" : v).trim();
  }

  function normalizeLootOverrideEntry(raw) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric >= 0) return Math.round(numeric);
    if (!raw || typeof raw !== "object") return null;
    const mode = asText(raw.mode).toLowerCase();
    if (mode === "bid") return { mode: "Bid" };
    if (mode === "ask") return { mode: "Ask" };
    if (mode === "custom") {
      const price = Number(raw.price);
      if (Number.isFinite(price) && price >= 0) return { mode: "Custom", price: Math.round(price) };
    }
    return null;
  }

  function normalizeLootOverrideMap(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const [hrid, value] of Object.entries(raw)) {
      const key = asText(hrid);
      if (!key) continue;
      const normalized = normalizeLootOverrideEntry(value);
      if (normalized != null) out[key] = normalized;
    }
    return out;
  }

  function getCustomLootOverrideValue(raw) {
    const normalized = normalizeLootOverrideEntry(raw);
    if (typeof normalized === "number") return normalized;
    if (normalized && typeof normalized === "object" && asText(normalized.mode).toLowerCase() === "custom") {
      const price = Number(normalized.price);
      if (Number.isFinite(price) && price >= 0) return Math.round(price);
    }
    return NaN;
  }

  function loadSharedLootOverrideState() {
    const sharedEnabledRaw = storageGet(SHARED_LOOT_OVERRIDE_ENABLED_KEY);
    const sharedOverridesRawText = storageGet(SHARED_LOOT_PRICE_OVERRIDES_KEY);
    const sharedOverrides = normalizeLootOverrideMap(parseJSON(sharedOverridesRawText, null));
    const hasSharedState = sharedEnabledRaw != null || (sharedOverridesRawText != null && asText(sharedOverridesRawText) !== "");
    if (hasSharedState) {
      return {
        manualLoot: sharedEnabledRaw === "1",
        manualOverrides: sharedOverrides,
      };
    }

    const legacyEnabled = storageGet(LEGACY_LOOT_STORAGE.manualLoot) === "1";
    const legacyOverrides = normalizeLootOverrideMap(parseJSON(storageGet(LEGACY_LOOT_STORAGE.manualOverrides), null));
    if (legacyEnabled || Object.keys(legacyOverrides).length) {
      try {
        storageSet(SHARED_LOOT_OVERRIDE_ENABLED_KEY, legacyEnabled ? "1" : "0");
        storageSet(SHARED_LOOT_PRICE_OVERRIDES_KEY, JSON.stringify(legacyOverrides));
      } catch (_) { }
    }
    return {
      manualLoot: legacyEnabled,
      manualOverrides: legacyOverrides,
    };
  }

  function persistSharedLootOverrideState() {
    const normalized = normalizeLootOverrideMap(state.manualOverrides || {});
    state.manualOverrides = normalized;
    storageSet(SHARED_LOOT_OVERRIDE_ENABLED_KEY, state.manualLoot ? "1" : "0");
    storageSet(SHARED_LOOT_PRICE_OVERRIDES_KEY, JSON.stringify(normalized));
  }

  function syncLocalLootOverrideState() {
    const sharedState = loadSharedLootOverrideState();
    state.manualLoot = !!sharedState.manualLoot;
    state.manualOverrides = sharedState.manualOverrides || {};
    return sharedState;
  }

  function dispatchLootOverrideStateChanged() {
    try {
      document.dispatchEvent(new CustomEvent("dungeon:loot-overrides-changed", {
        detail: {
          enabled: !!state.manualLoot,
          overrides: normalizeLootOverrideMap(state.manualOverrides || {}),
          source: "zone-compare",
        },
      }));
    } catch (_) { }
  }

  function clampBuff(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 20;
    return Math.max(0, Math.min(20, Math.round(n)));
  }

  function buildDefaultMinutes() {
    const out = {};
    for (const z of FALLBACK_ZONES) out[z.key] = { T0: "", T1: "", T2: "" };
    return out;
  }

  function normalizeMinutes(raw) {
    const base = buildDefaultMinutes();
    if (!raw || typeof raw !== "object") return base;
    for (const zoneKey of Object.keys(raw)) {
      if (!base[zoneKey]) base[zoneKey] = { T0: "", T1: "", T2: "" };
      const per = raw[zoneKey];
      for (const t of TIERS) base[zoneKey][t] = asText(per?.[t] || "");
    }
    return base;
  }

  function loadState() {
    const sharedLootState = loadSharedLootOverrideState();
    const rawBuff = storageGet(STORAGE.buff);
    const buffDefaulted = (rawBuff == null || asText(rawBuff) === "") ? 20 : clampBuff(rawBuff);
    const rawFoodShared = storageGet(SHARED_FOOD_KEY);
    const rawFoodLocal = storageGet(STORAGE.food);
    const rawFood = (rawFoodShared != null && asText(rawFoodShared) !== "") ? rawFoodShared : rawFoodLocal;
    const foodDefaulted = (rawFood == null || asText(rawFood) === "") ? "10m" : asText(rawFood);
    const foodNormalized = normalizeFoodInput(foodDefaulted) || "10m";

    return {
      minutes: normalizeMinutes(parseJSON(storageGet(STORAGE.minutes), null)),
      buff: buffDefaulted,
      food: foodNormalized,
      lowDrop: storageGet(STORAGE.lowDrop) === "1",
      manualLoot: !!sharedLootState.manualLoot,
      manualOverrides: sharedLootState.manualOverrides || {},
      mirrorBackslot: storageGet(STORAGE.mirrorBackslot) === "1",
    };
  }

  function persistState(opts = {}) {
    const { emitLootOverrides = false } = opts || {};
    try {
      storageSet(STORAGE.minutes, JSON.stringify(state.minutes || {}));
      storageSet(STORAGE.buff, String(clampBuff(state.buff)));
      storageSet(STORAGE.food, asText(state.food || ""));
      storageSet(SHARED_FOOD_KEY, asText(state.food || ""));
      storageSet(STORAGE.lowDrop, state.lowDrop ? "1" : "0");
      persistSharedLootOverrideState();
      storageSet(STORAGE.mirrorBackslot, state.mirrorBackslot ? "1" : "0");
    } catch (_) { }
    if (emitLootOverrides) dispatchLootOverrideStateChanged();
  }

  function ensureZoneState(zoneKey) {
    if (!state.minutes || typeof state.minutes !== "object") state.minutes = {};
    if (!state.minutes[zoneKey] || typeof state.minutes[zoneKey] !== "object") {
      state.minutes[zoneKey] = { T0: "", T1: "", T2: "" };
    }
    for (const t of TIERS) {
      if (typeof state.minutes[zoneKey][t] !== "string") state.minutes[zoneKey][t] = asText(state.minutes[zoneKey][t] || "");
    }
  }

  function shortForUiKey(uiKey) {
    const meta = getShared("DungeonMetaShared");
    if (meta && typeof meta.shortForUiOrSelf === "function") return meta.shortForUiOrSelf(uiKey);
    return UI_TO_SHORT[uiKey] || uiKey;
  }

  function readZones() {
    const cards = Array.from(document.querySelectorAll(".card[data-dungeon]"));
    if (!cards.length) {
      return FALLBACK_ZONES.map((z) => ({
        ...z,
        title: t(`d.${z.key}`, z.title),
        short: shortForUiKey(z.key),
      }));
    }

    return cards.map((card, i) => {
      const key = asText(card.getAttribute("data-dungeon"));
      const titleFromCard = asText(card.querySelector("h2")?.textContent || "");
      const title = titleFromCard || t(`d.${key}`, key);
      const icon = card.querySelector(".icon img")?.getAttribute("src") || FALLBACK_ZONES[i]?.icon || "";
      const accent = getComputedStyle(card).getPropertyValue("--card-accent").trim() || FALLBACK_ZONES[i]?.accent || "#34d399";
      return { key, title, icon, accent, short: shortForUiKey(key) };
    }).filter((z) => z.key);
  }

  function getUiStateShared() {
    return getShared("DungeonUiStateShared");
  }

  function hideAndClear(el) {
    const shared = getUiStateShared();
    if (shared && typeof shared.hideAndClear === "function") {
      shared.hideAndClear(el);
      return;
    }
    if (!el) return;
    el.hidden = true;
    el.innerHTML = "";
  }

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #zoneCompareInline { width:100%!important; border:0!important; background:transparent!important; box-shadow:none!important; padding:0!important; border-radius:0!important; }
      body.zone-compare-active .cardStage,
      body.zone-compare-active #selectionBar { display:none !important; }
      #zoneCompareInline .zcGrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; max-width:1100px; margin:0 auto; justify-content:center; }
      #zoneCompareInline .zcCard { border:1px solid rgba(255,255,255,.12); border-radius:16px; background:rgba(0,0,0,.18); padding:10px; }
      #zoneCompareInline .zcHead { display:grid; grid-template-columns:24px 1fr; align-items:center; gap:8px; margin-bottom:8px; }
      #zoneCompareInline .zcHead img { width:24px; height:24px; object-fit:contain; }
      #zoneCompareInline .zcHead h4 { margin:0; font-size:13px; line-height:1.2; }
      #zoneCompareInline .zcAfter { border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:8px; margin-bottom:8px; }
      #zoneCompareInline .zcAfterHead { display:flex; align-items:center; gap:6px; margin:0 0 4px; }
      #zoneCompareInline .zcAfterHead p { margin:0; color:var(--muted-color); font-size:11px; }
      #zoneCompareInline .zcAfterHead .zcInfo { width:16px; height:16px; font-size:10px; }
      #zoneCompareInline .zcLine { display:flex; justify-content:space-between; gap:8px; font-size:12px; color:var(--muted-color); }
      #zoneCompareInline .zcLine span:last-child { color:var(--title-color); font-variant-numeric:tabular-nums; font-weight:700; }
      #zoneCompareInline .zcRange { display:inline-flex; align-items:center; gap:4px; justify-content:flex-end; }
      #zoneCompareInline .zcRangeSide { font-variant-numeric:tabular-nums; }
      #zoneCompareInline .zcRangeSep { color:var(--muted-color); opacity:.7; }
      #zoneCompareInline .zcNeg { color:#ef4444!important; font-weight:700; }
      #zoneCompareInline .zcTier { border:1px solid rgba(255,255,255,.10); border-radius:12px; padding:8px; }
      #zoneCompareInline .zcTierHead { display:grid; grid-template-columns:1fr auto; gap:10px; margin-bottom:6px; color:var(--muted-color); font-size:11px; }
      #zoneCompareInline .zcTierRow { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(96px,0.55fr); gap:10px; align-items:center; padding:4px 6px; margin:1px -6px; border:1px solid transparent; border-radius:10px; }
      #zoneCompareInline .zcTierRow.zcBestRow { border-color:rgba(250,204,21,.95); background:rgba(250,204,21,.08); box-shadow:inset 0 0 0 1px rgba(250,204,21,.26); }
      #zoneCompareInline .zcTierInputWrap { display:grid; grid-template-columns:34px minmax(0,72px); gap:8px; align-items:center; }
      #zoneCompareInline .zcTag { border:1px solid color-mix(in srgb, var(--zc-accent) 65%, transparent); color:var(--zc-accent); border-radius:999px; font-size:11px; font-weight:700; text-align:center; padding:3px 0; }
      #zoneCompareInline .zcInput { width:100%; border:1px solid rgba(255,255,255,.16); border-radius:12px; background:rgba(0,0,0,.22); color:rgba(255,255,255,.92); padding:7px 10px; }
      #zoneCompareInline .zcInput:focus { outline:none; border-color:color-mix(in srgb, var(--accent) 55%, white 10%); box-shadow:0 0 0 2px rgba(52,211,153,.15); }
      #zoneCompareInline .zcTierInput { height:32px; padding:6px 8px; text-align:center; }
      #zoneCompareInline .zcProfitWrap { display:inline-flex; align-items:center; gap:6px; justify-content:flex-end; }
      #zoneCompareInline .zcProfit { min-width:0; text-align:right; font-size:12px; font-weight:700; color:var(--title-color); font-variant-numeric:tabular-nums; }
      #zoneCompareInline .zcProfitPos { color:#22c55e; }
      #zoneCompareInline .zcProfitNeg { color:#ef4444; }
      #zoneCompareInline .zcInfo { position:relative; width:18px; height:18px; border-radius:50%; border:1px solid rgba(255,255,255,.24); background:rgba(255,255,255,.04); color:var(--muted-color); font-size:11px; font-weight:700; line-height:1; padding:0; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
      #zoneCompareInline .zcInfoGlyph { display:inline-block; transform:translateY(-.5px); }
      #zoneCompareInline .zcInfoCopyGlyph::before { content:"i"; }
      #zoneCompareInline .zcInfo[data-copy-planner="1"] {
        transition:
          border-color .16s ease,
          color .16s ease,
          background .16s ease,
          box-shadow .18s ease,
          transform .16s ease;
      }
      #zoneCompareInline .zcInfo:not(.has-tip) { opacity:.4; }
      #zoneCompareInline .zcInfo[data-copy-planner="1"]:hover,
      #zoneCompareInline .zcInfo[data-copy-planner="1"]:focus-visible,
      #zoneCompareInline .zcInfo[data-copy-planner="1"].is-open {
        border-color: color-mix(in srgb, #7ab8ff 72%, rgba(255,255,255,.2));
        background: color-mix(in srgb, #7ab8ff 16%, rgba(255,255,255,.05));
        color: #7ab8ff;
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, #7ab8ff 22%, transparent),
          0 6px 18px color-mix(in srgb, #7ab8ff 18%, transparent);
        transform: translateY(-1px);
      }
      #zoneCompareInline .zcInfo[data-copy-planner="1"]:hover .zcInfoCopyGlyph::before,
      #zoneCompareInline .zcInfo[data-copy-planner="1"]:focus-visible .zcInfoCopyGlyph::before,
      #zoneCompareInline .zcInfo[data-copy-planner="1"].is-open .zcInfoCopyGlyph::before {
        content:"↗";
        font-size: 12px;
        font-weight: 800;
        text-shadow: 0 0 10px color-mix(in srgb, #7ab8ff 22%, transparent);
      }
      #zoneCompareInline .zcInfoTip {
        position:absolute;
        inset-inline-start:50%;
        bottom:calc(100% + 10px);
        transform:translateX(-50%) translateY(8px);
        width:max-content;
        min-width:250px;
        max-width:420px;
        white-space:pre-line;
        padding:10px 12px;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.12);
        background:rgba(0,0,0,.55);
        backdrop-filter:blur(10px);
        color:rgba(255,255,255,.88);
        text-align:left;
        font-size:12px;
        line-height:1.32;
        font-weight:400;
        letter-spacing:.01em;
        font-family:inherit;
        opacity:0;
        visibility:hidden;
        pointer-events:none;
        transition:opacity .16s ease, transform .16s ease;
        z-index:70;
      }
      #zoneCompareInline .zcInfoTip::after {
        content:"";
        position:absolute;
        inset-inline-start:50%;
        top:100%;
        transform:translateX(-50%);
        border:7px solid transparent;
        border-top-color:rgba(0,0,0,.55);
      }
      #zoneCompareInline .zcInfo.has-tip:hover .zcInfoTip,
      #zoneCompareInline .zcInfo.has-tip:focus-visible .zcInfoTip,
      #zoneCompareInline .zcInfo.has-tip.is-open .zcInfoTip {
        opacity:1;
        visibility:visible;
        transform:translateX(-50%) translateY(0);
      }
      #zoneCompareInline .zcInfoTipNeg { color:#ef4444; font-weight:700; }
      #zoneCompareInline .zcPill { margin-top:12px; border:1px solid rgba(255,255,255,.12); border-radius:999px; background:rgba(255,255,255,.03); padding:10px 14px; display:grid; grid-template-columns:minmax(170px,0.65fr) minmax(230px,1fr) auto auto auto auto; gap:10px; align-items:center; }
      #zoneCompareInline .zcBuffWrap { display:grid; grid-template-columns:auto 72px; gap:10px; align-items:center; }
      #zoneCompareInline .zcFoodWrap { display:grid; grid-template-columns:auto minmax(0,1fr); gap:10px; align-items:center; }
      #zoneCompareInline .zcLabel { margin:0; color:var(--muted-color); font-size:13px; white-space:nowrap; }
      #zoneCompareInline .zcLabel span { color:var(--title-color); font-weight:700; }
      #zoneCompareInline .zcCheckWrap { display:flex; align-items:center; }
      #zoneCompareInline .zcCheck { margin:0; }
      #zoneCompareInline .zcCheck .modeTglText { width:auto; }
      #zoneCompareInline .zcAct { display:contents; }
      #zoneCompareInline .zcAct .simBtn { min-width:132px; }
      #zoneCompareInline .zcAct .miniBtn { min-width:94px; }
      #zoneCompareInline .zcAct > button { align-self:center; }
      #zoneCompareInline .zcAct .miniBtn.zcResetArmed { border-color:rgba(248,113,113,.8); color:#fecaca; background:rgba(127,29,29,.25); font-size:11px; letter-spacing:.01em; transform:scale(.97); transform-origin:center; }
      #zoneCompareInline .zcStatus { margin-top:8px; }
      #zoneCompareInline .zcStatus.zcError { color:#ef4444; }
      #zoneCompareInline .lootOverrideSection {
        max-width:1100px;
        margin:14px auto 0;
        background:
          linear-gradient(180deg, rgba(255,255,255,.035) 0%, rgba(255,255,255,.015) 100%);
        border:1px solid rgba(255,255,255,.10);
        border-radius:18px;
        box-shadow:0 10px 30px rgba(0,0,0,.18);
        padding:14px 16px;
      }
      #zoneCompareInline .lootOverrideSection .row { margin-top:10px; }
      #zoneCompareInline .lootOverrideSection > .row.spread:first-child { margin-top:0; }
      #zoneCompareInline .lootOverrideFilterField { flex:1 1 420px; min-width:220px; margin-top:0; }
      #zoneCompareInline .lootOverrideFilterField label { display:block; }
      #zoneCompareInline .lootOverrideList { max-height:260px; }
      #zoneCompareInline .zcWarn { color:#f59e0b; }
      #zoneCompareInline .zcWarnWrap {
        max-width:1100px;
        margin:8px auto 0;
        border:1px solid rgba(239,68,68,.38);
        border-radius:10px;
        background:rgba(127,29,29,.18);
      }
      #zoneCompareInline .zcWarnToggle {
        width:100%;
        border:0;
        background:transparent;
        color:#fca5a5;
        padding:8px 10px;
        display:flex;
        align-items:center;
        gap:8px;
        font-size:12px;
        font-weight:700;
        cursor:pointer;
        text-align:left;
      }
      #zoneCompareInline .zcWarnCarrot {
        font-size:11px;
        line-height:1;
        transition:transform .16s ease;
      }
      #zoneCompareInline .zcWarnToggle[aria-expanded="true"] .zcWarnCarrot {
        transform:rotate(90deg);
      }
      #zoneCompareInline .zcWarnBody {
        color:#fecaca;
        font-size:12px;
        line-height:1.35;
        white-space:pre-line;
        padding:0 10px 10px;
      }
      @media (max-width:1280px) {
        #zoneCompareInline .zcGrid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        #zoneCompareInline .zcPill { grid-template-columns:1fr 1fr; border-radius:22px; }
      }
      @media (max-width:760px) {
        #zoneCompareInline .zcGrid { grid-template-columns:1fr; }
        #zoneCompareInline .zcPill { grid-template-columns:1fr; border-radius:16px; }
        #zoneCompareInline .zcBuffWrap, #zoneCompareInline .zcFoodWrap { grid-template-columns:1fr; gap:6px; }
        #zoneCompareInline .zcAct { display:contents; }
        #zoneCompareInline .zcAct .simBtn, #zoneCompareInline .zcAct .miniBtn { width:100%; min-width:0; }
      }
      html[data-theme="light"] #zoneCompareInline .zcCard { background:var(--surface-elev-1); border-color:var(--card-border-color); }
      html[data-theme="light"] #zoneCompareInline .zcAfter, html[data-theme="light"] #zoneCompareInline .zcTier { border-color:var(--neutral-border); }
      html[data-theme="light"] #zoneCompareInline .zcPill { background:rgba(255,255,255,.6); border-color:var(--neutral-border); }
      html[data-theme="light"] #zoneCompareInline .lootOverrideSection {
        background:rgba(255,255,255,.74);
        border-color:var(--card-border-color);
        box-shadow:0 10px 24px rgba(59,66,82,.08);
      }
      html[data-theme="light"] #zoneCompareInline .zcLine, html[data-theme="light"] #zoneCompareInline .zcAfter p, html[data-theme="light"] #zoneCompareInline .zcTierHead, html[data-theme="light"] #zoneCompareInline .zcLabel, html[data-theme="light"] #zoneCompareInline .zcInfo { color:rgba(31,41,55,.82); }
      html[data-theme="light"] #zoneCompareInline .zcLine span:last-child, html[data-theme="light"] #zoneCompareInline .zcProfit { color:rgba(31,41,55,.96); }
      html[data-theme="light"] #zoneCompareInline .zcRangeSep { color:rgba(31,41,55,.65); }
      html[data-theme="light"] #zoneCompareInline .zcInput { background:#fff; border-color:var(--neutral-border); color:rgba(31,41,55,.96); }
      html[data-theme="light"] #zoneCompareInline .zcInfoTip { background:var(--tooltip-bg); border-color:var(--tooltip-border); color:var(--tooltip-text); box-shadow:0 14px 34px var(--shadow-strong); }
      html[data-theme="light"] #zoneCompareInline .zcInfoTip::after { border-top-color:var(--tooltip-bg); }
      html[data-theme="light"] #zoneCompareInline .zcInfo[data-copy-planner="1"]:hover,
      html[data-theme="light"] #zoneCompareInline .zcInfo[data-copy-planner="1"]:focus-visible,
      html[data-theme="light"] #zoneCompareInline .zcInfo[data-copy-planner="1"].is-open {
        border-color: color-mix(in srgb, #2563eb 60%, rgba(31,41,55,.24));
        background: color-mix(in srgb, #60a5fa 14%, rgba(255,255,255,.92));
        color: #2563eb;
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, #60a5fa 26%, transparent),
          0 8px 18px rgba(37, 99, 235, 0.12);
      }
      html[data-theme="light"] #zoneCompareInline .zcAct .miniBtn.zcResetArmed { border-color:rgba(220,38,38,.6); color:#991b1b; background:rgba(254,202,202,.55); font-size:11px; }
      html[data-theme="light"] #zoneCompareInline .zcTierRow.zcBestRow { border-color:rgba(202,138,4,.92); background:rgba(250,204,21,.18); box-shadow:inset 0 0 0 1px rgba(202,138,4,.24); }
      html[data-theme="light"] #zoneCompareInline .zcWarnWrap { border-color:rgba(220,38,38,.35); background:rgba(254,226,226,.75); }
      html[data-theme="light"] #zoneCompareInline .zcWarnToggle { color:#b91c1c; }
      html[data-theme="light"] #zoneCompareInline .zcWarnBody { color:#7f1d1d; }
    `;
    document.head.appendChild(style);
  }

  function cardHtml(zone) {
    const chestProfitTip = t(
      "ui.afterKeyPricesTip",
      "Estimated chest value after key costs.\nNormal subtracts entry and chest key costs.\nRefined subtracts chest key cost only.\nRange shows lower and higher market outcomes."
    );
    const tierRows = TIERS.map((tier) => `
      <div class="zcTierRow" data-zone="${zone.key}" data-tier="${tier}">
        <div class="zcTierInputWrap">
          <span class="zcTag">${tier}</span>
          <input id="zcMin-${zone.key}-${tier}" class="zcInput zcTierInput" type="text" inputmode="decimal" maxlength="4" placeholder="${getMinutesPlaceholderText()}" aria-label="${tf("aria.zoneCompareClearMinutes", "{zone} {tier} clear minutes", { zone: zone.title, tier })}" />
        </div>
        <div class="zcProfitWrap">
          <span id="zcProfit-${zone.key}-${tier}" class="zcProfit">-</span>
          <button id="zcTip-${zone.key}-${tier}" class="zcInfo" type="button" aria-label="${tf("aria.zoneCompareDetails", "{zone} {tier} details", { zone: zone.title, tier })}" aria-expanded="false">
            <span class="zcInfoGlyph zcInfoCopyGlyph" aria-hidden="true"></span>
            <span class="zcInfoTip" role="tooltip" hidden></span>
          </button>
        </div>
      </div>
    `).join("");

    return `
      <article class="zcCard" data-zone="${zone.key}" style="--zc-accent:${zone.accent};">
        <header class="zcHead">
          <img src="${zone.icon}" alt="" loading="lazy" onerror="this.style.display='none'" />
          <h4>${zone.title}</h4>
        </header>
        <section class="zcAfter">
          <div class="zcAfterHead">
            <p>${t("ui.afterKeyPrices", "Chest Profit")}</p>
            <button class="zcInfo has-tip" type="button" aria-label="${escAttr(t("ui.afterKeyPricesAria", "Chest profit explanation"))}" aria-expanded="false">
              <span class="zcInfoGlyph" aria-hidden="true">i</span>
              <span class="zcInfoTip" role="tooltip">${escText(chestProfitTip)}</span>
            </button>
          </div>
          <div class="zcLine">
            <span>${t("ui.normal", "Normal")}</span>
            <span class="zcRange">
              <span id="zcAfterNLow-${zone.key}" class="zcRangeSide">-</span>
              <span class="zcRangeSep">-</span>
              <span id="zcAfterNHigh-${zone.key}" class="zcRangeSide">-</span>
            </span>
          </div>
          <div class="zcLine">
            <span>${t("ui.refined", "Refined")}</span>
            <span class="zcRange">
              <span id="zcAfterRLow-${zone.key}" class="zcRangeSide">-</span>
              <span class="zcRangeSep">-</span>
              <span id="zcAfterRHigh-${zone.key}" class="zcRangeSide">-</span>
            </span>
          </div>
        </section>
        <section class="zcTier">
          <div class="zcTierHead"><span>${t("ui.clearTime", "Clear Time")}</span><span>${t("ui.dailyProfit", "Daily Profit")}</span></div>
          ${tierRows}
        </section>
      </article>
    `;
  }

  function panelHtml(zones) {
    return `
      <div class="zcGrid">${zones.map(cardHtml).join("")}</div>
      <div class="zcPill">
        <div class="zcBuffWrap">
          <label class="zcLabel" for="zcBuff">${t("ui.combatBuffTitle", "Combat Buff")}</label>
          <input id="zcBuff" class="zcInput" type="text" inputmode="decimal" placeholder="20" />
        </div>
        <div class="zcFoodWrap">
          <label class="zcLabel" for="zcFood">${t("ui.consumablesDay", "Consumables / day")}</label>
          <input id="zcFood" class="zcInput" type="text" inputmode="decimal" placeholder="${t("ui.putNumberHere", "Put your number in here")}" />
        </div>
        <div class="zcCheckWrap">
          <input id="zcLowDrop" class="modeTglInp" type="checkbox" />
          <label class="modeTgl zcCheck" for="zcLowDrop">
            <span class="modeTglBox" aria-hidden="true">
              <svg width="12" height="10" viewBox="0 0 12 10"><polyline points="1.5 6 4.5 9 10.5 1"></polyline></svg>
            </span>
            <span class="modeTglText">${t("ui.removeOnePercentDrops", "Remove 1% drops")}</span>
          </label>
        </div>
        <div class="zcCheckWrap">
          <input id="zcMirrorBackslot" class="modeTglInp" type="checkbox" />
          <label class="modeTgl zcCheck" for="zcMirrorBackslot">
            <span class="modeTglBox" aria-hidden="true">
              <svg width="12" height="10" viewBox="0 0 12 10"><polyline points="1.5 6 4.5 9 10.5 1"></polyline></svg>
            </span>
            <span class="modeTglText">${t("ui.backEqualsMirror", "Back = Mirror")}</span>
          </label>
        </div>
        <div class="zcAct">
          <button id="zcReset" class="miniBtn" type="button">${t("ui.reset", "Reset")}</button>
          <button id="zcCalc" class="simBtn" type="button">${t("ui.calculate", "Calculate")}</button>
        </div>
      </div>
      <section id="zcLootOverrideSection" class="lootOverrideSection">
        <div class="row spread">
          <div>
            <div class="muted small">${t("ui.manualLootPrices", "Manual loot prices")}</div>
            <div class="muted small">${t("ui.overrideDropValues", "Override specific drop values used for EV calculations.")}</div>
          </div>
          <div class="checkSlide tipHost" id="zcManualLootToggleHost" data-tip="">
            <input type="checkbox" id="zcManualLootToggle" />
            <label for="zcManualLootToggle" aria-label="${t("aria.manualLootToggle", "Manual loot prices toggle")}"></label>
          </div>
        </div>
        <div class="lootOverrideControls">
          <div class="row spread">
            <div class="field lootOverrideFilterField">
              <label for="zcManualLootFilter">${t("ui.filterItems", "Filter items")}</label>
              <input id="zcManualLootFilter" type="text" inputmode="search" placeholder="${t("ui.typeToSearch", "Type to search...")}" />
            </div>
            <button class="ghostBtn tipHost" type="button" id="zcLootOverrideResetBtn" data-tip="${t("ui.officialApiPrices", "Current API Prices")}">${t("ui.resetLootPrices", "Reset Loot Prices")}</button>
          </div>
          <div class="fieldHint muted small" id="zcLootOverrideHint">
            ${t("ui.pricesShownMarket", "Prices shown are current market values (placeholder). Enter a value to override. Leave blank to use the market.")}
          </div>
        </div>
        <div class="lootOverrideList" id="zcLootOverrideList" role="list"></div>
      </section>
      <div id="zcStatus" class="zcStatus muted small" role="status" aria-live="polite" aria-atomic="true">${t("ui.enterTierClearThenCalc", "Enter any tier clear times, then Calculate.")}</div>
      <div id="zcWarnWrap" class="zcWarnWrap" hidden>
        <button id="zcWarnToggle" class="zcWarnToggle" type="button" aria-expanded="false">
          <span class="zcWarnCarrot">&#9656;</span>
          <span>${t("ui.apiWarnings", "API warnings")}</span>
        </button>
        <div id="zcWarnBody" class="zcWarnBody" hidden></div>
      </div>
    `;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function fmtCoins(v) {
    if (!Number.isFinite(v)) return "-";
    const shared = getNumberShared();
    const abs = Math.abs(v);
    let compact = "";
    if (shared && typeof shared.formatCoinsCompact === "function") {
      compact = String(shared.formatCoinsCompact(abs) || "").replace(/^-+/, "");
    } else if (abs >= 1e9) {
      compact = `${(abs / 1e9).toFixed(1).replace(/\\.0$/, "")}b`;
    } else if (abs >= 1e6) {
      compact = `${(abs / 1e6).toFixed(1).replace(/\\.0$/, "")}m`;
    } else if (abs >= 1e3) {
      compact = `${(abs / 1e3).toFixed(1).replace(/\\.0$/, "")}k`;
    } else {
      compact = `${Math.round(abs).toLocaleString()}`;
    }
    if (v < 0) return `(-${compact})`;
    return compact;
  }

  function parseMinutes(raw) {
    const shared = getPlayerInputShared();
    if (shared && typeof shared.parsePositiveMinutes === "function") return shared.parsePositiveMinutes(raw);
    const txt = asText(raw);
    const num = txt === "" ? NaN : Number(txt);
    return { num, ok: Number.isFinite(num) && num > 0 };
  }

  function normalizeFoodInput(raw) {
    const shared = getNumberShared();
    if (shared && typeof shared.normalizeFoodPerDayInput === "function") {
      return shared.normalizeFoodPerDayInput(raw);
    }
    if (raw == null) return "";
    const text = asText(raw);
    if (!text) return "";
    const cleaned = text
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .toLowerCase();
    const match = cleaned.match(/^(\d+(\.\d+)?)([km])?$/);
    if (!match) return text;
    const base = Number(match[1]);
    if (!Number.isFinite(base)) return text;
    const suffix = match[3] || "";
    if (!suffix) {
      if (base >= 1 && base <= 99) return `${match[1]}m`;
      if (base >= 100 && base <= 9999) return `${match[1]}k`;
    }
    return cleaned;
  }

  function parseFood(raw) {
    const shared = getNumberShared();
    if (shared && typeof shared.parseFoodPerDay === "function") return shared.parseFoodPerDay(raw);
    const n = Number(asText(raw));
    return Number.isFinite(n) ? n : null;
  }

  function parseCompact(raw) {
    const shared = getNumberShared();
    if (shared && typeof shared.parseCompactNumber === "function") return shared.parseCompactNumber(raw);
    const n = Number(asText(raw));
    return Number.isFinite(n) ? n : null;
  }

  function escAttr(v) {
    const escapeAttr = getTextShared()?.escapeAttr;
    if (typeof escapeAttr === "function") return escapeAttr(v);
    return String(v == null ? "" : v);
  }

  function escText(v) {
    const escapeHtml = getTextShared()?.escapeHtml;
    if (typeof escapeHtml === "function") return escapeHtml(v);
    return String(v == null ? "" : v);
  }

  function formatRange(low, high) {
    if (!Number.isFinite(low) || !Number.isFinite(high)) return "-";
    const a = Math.min(low, high);
    const b = Math.max(low, high);
    if (Math.abs(b - a) < 1) return fmtCoins(a);
    return `${fmtCoins(a)} - ${fmtCoins(b)}`;
  }

  function highlightNegativeTokens(text) {
    const src = String(text == null ? "" : text);
    const re = /\(-[^()]+\)/g;
    re.lastIndex = 0;
    let out = "";
    let i = 0;
    let m = re.exec(src);
    while (m) {
      out += escText(src.slice(i, m.index));
      out += `<span class="zcInfoTipNeg">${escText(m[0])}</span>`;
      i = m.index + m[0].length;
      m = re.exec(src);
    }
    out += escText(src.slice(i));
    return out;
  }

  function setTierTip(tipBtn, lines) {
    if (!tipBtn) return;
    const tipBody = tipBtn.querySelector(".zcInfoTip");
    if (!tipBody) return;
    const list = Array.isArray(lines) ? lines.map((line) => String(line == null ? "" : line)) : [];
    const hasContent = list.some((line) => asText(line) !== "");
    if (!hasContent) {
      tipBody.innerHTML = "";
      tipBody.hidden = true;
      tipBtn.classList.remove("is-open");
      tipBtn.classList.remove("has-tip");
      tipBtn.setAttribute("aria-expanded", "false");
      delete tipBtn.dataset.copyPlanner;
      delete tipBtn.dataset.plannerImport;
      return;
    }
    tipBody.innerHTML = list.map((line) => highlightNegativeTokens(line)).join("\n");
    tipBody.hidden = false;
    tipBtn.classList.add("has-tip");
    if (!tipBtn.hasAttribute("aria-expanded")) tipBtn.setAttribute("aria-expanded", "false");
  }

  function setTierPlannerImport(tipBtn, payload) {
    if (!tipBtn) return;
    if (!payload || typeof payload !== "object") {
      delete tipBtn.dataset.copyPlanner;
      delete tipBtn.dataset.plannerImport;
      return;
    }
    try {
      tipBtn.dataset.copyPlanner = "1";
      tipBtn.dataset.plannerImport = JSON.stringify(payload);
    } catch (_) {
      delete tipBtn.dataset.copyPlanner;
      delete tipBtn.dataset.plannerImport;
    }
  }

  function getTierPlannerImport(tipBtn) {
    const raw = String(tipBtn?.dataset?.plannerImport || "").trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function copyTierPlannerImport(payload) {
    const importer = window.KeysInline?.importPlannerPayload;
    if (typeof importer !== "function") return false;
    try {
      return importer(payload) !== false;
    } catch (_) {
      return false;
    }
  }

  function closeOpenInfoTips(root, exceptBtn = null) {
    if (!root) return;
    root.querySelectorAll(".zcInfo.is-open").forEach((btn) => {
      if (exceptBtn && btn === exceptBtn) return;
      btn.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function bindInfoTipInteractions(root) {
    if (!root || root.dataset.zcInfoTipsBound === "1") return;
    root.dataset.zcInfoTipsBound = "1";

    root.addEventListener("click", (event) => {
      const btn = event.target instanceof Element ? event.target.closest(".zcInfo") : null;
      if (btn && root.contains(btn)) {
        if (!btn.classList.contains("has-tip")) return;
        event.preventDefault();
        const plannerImport = getTierPlannerImport(btn);
        const hoverCopyReady = plannerImport && typeof btn.matches === "function" && btn.matches(":hover");
        const shouldCopy = !!plannerImport && (btn.classList.contains("is-open") || hoverCopyReady);
        if (shouldCopy) {
          closeOpenInfoTips(root);
          copyTierPlannerImport(plannerImport);
          return;
        }
        const nextOpen = !btn.classList.contains("is-open");
        closeOpenInfoTips(root, nextOpen ? btn : null);
        btn.classList.toggle("is-open", nextOpen);
        btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        return;
      }
      closeOpenInfoTips(root);
    });

    root.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeOpenInfoTips(root);
    });
  }

  function taxRate() {
    const calc = window.DungeonCalculations || null;
    if (calc && typeof calc.getDefaultTaxRate === "function") {
      const t = Number(calc.getDefaultTaxRate());
      if (Number.isFinite(t)) return t;
    }
    const api = window.DungeonAPI || null;
    const pct = Number(api?.getDefaultTaxPct?.());
    return Number.isFinite(pct) ? pct / 100 : 0.02;
  }

  function setStatus(msg, isError = false) {
    const el = byId("zcStatus");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("zcError", !!isError);
  }

  function setNegClass(el, n) {
    if (!el) return;
    el.classList.remove("zcNeg", "zcProfitPos", "zcProfitNeg");
    el.style.removeProperty("color");
    if (!Number.isFinite(n)) return;
    if (n < 0) el.classList.add("zcNeg", "zcProfitNeg");
    else if (n > 0) el.classList.add("zcProfitPos");
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function setAfterKeySideColor(el, value, anchors) {
    if (!el) return;
    el.classList.remove("zcNeg");
    el.style.removeProperty("color");
    if (!Number.isFinite(value)) return;
    const posAnchor = Math.max(1, Number(anchors?.posMax) || 1);
    if (value < 0) {
      el.style.color = "rgb(239, 68, 68)";
      el.classList.add("zcNeg");
      return;
    }
    const t = Math.max(0, Math.min(1, value / posAnchor));
    const r = lerp(120, 34, t);
    const g = lerp(180, 197, t);
    const b = lerp(150, 94, t);
    el.style.color = `rgb(${r}, ${g}, ${b})`;
  }

  function computeAfterKeyAnchors(zoneOut) {
    let posMax = 0;
    let negMaxAbs = 0;
    for (const pair of zoneOut || []) {
      const z = pair?.z;
      if (!z || z.error) continue;
      const vals = [z.nLow, z.nHigh, z.rLow, z.rHigh];
      for (const v of vals) {
        if (!Number.isFinite(v)) continue;
        if (v > 0) posMax = Math.max(posMax, v);
        if (v < 0) negMaxAbs = Math.max(negMaxAbs, Math.abs(v));
      }
    }
    return { posMax: posMax || 1, negMaxAbs: negMaxAbs || 1 };
  }

  function setProfitScaleColor(el, profit, anchors) {
    if (!el) return;
    el.classList.remove("zcNeg", "zcProfitPos", "zcProfitNeg");
    el.style.removeProperty("color");
    if (!Number.isFinite(profit)) return;
    if (profit === 0) return;

    const posMax = Math.max(1, Number(anchors?.posMax) || 1);
    const negMaxAbs = Math.max(1, Number(anchors?.negMaxAbs) || 1);

    if (profit > 0) {
      const rawT = Math.max(0, Math.min(1, profit / posMax));
      const t = Math.pow(rawT, 2.05);
      const pct = Math.round(2 + (98 * t));
      el.style.color = `color-mix(in srgb, #22c55e ${pct}%, var(--title-color))`;
      el.classList.add("zcProfitPos");
      return;
    }

    const rawT = Math.max(0, Math.min(1, Math.abs(profit) / negMaxAbs));
    const t = Math.pow(rawT, 1.85);
    const pct = Math.round(3 + (97 * t));
    el.style.color = `color-mix(in srgb, #fb7185 ${pct}%, var(--title-color))`;
    el.classList.add("zcNeg", "zcProfitNeg");
  }

  function applyProfitScaleAndBest(zones) {
    const rows = [];
    let posMax = 0;
    let negMaxAbs = 0;
    let best = null;

    for (const zone of zones) {
      for (const tier of TIERS) {
        const rowEl = byId(`zcMin-${zone.key}-${tier}`)?.closest(".zcTierRow") || null;
        const pEl = byId(`zcProfit-${zone.key}-${tier}`);
        if (rowEl) rowEl.classList.remove("zcBestRow");
        if (!pEl) continue;

        const profitRaw = Number(pEl.dataset?.profit);
        if (!Number.isFinite(profitRaw)) {
          pEl.classList.remove("zcNeg", "zcProfitPos", "zcProfitNeg");
          pEl.style.removeProperty("color");
          continue;
        }
        if (profitRaw > 0) posMax = Math.max(posMax, profitRaw);
        if (profitRaw < 0) negMaxAbs = Math.max(negMaxAbs, Math.abs(profitRaw));

        const cell = { rowEl, pEl, profit: profitRaw };
        rows.push(cell);
        if (!best || profitRaw > best.profit) best = cell;
      }
    }

    const anchors = { posMax: posMax || 1, negMaxAbs: negMaxAbs || 1 };
    rows.forEach((r) => setProfitScaleColor(r.pEl, r.profit, anchors));
    if (best?.rowEl) best.rowEl.classList.add("zcBestRow");
  }

  function renderApiWarnings(list) {
    const wrap = byId("zcWarnWrap");
    const toggle = byId("zcWarnToggle");
    const body = byId("zcWarnBody");
    if (!wrap || !toggle || !body) return;

    const arr = Array.isArray(list)
      ? Array.from(new Set(list.map((x) => asText(x).trim()).filter(Boolean)))
      : [];
    apiWarnings = arr;

    if (!arr.length) {
      wrap.hidden = true;
      body.hidden = true;
      body.textContent = "";
      toggle.setAttribute("aria-expanded", "false");
      apiWarningsOpen = false;
      return;
    }

    wrap.hidden = false;
    body.textContent = arr.map((w, i) => `${i + 1}. ${w}`).join("\n");
    const expanded = !!apiWarningsOpen;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    body.hidden = !expanded;
  }

  function hasPriceSet(prices) {
    return prices &&
      Number.isFinite(prices.entryAsk) && prices.entryAsk >= 0 &&
      Number.isFinite(prices.entryBid) && prices.entryBid >= 0 &&
      Number.isFinite(prices.chestKeyAsk) && prices.chestKeyAsk >= 0 &&
      Number.isFinite(prices.chestKeyBid) && prices.chestKeyBid >= 0;
  }

  function isBadMarketSide(v) {
    const n = Number(v);
    return !Number.isFinite(n) || n < 0;
  }

  function labelForHrid(hrid) {
    try {
      const init = window.InitCharacterData || null;
      const detail = init?.itemDetailMap?.[hrid] || init?.itemMap?.[hrid] || init?.items?.[hrid] || null;
      const name = detail?.name || detail?.displayName || detail?.localizedName || "";
      if (name) return String(name);
    } catch (_) { }
    const tail = String(hrid || "").split("/").pop() || "";
    return tail ? tail.replaceAll("_", " ") : String(hrid || "");
  }

  function iconPathForHrid(hrid) {
    const shared = getItemHridShared();
    if (shared && typeof shared.iconPathFromHrid === "function") {
      return shared.iconPathFromHrid(hrid, "./assets/Svg/");
    }
    const id = String(hrid || "").split("/").pop() || "";
    if (!id) return "";
    const file = `${id[0].toUpperCase()}${id.slice(1)}.svg`;
    return `./assets/Svg/${encodeURIComponent(file).replace(/%2F/g, "/")}`;
  }

  function showWarningPop(msg) {
    try {
      if (typeof window.showToast === "function") {
        window.showToast(msg);
        return;
      }
    } catch (_) { }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    window.setTimeout(() => { toast.remove(); }, 3400);
  }

  async function collectMissingApiPriceItems(zoneKey, marketData, effectiveOverrides = null) {
    const evApi = window.DungeonChestEV || null;
    if (!evApi || typeof evApi.getEvRelevantHrids !== "function") return [];
    let hrids = [];
    try {
      hrids = await evApi.getEvRelevantHrids(zoneKey, marketData);
    } catch (_) {
      return [];
    }
    const missing = [];
    for (const hrid of hrids || []) {
      const id = String(hrid || "").toLowerCase();
      if (!id) continue;
      if (id === "/items/coin") continue;
      if (id.endsWith("_token")) continue;
      const ov = getCustomLootOverrideValue(effectiveOverrides?.[hrid]);
      if (Number.isFinite(ov) && ov >= 0) continue;
      const row = marketData?.[hrid] || null;
      const ask = row?.a ?? row?.ask;
      const bid = row?.b ?? row?.bid;
      if (isBadMarketSide(ask) || isBadMarketSide(bid)) {
        missing.push(hrid);
      }
    }
    return missing;
  }

  function extractAskBid(market, hrid) {
    const row = market?.[hrid] || null;
    const normalize = getMarketShared()?.normalizeAskBidQuote;
    if (typeof normalize === "function") return normalize(row);
    return { ask: null, bid: null };
  }

  async function buildManualLootRows(zones, source) {
    const api = window.DungeonAPI || null;
    const ev = window.DungeonChestEV || null;
    if (!api || !ev?.getEvRelevantHrids) return [];

    const seen = new Map();
    for (const zone of zones) {
      const market = api.getMarketSlim?.(zone.key, source) || null;
      let hrids = [];
      try {
        hrids = await ev.getEvRelevantHrids(zone.key, market);
      } catch (_) {
        hrids = [];
      }

      for (const hrid of hrids || []) {
        if (!hrid || hrid === "/items/coin") continue;
        if (String(hrid).toLowerCase().endsWith("_token")) continue;
        if (!seen.has(hrid)) {
          const p = extractAskBid(market, hrid);
          seen.set(hrid, {
            hrid,
            name: labelForHrid(hrid),
            iconPath: iconPathForHrid(hrid),
            placeholder: Number.isFinite(p.bid) && p.bid >= 0 ? fmtCoins(p.bid) : "",
          });
        } else {
          const existing = seen.get(hrid);
          if (!existing.placeholder) {
            const p = extractAskBid(market, hrid);
            if (Number.isFinite(p.bid) && p.bid >= 0) existing.placeholder = fmtCoins(p.bid);
          }
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  async function renderManualPanel(zones, source) {
    const section = byId("zcLootOverrideSection");
    const toggle = byId("zcManualLootToggle");
    const toggleHost = byId("zcManualLootToggleHost");
    const filter = byId("zcManualLootFilter");
    const resetBtn = byId("zcLootOverrideResetBtn");
    const hint = byId("zcLootOverrideHint");
    const list = byId("zcLootOverrideList");
    if (!section || !toggle || !filter || !resetBtn || !hint || !list) return;
    syncLocalLootOverrideState();

    toggle.checked = !!state.manualLoot;
    section.classList.toggle("isOn", !!state.manualLoot);
    if (toggleHost) {
      toggleHost.dataset.tip = state.manualLoot
        ? t("ui.manualLootEnabled", "Manual loot prices enabled.")
        : t("ui.enableManualLoot", "Enable manual loot prices.");
    }

    if (!state.manualLoot) {
      list.innerHTML = "";
      hint.textContent = t("ui.enableManualLootEdit", "Enable Manual loot prices to edit item values.");
      return;
    }

    const rows = await buildManualLootRows(zones, source);
    if (!rows.length) {
      list.innerHTML = "";
      hint.textContent = t("ui.refreshPricingDefaults", "Refresh pricing to load market defaults for these items.");
      return;
    }

    hint.textContent = t("ui.pricesShownMarket", "Prices shown are current market values (placeholder). Enter a value to override. Leave blank to use the market.");
    const q = asText(filter.value).toLowerCase();
    const filtered = q
      ? rows.filter((r) => String(r.name || "").toLowerCase().includes(q))
      : rows;

    if (!filtered.length) {
      list.innerHTML = `<div class="muted small">${escText(t("ui.noItemsMatchFilter", "No items match your filter."))}</div>`;
      return;
    }

    list.innerHTML = filtered.map((r) => {
      const custom = getCustomLootOverrideValue(state.manualOverrides?.[r.hrid]);
      const hasCustom = Number.isFinite(custom);
      const cls = hasCustom ? "lootOverrideRow isCustom" : "lootOverrideRow isDefault";
      return `
        <div class="${cls}" data-hrid="${escAttr(r.hrid)}">
          <div class="lootOverrideIcon">${r.iconPath ? `<img src="${escAttr(r.iconPath)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ""}</div>
          <div class="lootOverrideName" title="${escAttr(r.name)}">${escText(r.name)}</div>
          <input type="text" inputmode="decimal" placeholder="${escAttr(r.placeholder || "-")}" value="${hasCustom ? escAttr(fmtCoins(custom)) : ""}" aria-label="${escAttr(tf("ui.manualPriceAria", "{item} manual price", { item: r.name }))}" />
          <button class="lootOverrideResetOne tipHost" data-tip="${t("ui.reset", "Reset")}" title="" aria-label="${t("ui.reset", "Reset")}">R</button>
        </div>
      `;
    }).join("");

    list.querySelectorAll(".lootOverrideRow").forEach((rowEl) => {
      const hrid = rowEl.getAttribute("data-hrid");
      const input = rowEl.querySelector("input");
      const resetOne = rowEl.querySelector(".lootOverrideResetOne");
      if (!hrid || !input) return;

      const commit = () => {
        const raw = asText(input.value);
        if (!raw) {
          delete state.manualOverrides[hrid];
          rowEl.classList.remove("isCustom", "isInvalid");
          rowEl.classList.add("isDefault");
          persistState({ emitLootOverrides: true });
          return;
        }
        const n = parseCompact(raw);
        if (!Number.isFinite(n) || n < 0) {
          rowEl.classList.add("isInvalid");
          return;
        }
        rowEl.classList.remove("isInvalid", "isDefault");
        rowEl.classList.add("isCustom");
        state.manualOverrides[hrid] = { mode: "Custom", price: Math.round(n) };
        input.value = fmtCoins(n);
        persistState({ emitLootOverrides: true });
      };

      input.addEventListener("blur", commit);
      input.addEventListener("change", commit);
      input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        commit();
      });

        if (resetOne) {
          resetOne.addEventListener("click", (e) => {
            e.preventDefault();
            delete state.manualOverrides[hrid];
            persistState({ emitLootOverrides: true });
            void renderManualPanel(zones, source);
          });
        }
    });
  }

  function mergeOverrides(base, more) {
    const out = {};
    if (base && typeof base === "object") Object.assign(out, base);
    if (more && typeof more === "object") Object.assign(out, more);
    return out;
  }

  async function lowDropOverrides(shortKey) {
    if (!state.lowDrop) return {};
    const raw = window.OpenableLootRaw || null;
    if (!raw?.ready) return {};
    const set = CHESTS[shortKey];
    if (!set) return {};
    await raw.ready();

    const out = {};
    const add = (hrid) => { if (hrid) out[hrid] = 0; };
    const chance = (r) => Number.isFinite(Number(r?.chance)) ? Number(r.chance) : 0;

    const chestRows = raw.getDirectDetailRows(set.chest) || [];
    const refRows = raw.getDirectDetailRows(set.refined) || [];
    chestRows.forEach((r) => { if (chance(r) < 0.01) add(r.itemHrid); });
    refRows.forEach((r) => { if (chance(r) < 0.01) add(r.itemHrid); });

    const large = chestRows.find((r) => String(r?.itemHrid || "") === LARGE_CHEST_HRID);
    const pLarge = chance(large);
    if (pLarge > 0) {
      if (pLarge < 0.01) add(LARGE_CHEST_HRID);
      const nested = raw.getDirectDetailRows(LARGE_CHEST_HRID) || [];
      nested.forEach((r) => { if ((pLarge * chance(r)) < 0.01) add(r.itemHrid); });
    }
    return out;
  }

  async function refreshZone(zoneKey, source) {
    const api = window.DungeonAPI || null;
    if (!api?.refreshPricesForDungeon) return { ok: false, error: t("ui.apiRefreshUnavailable", "API refresh unavailable.") };
    try {
      const result = await api.refreshPricesForDungeon(zoneKey, source, { silent: true, reason: "zone-compare" });
      if (result && result.ok === false) {
        return { ok: false, error: result.error || t("ui.apiRefreshFailedShort", "API refresh failed.") };
      }
      return { ok: true, error: "" };
    } catch (e) {
      return { ok: false, error: e?.message || t("ui.apiRefreshFailedShort", "API refresh failed.") };
    }
  }

  async function computeZone(zone, source, tRate, baseOverrides) {
    const api = window.DungeonAPI || null;
    const evApi = window.DungeonChestEV || null;
    if (!api || !evApi?.computeDungeonChestEV) return { error: t("ui.calcModulesNotReady", "Calculation modules are not ready.") };

    const prices = api.getKeyPricesAB?.(zone.key, source) || null;
    const warnings = [];
    if (!hasPriceSet(prices)) {
      warnings.push(`${zone.title}: ${t("ui.keyPricesMissing", "key prices are missing or -1.")}`);
      return { error: t("ui.missingKeyPrices", "Missing key prices."), warnings };
    }
    const market = api.getMarketSlim?.(zone.key, source) || null;
    if (!market) {
      warnings.push(`${zone.title}: ${t("ui.marketSnapshotMissing", "market snapshot is missing.")}`);
      return { error: t("ui.missingMarketSnapshot", "Missing market snapshot."), warnings };
    }

    try {
      const low = await lowDropOverrides(zone.short);
      let overrides = mergeOverrides(baseOverrides, low);
      if (state.mirrorBackslot) {
        const mirrorAB = extractAskBid(market, MIRROR_HRID);
        const mirrorPrice = (Number.isFinite(mirrorAB.bid) && mirrorAB.bid >= 0)
          ? mirrorAB.bid
          : ((Number.isFinite(mirrorAB.ask) && mirrorAB.ask >= 0) ? mirrorAB.ask : NaN);
        if (Number.isFinite(mirrorPrice) && mirrorPrice >= 0) {
          const mirrorMap = {};
          BACKSLOT_HRIDS.forEach((h) => { mirrorMap[h] = mirrorPrice; });
          overrides = mergeOverrides(overrides, mirrorMap);
        } else {
          const zeroBackslot = {};
          BACKSLOT_HRIDS.forEach((h) => { zeroBackslot[h] = 0; });
          overrides = mergeOverrides(overrides, zeroBackslot);
          warnings.push(`${zone.title}: ${t("ui.mirrorPriceMissing", "mirror API price missing; back-slot mirror override skipped.")}`);
        }
      } else {
        const zeroBackslot = {};
        BACKSLOT_HRIDS.forEach((h) => { zeroBackslot[h] = 0; });
        overrides = mergeOverrides(overrides, zeroBackslot);
      }
      const evBid = await evApi.computeDungeonChestEV({ dungeonKey: zone.key, marketData: market, side: "bid", priceOverrides: overrides });
      const evAsk = await evApi.computeDungeonChestEV({ dungeonKey: zone.key, marketData: market, side: "ask", priceOverrides: overrides });

      let missingApiItems = await collectMissingApiPriceItems(zone.key, market, overrides);
      const cowbellEachBid = Number(evBid?.cowbellEachValue);
      const cowbellEachAsk = Number(evAsk?.cowbellEachValue);
      if ((Number.isFinite(cowbellEachBid) && cowbellEachBid > 0) || (Number.isFinite(cowbellEachAsk) && cowbellEachAsk > 0)) {
        missingApiItems = missingApiItems.filter((h) => String(h || "").toLowerCase() !== "/items/cowbell");
      }
      if (missingApiItems.length) {
        const shown = missingApiItems.slice(0, 2).map(labelForHrid).join(", ");
        const extra = missingApiItems.length > 2
          ? tf("ui.moreCount", " +{count} more", { count: missingApiItems.length - 2 })
          : "";
        warnings.push(`${zone.title}: ${tf("ui.apiPriceMissingList", "API price missing/-1 for {items}{extra}.", { items: shown, extra })}`);
      }

      const nLow = (Number(evBid?.chestEv) * (1 - tRate)) - prices.chestKeyAsk - prices.entryAsk;
      const nHigh = (Number(evAsk?.chestEv) * (1 - tRate)) - prices.chestKeyBid - prices.entryBid;
      const rLow = (Number(evBid?.refinedChestEv) * (1 - tRate)) - prices.chestKeyAsk;
      const rHigh = (Number(evAsk?.refinedChestEv) * (1 - tRate)) - prices.chestKeyBid;
      if (![nLow, nHigh, rLow, rHigh].every(Number.isFinite)) {
        warnings.push(`${zone.title}: ${t("ui.evInvalidValues", "EV response had invalid values.")}`);
        return { error: t("ui.unableComputeEv", "Unable to compute EV."), warnings };
      }

      return {
        error: "",
        warnings,
        prices,
        evBid,
        evAsk,
        nLow,
        nHigh,
        rLow,
        rHigh,
        lowCount: Object.keys(low).length,
      };
    } catch (_) {
      warnings.push(`${zone.title}: ${t("ui.evCalculationFailed", "EV calculation failed.")}`);
      return { error: t("ui.evCalculationFailedZone", "EV calculation failed for this zone."), warnings };
    }
  }

  function applyZoneAfter(zone, z, anchors) {
    const nLowEl = byId(`zcAfterNLow-${zone.key}`);
    const nHighEl = byId(`zcAfterNHigh-${zone.key}`);
    const rLowEl = byId(`zcAfterRLow-${zone.key}`);
    const rHighEl = byId(`zcAfterRHigh-${zone.key}`);
    if (!nLowEl || !nHighEl || !rLowEl || !rHighEl) return;
    if (z?.error) {
      [nLowEl, nHighEl, rLowEl, rHighEl].forEach((el) => {
        el.textContent = "-";
        el.classList.remove("zcNeg");
        el.style.removeProperty("color");
      });
      return;
    }
    nLowEl.textContent = fmtCoins(z.nLow);
    nHighEl.textContent = fmtCoins(z.nHigh);
    rLowEl.textContent = fmtCoins(z.rLow);
    rHighEl.textContent = fmtCoins(z.rHigh);

    setAfterKeySideColor(nLowEl, z.nLow, anchors);
    setAfterKeySideColor(nHighEl, z.nHigh, anchors);
    setAfterKeySideColor(rLowEl, z.rLow, anchors);
    setAfterKeySideColor(rHighEl, z.rHigh, anchors);
  }

  function applyZoneTiers(zone, z, tRate, foodPerDay) {
    const calc = window.DungeonCalculations || null;
    if (!calc || z?.error) return 0;
    let count = 0;
    for (const tier of TIERS) {
      const pEl = byId(`zcProfit-${zone.key}-${tier}`);
      const tip = byId(`zcTip-${zone.key}-${tier}`);
      const rowEl = byId(`zcMin-${zone.key}-${tier}`)?.closest(".zcTierRow") || null;
      if (!pEl || !tip) continue;
      pEl.textContent = "-";
      pEl.classList.remove("zcProfitPos", "zcProfitNeg", "zcNeg");
      pEl.style.removeProperty("color");
      delete pEl.dataset.profit;
      setTierTip(tip, null);
      if (rowEl) rowEl.classList.remove("zcBestRow");

      const parsed = parseMinutes(state.minutes?.[zone.key]?.[tier] || "");
      if (!parsed.ok) continue;

      const sim = calc.computeLootCountsFor24h({ clearMinutes: parsed.num, buffTier: state.buff, tierKey: tier });
      const range = calc.computeChestCenteredProfitRangeAfterTaxAndFood({
        chestCount: sim.chest,
        refinedCount: sim.refined,
        chestEvBid: z.evBid?.chestEv,
        chestEvAsk: z.evAsk?.chestEv,
        refinedEvBid: z.evBid?.refinedChestEv,
        refinedEvAsk: z.evAsk?.refinedChestEv,
        entryAsk: z.prices.entryAsk,
        entryBid: z.prices.entryBid,
        chestKeyAsk: z.prices.chestKeyAsk,
        chestKeyBid: z.prices.chestKeyBid,
        taxRate: tRate,
        foodPerDay,
      });
      const point = calc.computeChestCenteredProfitPointAfterTaxAndFood({
        chestCount: sim.chest,
        refinedCount: sim.refined,
        chestEv: z.evBid?.chestEv,
        refinedEv: z.evBid?.refinedChestEv,
        entryPrice: z.prices.entryBid,
        chestKeyPrice: z.prices.chestKeyBid,
        taxRate: tRate,
        foodPerDay,
      });

      const profit = Number(point?.profit);
      if (Number.isFinite(profit)) {
        pEl.textContent = `${fmtCoins(profit)}`;
        pEl.dataset.profit = String(profit);
      }
      const normalTotalLow = Number(sim.chest || 0) * Number(z.nLow);
      const normalTotalHigh = Number(sim.chest || 0) * Number(z.nHigh);
      const refinedTotalLow = Number(sim.refined || 0) * Number(z.rLow);
      const refinedTotalHigh = Number(sim.refined || 0) * Number(z.rHigh);
      const chestTotalLow = normalTotalLow + refinedTotalLow;
      const chestTotalHigh = normalTotalHigh + refinedTotalHigh;
      const profitLow = Number(range?.profitLow);
      const profitHigh = Number(range?.profitHigh);
      const tipLines = [
        `${zone.title} ${tier}`,
        "",
        tf("ui.tipRunsEntryChestKeys", "Runs/day: {runs} | Entry: {entry} | Chest keys: {chestKeys}", {
          runs: Number(sim.runs || 0).toLocaleString(),
          entry: Number(sim.entry || 0).toLocaleString(),
          chestKeys: Number(sim.chestKey || 0).toLocaleString(),
        }),
        tf("ui.tipChestsRefined", "Chests: {chests} | Refined: {refined}", {
          chests: Number(sim.chest || 0).toLocaleString(),
          refined: Number(sim.refined || 0).toLocaleString(),
        }),
        "",
        tf("ui.tipDailyRegularTotal", "Normal total/day: {range}", { range: formatRange(normalTotalLow, normalTotalHigh) }),
        tf("ui.tipDailyRefinedTotal", "Refined total/day: {range}", { range: formatRange(refinedTotalLow, refinedTotalHigh) }),
        tf("ui.tipDailyChestTotal", "Chest total/day: {range}", { range: formatRange(chestTotalLow, chestTotalHigh) }),
        "",
        tf("ui.tipProfitLow", "Low (Instant sell): {value}", { value: fmtCoins(profitLow) }),
        tf("ui.tipProfitHigh", "High (List sell): {value}", { value: fmtCoins(profitHigh) }),
        tf("ui.tipStandardExplained", "Standard view: {value} | instant sell @ bid, keys @ bid", { value: fmtCoins(profit) }),
      ];
      setTierTip(tip, tipLines);
      setTierPlannerImport(tip, {
        source: "zone_compare",
        uiKey: zone.key,
        tier,
        selectedType: "chest",
        entryCount: Number(sim.entry || 0),
        chestCount: Number(sim.chestKey || 0),
        targetCount: Number(sim.chestKey || 0),
        savedAt: Date.now(),
      });
      count += 1;
    }
    return count;
  }

  async function calculateAll(zones) {
    const btn = byId("zcCalc");
    const api = window.DungeonAPI || null;
    const calc = window.DungeonCalculations || null;
    const ev = window.DungeonChestEV || null;
    if (!btn) return;
    if (!api || !calc || !ev?.computeDungeonChestEV) {
      setStatus(t("ui.calculationDependenciesMissing", "Calculation dependencies are not loaded."), true);
      return;
    }

    const token = ++calcRunToken;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = t("ui.calculating", "Calculating...");

    try {
      const source = String(api.getActiveApiSource?.() || api.getPricingModel?.() || "official");
      const tRate = taxRate();
      const food = parseFood(state.food);
      const foodPerDay = Number.isFinite(food) ? food : 0;

      setStatus(t("ui.refreshingPricesAllZones", "Refreshing prices for all zones..."));
      let refreshResults = [];
      if (typeof api.refreshPricesForAllDungeons === "function") {
        const bulk = await api.refreshPricesForAllDungeons(source, { silent: true, reason: "zone-compare" });
        refreshResults = zones.map((z) => {
          const result = bulk?.[z.key];
          if (!result) return { ok: false, error: t("ui.apiRefreshUnavailable", "API refresh unavailable.") };
          if (result.ok === false) return { ok: false, error: result.error || t("ui.apiRefreshFailedShort", "API refresh failed.") };
          return { ok: true, error: "" };
        });
      } else {
        refreshResults = await Promise.all(zones.map((z) => refreshZone(z.key, source)));
      }
      if (token !== calcRunToken) return;

      setStatus(t("ui.calculatingTierComparisons", "Calculating 12 tier comparisons..."));
      const sharedLootState = syncLocalLootOverrideState();
      const baseOverrides = sharedLootState.manualLoot ? (sharedLootState.manualOverrides || null) : null;

      let tierCount = 0;
      let zoneErrors = 0;
      let lowCount = 0;
      const warnings = [];
      refreshResults.forEach((r, i) => {
        if (!r?.ok) warnings.push(`${zones[i]?.title || t("ui.zone", "Zone")}: ${r?.error || t("ui.apiRefreshFailedShort", "API refresh failed.")}`);
      });
      const zoneOut = await Promise.all(zones.map(async (zone) => {
        const z = await computeZone(zone, source, tRate, baseOverrides);
        return { zone, z };
      }));
      if (token !== calcRunToken) return;

      zoneOut.forEach(({ z }) => {
        if (z?.error) zoneErrors += 1;
        if (Number.isFinite(z?.lowCount)) lowCount += z.lowCount;
        if (Array.isArray(z?.warnings)) warnings.push(...z.warnings);
      });

      const anchors = computeAfterKeyAnchors(zoneOut);
      for (const row of zoneOut) {
        applyZoneAfter(row.zone, row.z, anchors);
        tierCount += applyZoneTiers(row.zone, row.z, tRate, foodPerDay);
      }
      applyProfitScaleAndBest(zones);

      const uniqueWarnings = Array.from(new Set(warnings.map((x) => asText(x).trim()).filter(Boolean)));
      renderApiWarnings(uniqueWarnings);
      const firstWarn = uniqueWarnings.length
        ? tf("ui.apiPriceWarningPrefix", "API price warning: {warning}", { warning: uniqueWarnings[0] })
        : "";
      if (uniqueWarnings.length) showWarningPop(firstWarn);

      if (tierCount <= 0) {
        if (uniqueWarnings.length) {
          setStatus(`${firstWarn} ${t("ui.addTierMinutesThenCalc", "Add one or more tier minutes, then Calculate.")}`, true);
        } else {
          setStatus(t("ui.noValidClearTimes", "No valid clear times entered. Add one or more tier minutes, then Calculate."), true);
        }
        return;
      }
      const warn = zoneErrors > 0 ? tf("ui.zoneMissingDataCount", " {count} zone(s) had missing data.", { count: zoneErrors }) : "";
      const low = state.lowDrop ? tf("ui.lowChanceItemsZeroedCount", " {count} low-chance items were zeroed.", { count: lowCount }) : "";
      const warnNote = uniqueWarnings.length ? tf("ui.apiWarningsCount", " {count} API warning(s).", { count: uniqueWarnings.length }) : "";
      setStatus(tf("ui.calculationComplete", "Calculation complete: {count} tier result(s) updated.{warn}{low}{warnNote}", {
        count: tierCount,
        warn,
        low,
        warnNote,
      }));
    } catch (err) {
      setStatus(err?.message || t("ui.zoneComparisonFailed", "Zone comparison calculation failed."), true);
    } finally {
      if (token === calcRunToken) {
        btn.disabled = false;
        btn.textContent = prev || t("ui.calculate", "Calculate");
      }
    }
  }

  function syncInputs(zones) {
    const buff = byId("zcBuff");
    const food = byId("zcFood");
    const low = byId("zcLowDrop");
    const mirror = byId("zcMirrorBackslot");
    const manual = byId("zcManualLootToggle");

    if (buff) buff.value = String(clampBuff(state.buff));
    if (food) food.value = asText(state.food || "");
    if (low) low.checked = !!state.lowDrop;
    if (mirror) mirror.checked = !!state.mirrorBackslot;
    if (manual) manual.checked = !!state.manualLoot;

    zones.forEach((z) => {
      ensureZoneState(z.key);
      TIERS.forEach((tier) => {
        const el = byId(`zcMin-${z.key}-${tier}`);
        if (el) el.value = asText(state.minutes[z.key][tier] || "");
      });
    });
  }

  function resetAllInputs(zones, source = "") {
    state.buff = 20;
    state.food = "10m";
    state.lowDrop = false;
    state.mirrorBackslot = false;
    state.manualLoot = false;
    zones.forEach((z) => {
      ensureZoneState(z.key);
      TIERS.forEach((tier) => {
        state.minutes[z.key][tier] = "";
        const inp = byId(`zcMin-${z.key}-${tier}`);
        if (inp) inp.value = "";
        const pEl = byId(`zcProfit-${z.key}-${tier}`);
        const rowEl = byId(`zcMin-${z.key}-${tier}`)?.closest(".zcTierRow") || null;
        if (pEl) {
          pEl.textContent = "-";
          pEl.classList.remove("zcProfitPos", "zcProfitNeg", "zcNeg");
          pEl.style.removeProperty("color");
          delete pEl.dataset.profit;
        }
        if (rowEl) rowEl.classList.remove("zcBestRow");
        const tip = byId(`zcTip-${z.key}-${tier}`);
        if (tip) setTierTip(tip, null);
      });
    });
    const buffEl = byId("zcBuff");
    if (buffEl) buffEl.value = "20";
    const foodEl = byId("zcFood");
    if (foodEl) foodEl.value = "10m";
    const lowEl = byId("zcLowDrop");
    if (lowEl) lowEl.checked = false;
    const mirrorEl = byId("zcMirrorBackslot");
    if (mirrorEl) mirrorEl.checked = false;
    const manualEl = byId("zcManualLootToggle");
    if (manualEl) manualEl.checked = false;
    persistState({ emitLootOverrides: true });
    renderApiWarnings([]);
    if (source) void renderManualPanel(zones, source);
    setStatus(t("ui.clearedZoneCompareInputs", "Cleared zone compare inputs."));
  }

  function bindEvents(zones) {
    const panel = byId("zoneCompareInline");
    const buff = byId("zcBuff");
    const food = byId("zcFood");
    const low = byId("zcLowDrop");
    const mirror = byId("zcMirrorBackslot");
    const manual = byId("zcManualLootToggle");
    const manualFilter = byId("zcManualLootFilter");
    const manualReset = byId("zcLootOverrideResetBtn");
    const warnToggle = byId("zcWarnToggle");
    const calc = byId("zcCalc");
    const reset = byId("zcReset");
    const source = String((window.DungeonAPI?.getActiveApiSource?.() || window.DungeonAPI?.getPricingModel?.() || "official"));
    bindInfoTipInteractions(panel);
    const zoneIndexByKey = new Map(zones.map((z, i) => [z.key, i]));
    const tierIndexByKey = new Map(TIERS.map((t, i) => [t, i]));
    const focusTierInput = (zoneIdx, tierIdx) => {
      if (zoneIdx < 0 || zoneIdx >= zones.length) return;
      if (tierIdx < 0 || tierIdx >= TIERS.length) return;
      const target = byId(`zcMin-${zones[zoneIdx].key}-${TIERS[tierIdx]}`);
      if (!target) return;
      target.focus();
      target.select?.();
    };

    if (buff) {
      const commit = () => {
        const raw = asText(buff.value);
        const n = Number(raw);
        state.buff = Number.isFinite(n) ? clampBuff(n) : 20;
        buff.value = String(state.buff);
        persistState();
      };
      buff.addEventListener("change", commit);
      buff.addEventListener("blur", commit);
      buff.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        commit();
        void calculateAll(zones);
      });
    }

    if (food) {
      const commitLive = () => {
        state.food = asText(food.value);
        persistState();
      };
      const commitNormalized = () => {
        const normalized = normalizeFoodInput(food.value);
        state.food = normalized;
        if (String(food.value || "").trim() !== normalized) food.value = normalized;
        persistState();
      };
      food.addEventListener("input", commitLive);
      food.addEventListener("change", commitNormalized);
      food.addEventListener("blur", commitNormalized);
      food.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        commitNormalized();
        void calculateAll(zones);
      });
    }

    if (low) {
      low.addEventListener("change", () => {
        state.lowDrop = !!low.checked;
        persistState();
      });
    }

    if (mirror) {
      mirror.addEventListener("change", () => {
        state.mirrorBackslot = !!mirror.checked;
        persistState();
      });
    }

    if (manual) {
      manual.addEventListener("change", () => {
        state.manualLoot = !!manual.checked;
        persistState({ emitLootOverrides: true });
        void renderManualPanel(zones, source);
      });
    }

    if (manualFilter) {
      manualFilter.addEventListener("input", () => {
        void renderManualPanel(zones, source);
      });
    }

    if (manualReset) {
      manualReset.addEventListener("click", async () => {
        const rows = await buildManualLootRows(zones, source);
        const toClear = rows
          .map((row) => asText(row?.hrid))
          .filter((hrid) => hrid.startsWith("/items/"));
        if (!toClear.length) return;
        toClear.forEach((hrid) => { delete state.manualOverrides[hrid]; });
        persistState({ emitLootOverrides: true });
        void renderManualPanel(zones, source);
        setStatus(t("ui.manualLootOverridesReset", "Manual loot overrides reset to market prices."));
      });
    }

    if (warnToggle) {
      warnToggle.addEventListener("click", () => {
        apiWarningsOpen = !apiWarningsOpen;
        renderApiWarnings(apiWarnings);
      });
    }

    zones.forEach((z) => {
      ensureZoneState(z.key);
      TIERS.forEach((tier) => {
        const input = byId(`zcMin-${z.key}-${tier}`);
        if (!input) return;
        const commit = () => {
          const nextValue = String(input.value == null ? "" : input.value).slice(0, 4);
          if (input.value !== nextValue) input.value = nextValue;
          state.minutes[z.key][tier] = asText(nextValue);
          persistState();
        };
        input.addEventListener("input", commit);
        input.addEventListener("change", commit);
        input.addEventListener("blur", commit);
        input.addEventListener("keydown", (e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const zIdx = Number(zoneIndexByKey.get(z.key));
            const tIdx = Number(tierIndexByKey.get(tier));
            let nextZ = zIdx;
            let nextT = tIdx;
            if (e.key === "ArrowUp") nextT = tIdx - 1;
            if (e.key === "ArrowDown") nextT = tIdx + 1;
            if (e.key === "ArrowLeft") nextZ = zIdx - 1;
            if (e.key === "ArrowRight") nextZ = zIdx + 1;
            e.preventDefault();
            focusTierInput(nextZ, nextT);
            return;
          }
          if (e.key !== "Enter") return;
          commit();
          void calculateAll(zones);
        });
      });
    });

    if (calc) calc.addEventListener("click", () => { void calculateAll(zones); });
    if (reset) {
      let resetArmed = false;
      let resetArmedAt = 0;
      let resetArmTimer = 0;
      const applyResetDefaultsOnly = () => {
        state.buff = 20;
        state.food = "10m";
        state.lowDrop = false;
        state.mirrorBackslot = false;
        state.manualLoot = false;

        const buffEl = byId("zcBuff");
        if (buffEl) buffEl.value = "20";
        const foodEl = byId("zcFood");
        if (foodEl) foodEl.value = "10m";
        const lowEl = byId("zcLowDrop");
        if (lowEl) lowEl.checked = false;
        const mirrorEl = byId("zcMirrorBackslot");
        if (mirrorEl) mirrorEl.checked = false;
        const manualEl = byId("zcManualLootToggle");
        if (manualEl) manualEl.checked = false;

        persistState({ emitLootOverrides: true });
        void renderManualPanel(zones, source);
      };
      const clearResetArm = () => {
        resetArmed = false;
        resetArmedAt = 0;
        if (resetArmTimer) {
          window.clearTimeout(resetArmTimer);
          resetArmTimer = 0;
        }
        reset.textContent = t("ui.reset", "Reset");
        reset.classList.remove("zcResetArmed");
      };
      reset.addEventListener("click", () => {
        const now = Date.now();
        if (resetArmed && (now - resetArmedAt) <= 3000) {
          clearResetArm();
          resetAllInputs(zones, source);
          return;
        }
        applyResetDefaultsOnly();
        resetArmed = true;
        resetArmedAt = now;
        reset.textContent = t("ui.resetTimes", "Reset Times");
        reset.classList.add("zcResetArmed");
        setStatus(t("ui.defaultsRestoredClickAgain", "Defaults restored. Click Reset Times again to clear tier minutes."));
        if (resetArmTimer) window.clearTimeout(resetArmTimer);
        resetArmTimer = window.setTimeout(() => {
          clearResetArm();
        }, 3000);
      });
    }
  }

  async function render() {
    const panel = byId("zoneCompareInline");
    const toggle = byId("zoneCompareToggle");
    if (!panel || !toggle || !toggle.checked) {
      hideAndClear(panel);
      return;
    }

    // Re-hydrate from shared storage so quick/advanced edits are reflected when entering Zone Compare.
      state = loadState();

    injectStyleOnce();
    const zones = readZones();
    zones.forEach((z) => ensureZoneState(z.key));
    persistState();

    panel.innerHTML = panelHtml(zones);
    panel.hidden = false;
    syncInputs(zones);
    syncZoneMinutePlaceholders(panel);
    window.requestAnimationFrame(() => syncZoneMinutePlaceholders(panel));
    bindEvents(zones);
    renderApiWarnings(apiWarnings);
    const source = String((window.DungeonAPI?.getActiveApiSource?.() || window.DungeonAPI?.getPricingModel?.() || "official"));
    await renderManualPanel(zones, source);
    try {
      document.dispatchEvent(new CustomEvent("zone-compare:rendered"));
    } catch (_) { }
  }

  async function getRelevantPricingHrids() {
    const api = window.DungeonAPI || null;
    const ev = window.DungeonChestEV || null;
    if (!api || !ev?.getEvRelevantHrids) return [];
    const source = String((api.getActiveApiSource?.() || api.getPricingModel?.() || "official"));
    const zones = readZones();
    const hrids = new Set();
    for (const zone of zones) {
      const market = api.getMarketSlim?.(zone.key, source) || null;
      let relevant = [];
      try {
        relevant = await ev.getEvRelevantHrids(zone.key, market);
      } catch (_) {
        relevant = [];
      }
      (relevant || []).forEach((hrid) => {
        const text = String(hrid || "").trim();
        if (!text || text === "/items/coin") return;
        if (text.toLowerCase().endsWith("_token")) return;
        hrids.add(text);
      });
    }
    return Array.from(hrids);
  }

  function bind() {
    const panel = byId("zoneCompareInline");
    const toggle = byId("zoneCompareToggle");
    if (!panel || !toggle) return;

    const apply = () => {
      document.body.classList.toggle("zone-compare-active", !!toggle.checked);
      if (!toggle.checked) {
        hideAndClear(panel);
        return;
      }
      void render();
    };

    toggle.addEventListener("change", apply);
    window.addEventListener("resize", () => {
      if (toggle.checked) window.requestAnimationFrame(() => syncZoneMinutePlaceholders(panel));
    }, { passive: true });
    document.addEventListener("site:lang-changed", () => {
      if (toggle.checked) void render();
    });
    apply();

    window.ZoneCompareInline = {
      render,
      isActive: () => !!toggle.checked,
      getRelevantPricingHrids,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();

