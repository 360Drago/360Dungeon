// js/token-shop-inline.js
(() => {
  "use strict";
  // Ownership: inline Token Shop panel for the selected dungeon.
  // Invariant: preserve row ordering, coins/token derivations, and displayed output text.

  const UI_TO_SHORT = {
    chimerical_den: "chimerical",
    sinister_circus: "sinister",
    enchanted_fortress: "enchanted",
    pirate_cove: "pirate",
  };
  const UI_TO_NAME = {
    chimerical_den: "Chimerical Den",
    sinister_circus: "Sinister Circus",
    enchanted_fortress: "Enchanted Fortress",
    pirate_cove: "Pirate Cove",
  };
  const FALLBACK_ZONES = [
    { key: "chimerical_den", title: "Chimerical Den", icon: "./assets/Svg/Chimerical_den.svg", accent: "#34d399" },
    { key: "sinister_circus", title: "Sinister Circus", icon: "./assets/Svg/Sinister_circus.svg", accent: "#f472b6" },
    { key: "enchanted_fortress", title: "Enchanted Fortress", icon: "./assets/Svg/Enchanted_fortress.svg", accent: "#a78bfa" },
    { key: "pirate_cove", title: "Pirate Cove", icon: "./assets/Svg/Pirate_cove.svg", accent: "#fb923c" },
  ];

  const DROPS_DIR = {
    chimerical: "./assets/Svg/",
    sinister: "./assets/Svg/",
    enchanted: "./assets/Svg/",
    pirate: "./assets/Svg/",
  };

  const HIDE_ITEM_HRIDS = new Set([
    "/items/chimerical_quiver",
    "/items/sinister_cape",
    "/items/enchanted_cloak",
  ]);

  const STYLE_ID = "tokenShopInlineStyleV10";
  const AGE_TIMER_KEY = "__tokenShopInlineAgeTimer";
  const AUTO_REFRESH_RENDER_DELAY_MS = 1100;
  const rowsCacheByUiKey = new Map();
  let lastAutoRefreshSignature = "";
  let lastRenderState = null;
  let tokenShopSelectedUiKey = "";

  function injectStyleOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #tokenShopInline {
        width: 100% !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 0 !important;
      }
      body.token-shop-active .cardStage,
      body.token-shop-active #selectionBar { display:none !important; }
      #tokenShopInline .tsShell {
        max-width: 1100px;
        margin: 0 auto;
      }
      #tokenShopInline .tsGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        align-items: stretch;
      }
      #tokenShopInline .tsZoneCard {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        overflow: hidden;
        padding: 10px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 16px;
        background: rgba(0,0,0,.18);
        color: inherit;
        text-align: left;
        cursor: pointer;
        appearance: none;
        transition:
          transform 180ms ease,
          border-color 180ms ease,
          background 220ms ease,
          box-shadow 220ms ease;
      }
      #tokenShopInline .tsZoneCard:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--ts-accent) 50%, rgba(255,255,255,.18));
      }
      #tokenShopInline .tsZoneCard.is-selected {
        border-color: color-mix(in srgb, var(--ts-accent) 75%, rgba(255,255,255,.2));
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--ts-accent) 10%, rgba(255,255,255,.02)) 0%, rgba(0,0,0,.18) 52%);
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, var(--ts-accent) 18%, transparent),
          0 12px 30px color-mix(in srgb, var(--ts-accent) 10%, transparent);
      }
      #tokenShopInline .tsZoneCard:focus-visible {
        outline: 2px solid color-mix(in srgb, var(--ts-accent) 55%, rgba(255,255,255,.18));
        outline-offset: 2px;
      }
      #tokenShopInline .tsZoneHead {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 8px;
        align-items: start;
        min-height: 28px;
        margin-bottom: 8px;
      }
      #tokenShopInline .tsZoneHead img {
        width: 24px;
        height: 24px;
        object-fit: contain;
        align-self: start;
      }
      #tokenShopInline .tsZoneHead h4 {
        display: flex;
        align-items: center;
        margin: 0;
        min-height: 24px;
        font-size: 13px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      #tokenShopInline .tsZoneBody {
        flex: 1 1 auto;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 12px;
        padding: 8px 10px;
        background: rgba(255,255,255,.02);
      }
      #tokenShopInline .tsZoneCols,
      #tokenShopInline .tsZoneRow {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 74px;
        gap: 10px;
        align-items: center;
      }
      #tokenShopInline .tsZoneCols {
        margin-bottom: 2px;
        color: var(--muted-color);
        font-size: 11px;
      }
      #tokenShopInline .tsRight {
        text-align: right;
      }
      #tokenShopInline .tsZoneRow {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255,255,255,.08);
        font-size: 12px;
      }
      #tokenShopInline .tsZoneRow:last-child {
        border-bottom: 0;
      }
      #tokenShopInline .tsZoneRow.is-best {
        background: color-mix(in srgb, var(--ts-accent) 10%, transparent);
        border-radius: 10px;
        padding-left: 6px;
        padding-right: 6px;
        margin-left: -6px;
        margin-right: -6px;
      }
      #tokenShopInline .tsZoneLabel {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }
      #tokenShopInline .tsZoneLabel .icon {
        width: 14px;
        height: 14px;
        flex: 0 0 auto;
      }
      #tokenShopInline .tsZoneName {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #tokenShopInline .tsZoneValue {
        font-variant-numeric: tabular-nums;
        font-weight: 700;
      }
      #tokenShopInline .tsZoneValueWrap {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        width: 100%;
      }
      #tokenShopInline .tsZoneCheck {
        font-size: 12px;
        line-height: 1;
        opacity: 0.95;
        color: var(--ts-accent);
      }
      #tokenShopInline .tsDetailShell {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(255,255,255,.12);
      }
      #tokenShopInline .tokenTable { border-collapse: collapse; }
      #tokenShopInline .tokenTable th { white-space: nowrap; }
      #tokenShopInline .tokenTable thead th {
        border-bottom: 1px solid rgba(255,255,255,0.16);
        padding-bottom: 10px;
      }
      #tokenShopInline .tokenTable td { vertical-align: middle; }

      #tokenShopInline .tokenTable tbody tr:hover td { box-shadow: inset 0 0 0 9999px rgba(255,255,255,0.03); }

      #tokenShopInline .priceCell { display:flex; flex-direction:column; align-items:flex-end; line-height:1.05; }
      #tokenShopInline .priceMain { font-variant-numeric: tabular-nums; }
      #tokenShopInline .subRow { display:flex; align-items:center; justify-content:flex-end; gap:6px; min-height: 14px; }
      #tokenShopInline .priceSub { font-size: 12px; opacity: 0.75; font-variant-numeric: tabular-nums; }
      #tokenShopInline .priceSub.muted { opacity: 0.50; }
      #tokenShopInline .cptMark { font-size: 12px; line-height: 1; opacity: 0.95; color: var(--accent); }

      #tokenShopInline .lineWrap { width: 92px; height: 16px; margin-top: 6px; position: relative; }
      #tokenShopInline .lineBase {
        position:absolute; left:0; right:0; top:50%;
        height: 3px; border-radius: 999px;
        background: rgba(255,255,255,0.10);
        transform: translateY(-50%);
        overflow: visible;
      }

      #tokenShopInline .lineTick {
        position:absolute;
        top: -2px; bottom: -2px;
        width: 1px;
        background: rgba(255,255,255,0.22);
        transform: translateX(-0.5px);
        z-index: 2;
        pointer-events:none;
      }
      #tokenShopInline .lineTick.center {
        width: 3px;
        background: rgba(255,255,255,0.70);
        transform: translateX(-1px);
      }
      #tokenShopInline .lineTick.n2 { left: 0%; opacity: 0.22; }
      #tokenShopInline .lineTick.n1 { left: 25%; opacity: 0.26; }
      #tokenShopInline .lineTick.p1 { left: 75%; opacity: 0.26; }
      #tokenShopInline .lineTick.p2 { left: 100%; opacity: 0.22; }
      #tokenShopInline .lineTick.center { left: 50%; }

      #tokenShopInline .lineSeg { position:absolute; top:0; bottom:0; border-radius:999px; z-index: 1; }
      #tokenShopInline .lineSeg.pos { background: linear-gradient(90deg, rgba(52,211,153,0.25), rgba(52,211,153,0.90)); }
      #tokenShopInline .lineSeg.neg { background: linear-gradient(270deg, rgba(248,113,113,0.25), rgba(248,113,113,0.90)); }

      
      #tokenShopInline .lineMarker {
        position:absolute;
        left: var(--x, 50%);
        top: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        width: 10px; height: 10px;
        border-radius: 2px;
        background: var(--mk, rgba(255,255,255,0.75));
        box-shadow: 0 0 0 2px rgba(0,0,0,0.22), 0 0 10px var(--glow, rgba(255,255,255,0.10));
        opacity: var(--o, 0.85);
        z-index: 3;
      }
      #tokenShopInline .lineMarker::after {
        content:"";
        position:absolute;
        inset: 2px;
        border: 1px solid rgba(255,255,255,0.30);
        border-radius: 1px;
      }
      #tokenShopInline .lineMarker.pos { --mk: rgba(52,211,153,0.95); --glow: rgba(52,211,153,0.22); }
      #tokenShopInline .lineMarker.neg { --mk: rgba(248,113,113,0.95); --glow: rgba(248,113,113,0.22); }

      #tokenShopInline .isBest td { box-shadow: inset 0 0 0 9999px rgba(0,0,0,0.04); }

      #tokenShopInline .shopActions { display:flex; gap:10px; align-items:center; }
      #tokenShopInline .refreshAge { opacity: 0.65; font-size: 12px; white-space: nowrap; }
      html[data-theme="light"] #tokenShopInline .tsZoneCard {
        border-color: rgba(59,66,82,0.12);
        background: rgba(255,255,255,0.62);
        box-shadow: 0 8px 22px rgba(59,66,82,0.05);
      }
      html[data-theme="light"] #tokenShopInline .tsZoneCard:hover {
        border-color: color-mix(in srgb, var(--ts-accent) 40%, rgba(59,66,82,0.16));
        background: rgba(255,255,255,0.78);
      }
      html[data-theme="light"] #tokenShopInline .tsZoneCard.is-selected {
        border-color: color-mix(in srgb, var(--ts-accent) 72%, rgba(59,66,82,0.18));
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--ts-accent) 12%, rgba(255,255,255,0.94)) 0%, rgba(255,255,255,0.72) 58%);
        box-shadow:
          inset 0 0 0 1px color-mix(in srgb, var(--ts-accent) 16%, transparent),
          0 10px 26px color-mix(in srgb, var(--ts-accent) 10%, transparent);
      }
      html[data-theme="light"] #tokenShopInline .tsZoneBody {
        border-color: rgba(59,66,82,0.10);
        background: rgba(255,255,255,0.34);
      }
      html[data-theme="light"] #tokenShopInline .tsZoneRow {
        border-bottom-color: rgba(59,66,82,0.08);
      }
      html[data-theme="light"] #tokenShopInline .tsZoneRow.is-best {
        background: color-mix(in srgb, var(--ts-accent) 12%, rgba(255,255,255,0.52));
      }
      @media (max-width: 1180px) {
        #tokenShopInline .tsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 780px) {
        #tokenShopInline .tsGrid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function getShared(name) {
    return window[name] || null;
  }

  function getTextShared() {
    return getShared("DungeonTextShared");
  }

  function getDungeonMetaShared() {
    return getShared("DungeonMetaShared");
  }

  function getMarketShared() {
    return getShared("DungeonMarketShared");
  }

  function getNumberShared() {
    return getShared("DungeonNumberShared");
  }

  function shortForUi(uiKey) {
    const shared = getDungeonMetaShared();
    if (shared && typeof shared.shortForUiKey === "function") {
      return shared.shortForUiKey(uiKey);
    }
    return UI_TO_SHORT[uiKey] || null;
  }

  function niceDungeonName(uiKey) {
    const shared = getDungeonMetaShared();
    if (shared && typeof shared.displayNameForUiKey === "function") {
      return shared.displayNameForUiKey(uiKey);
    }
    return UI_TO_NAME[uiKey] || uiKey;
  }

  function asText(value) {
    return String(value == null ? "" : value).trim();
  }

  function readZones() {
    const cards = Array.from(document.querySelectorAll(".card[data-dungeon]"));
    if (!cards.length) {
      return FALLBACK_ZONES.map((zone) => ({
        ...zone,
        title: t(`d.${zone.key}`, zone.title),
      }));
    }
    return cards.map((card, index) => {
      const key = asText(card.getAttribute("data-dungeon"));
      if (!key) return null;
      const titleFromCard = asText(card.querySelector("h2")?.textContent || "");
      const title = titleFromCard || t(`d.${key}`, UI_TO_NAME[key] || key);
      const icon = card.querySelector(".icon img")?.getAttribute("src") || FALLBACK_ZONES[index]?.icon || "";
      const accent = getComputedStyle(card).getPropertyValue("--card-accent").trim() || FALLBACK_ZONES[index]?.accent || "#34d399";
      return { key, title, icon, accent };
    }).filter(Boolean);
  }

  function t(key, fallback) {
    const translate = getTextShared()?.tValue;
    if (typeof translate === "function") return translate(key, fallback);
    return fallback;
  }

  function escHtml(v) {
    const escapeHtml = getTextShared()?.escapeHtml;
    if (typeof escapeHtml === "function") return escapeHtml(v);
    return String(v == null ? "" : v);
  }

  function escAttr(v) {
    const escapeAttr = getTextShared()?.escapeAttrFull;
    if (typeof escapeAttr === "function") return escapeAttr(v);
    return escHtml(v);
  }

  function bestBadgeHtml() {
    return `<span class="bestBadge" aria-label="${escAttr(t("ui.bestValue", "Best value"))}">${escHtml(t("ui.best", "best"))}</span>`;
  }

  function fmtCoins(n) {
    const formatter = getNumberShared()?.formatCoinsShort;
    if (typeof formatter === "function") return formatter(n, { invalidText: "—" });
    if (n == null || !Number.isFinite(n)) return "—";
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.00$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.00$/, "") + "k";
    return Math.floor(n).toLocaleString();
  }

  function fmtCpt(n) {
    const formatter = getNumberShared()?.formatWholeNumber;
    if (typeof formatter === "function") return formatter(n, { invalidText: "—", mode: "floor" });
    if (n == null || !Number.isFinite(n)) return "—";
    return Math.floor(n).toLocaleString();
  }

  function marketAskBidForItem(hrid, marketSlim) {
    const extractor = getMarketShared()?.extractAskBidFromMarketSlim;
    if (typeof extractor === "function") return extractor(marketSlim, hrid);
    return { bid: null, ask: null };
  }

  function getItemHridShared() {
    return getShared("DungeonItemHridShared");
  }

  function getTimeShared() {
    return getShared("DungeonTimeShared");
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

  function storageSetItem(key, value) {
    storageCall("setItem", key, value);
  }

  function fallbackFilenameFromItemHrid(itemHrid) {
    if (typeof itemHrid !== "string") return null;
    const m = itemHrid.match(/^\/items\/([^/]+)$/);
    if (!m) return null;
    const id = m[1];
    return id.length ? (id[0].toUpperCase() + id.slice(1) + ".svg") : null;
  }

  function iconPath(short, itemHrid) {
    const base = DROPS_DIR[short];
    if (!base) return null;
    const iconPathFromHrid = getItemHridShared()?.iconPathFromHrid;
    if (typeof iconPathFromHrid === "function") return iconPathFromHrid(itemHrid, base);
    const file = fallbackFilenameFromItemHrid(itemHrid);
    if (!file) return null;
    return base + encodeURIComponent(file).replace(/%2F/g, "/");
  }

  function getInitDataShared() {
    return getShared("DungeonInitDataShared");
  }

  async function getInitData() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      return await shared.getInitData();
    }
    if (window.InitCharacterData) return window.InitCharacterData;
    return await window.InitLoader?.loadInitData?.();
  }

  async function buildRowsFromInit(uiKey) {
    if (rowsCacheByUiKey.has(uiKey)) return rowsCacheByUiKey.get(uiKey);

    const init = await getInitData();
    if (!init) return [];

    const short = shortForUi(uiKey);
    if (!short) return [];

    const tokenHrid = `/items/${short}_token`;
    const shopMap = init.shopItemDetailMap || {};
    const itemMap = init.itemDetailMap || {};

    const rows = Object.values(shopMap)
      .filter(s => Array.isArray(s.costs) && s.costs.some(c => c.itemHrid === tokenHrid))
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
      .map(s => {
        const cost = s.costs.find(c => c.itemHrid === tokenHrid)?.count ?? 1;
        const itemHrid = s.itemHrid;
        const name = itemMap[itemHrid]?.name || (itemHrid?.split("/").pop()?.replace(/_/g, " ") || itemHrid);
        return { item: name, hrid: itemHrid, cost: Math.max(1, cost) };
      })
      .filter(r => !HIDE_ITEM_HRIDS.has(r.hrid));
    rowsCacheByUiKey.set(uiKey, rows);
    return rows;
  }

  function computeAverage(vals) {
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function computeStdDev(vals, mean) {
    if (vals.length < 2) return 0;
    let s = 0;
    for (const v of vals) s += (v - mean) * (v - mean);
    return Math.sqrt(s / (vals.length - 1));
  }

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function lineModel(cpt, mean, sd) {
    if (!(cpt > 0) || !(mean > 0)) return null;
    const denom = (sd > 1e-9) ? sd : 0;
    const z = denom ? ((cpt - mean) / denom) : 0;
    const zClamped = clamp(z, -2, 2);
    const xPct = ((zClamped + 2) / 4) * 100;
    const dir = zClamped > 0 ? "pos" : (zClamped < 0 ? "neg" : "");
    const t = clamp(Math.abs(zClamped) / 2, 0, 1);
    const opacity = 0.55 + 0.40 * t;

    let segLeft = 50;
    let segWidth = 0;
    if (xPct > 50) { segLeft = 50; segWidth = xPct - 50; }
    else if (xPct < 50) { segLeft = xPct; segWidth = 50 - xPct; }

    return { xPct, dir, opacity, segLeft, segWidth };
  }

  function lineHtml(model) {
    if (!model) return "";
    const ticks = `
      <span class="lineTick n2" aria-hidden="true"></span>
      <span class="lineTick n1" aria-hidden="true"></span>
      <span class="lineTick center" aria-hidden="true"></span>
      <span class="lineTick p1" aria-hidden="true"></span>
      <span class="lineTick p2" aria-hidden="true"></span>`;

    const seg =
      model.segWidth > 0
        ? `<span class="lineSeg ${model.dir}" style="left:${model.segLeft.toFixed(1)}%; width:${model.segWidth.toFixed(1)}%"></span>`
        : "";
    const dot = `<span class="lineMarker ${model.dir}" style="--x:${model.xPct.toFixed(1)}%; --o:${model.opacity.toFixed(2)}"></span>`;
    return `<div class="lineWrap"><div class="lineBase">${seg}${ticks}${dot}</div></div>`;
  }

  function bestIndexSet(rows, metricKey, excludeHrid) {
    let best = -Infinity;
    for (const r of rows) {
      if (r.hrid === excludeHrid) continue;
      const v = r[metricKey];
      if (typeof v === "number" && Number.isFinite(v) && v > best) best = v;
    }
    if (!Number.isFinite(best) || best <= 0) return new Set();
    const eps = Math.max(1e-9, Math.abs(best) * 1e-12);
    const out = new Set();
    rows.forEach((r, i) => {
      if (r.hrid === excludeHrid) return;
      const v = r[metricKey];
      if (typeof v === "number" && Number.isFinite(v) && Math.abs(v - best) <= eps) out.add(i);
    });
    return out;
  }

  function positiveMetricValues(rows, metricKey, excludeHrid) {
    return rows
      .filter((r) => r.hrid !== excludeHrid)
      .map((r) => r[metricKey])
      .filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0);
  }

  function priceCellHtml(price, cpt, model, showCheck, showExtras) {
    const main = fmtCoins(price);
    if (!showExtras) return `<div class="priceCell"><span class="priceMain">${escHtml(main)}</span></div>`;

    const hasCpt = (typeof cpt === "number" && Number.isFinite(cpt) && cpt > 0);
    const sub = fmtCpt(cpt);
    const mark = showCheck ? `<span class="cptMark" title="${escAttr(t("ui.topCoinsPerToken", "Top coins/token"))}">✓</span>` : "";

    return `
      <div class="priceCell">
        <span class="priceMain">${escHtml(main)}</span>
        <div class="subRow">
          ${mark}
          <span class="${hasCpt ? "priceSub" : "priceSub muted"}" title="${escAttr(t("ui.coinsPerToken", "Coins per token"))}">${escHtml(sub)}</span>
        </div>
        ${lineHtml(model)}
      </div>`;
  }

  function refreshKey(pricingModel, uiKey) {
    return `dungeon.market.lastRefreshTs.${String(pricingModel || "official").toLowerCase()}.${String(uiKey || "unknown")}`;
  }

  function writeRefreshTimestampForEvent(dungeonKey, apiSource, ts) {
    const key = String(dungeonKey || "").trim();
    if (!key || !Number.isFinite(ts) || ts <= 0) return;
    if (apiSource === "other") {
      try { storageSetItem(refreshKey("other", key), String(ts)); } catch (_) { }
      return;
    }
    // Manual pricing still uses official market snapshots under the hood.
    try { storageSetItem(refreshKey("official", key), String(ts)); } catch (_) { }
    try { storageSetItem(refreshKey("manual", key), String(ts)); } catch (_) { }
  }

  function formatAge(ms) {
    const format = getTimeShared()?.formatAge;
    if (typeof format === "function") return format(ms, { style: "ago", invalidText: "—" });
    return "—";
  }

  function startAgeTimer(spanEl, key) {
    const startTimer = getTimeShared()?.startAgeTimerFromStorage;
    if (typeof startTimer !== "function") return;
    startTimer(spanEl, {
      timerKey: AGE_TIMER_KEY,
      storageKey: key,
      invalidText: "—",
      intervalMs: 5000,
      formatter: formatAge,
    });
  }

  function requestRefresh(pricingModel) {
    const model = String(pricingModel || "official").toLowerCase();
    const map = {
      official: ["simpleOfficialRefreshBtn", "officialRefreshBtn"],
      other: ["otherRefreshBtn"],
    };
    const ids = map[model] || map.official;
    for (const id of ids) {
      const btn = document.getElementById(id);
      if (btn && typeof btn.click === "function") {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function clearTokenShopInlinePanel(panelEl) {
    hideAndClearElement(panelEl);
  }

  async function requestAllRefresh(pricingModel) {
    const api = window.DungeonAPI || null;
    if (api && typeof api.refreshPricesForAllDungeons === "function") {
      try {
        await api.refreshPricesForAllDungeons(pricingModel, { silent: true, reason: "token-shop" });
        return true;
      } catch (_) { }
    }
    return requestRefresh(pricingModel);
  }

  function buildTokenShopRows(rowsFromInit, marketSlim, short) {
    return rowsFromInit.map(r => {
      const { bid, ask } = marketAskBidForItem(r.hrid, marketSlim);
      const bidCpt = (typeof bid === "number" && r.cost > 0) ? (bid / r.cost) : null;
      const askCpt = (typeof ask === "number" && r.cost > 0) ? (ask / r.cost) : null;
      const bestMetric = Math.max(
        (typeof bidCpt === "number" && Number.isFinite(bidCpt)) ? bidCpt : -Infinity,
        (typeof askCpt === "number" && Number.isFinite(askCpt)) ? askCpt : -Infinity,
      );
      return { ...r, bid, ask, bidCpt, askCpt, bestMetric, icon: iconPath(short, r.hrid) };
    });
  }

  async function buildZoneTokenData(zone, pricingModel) {
    const uiKey = zone.key;
    const short = shortForUi(uiKey);
    const rowsFromInit = await buildRowsFromInit(uiKey);
    const essenceHrid = short ? `/items/${short}_essence` : null;
    const marketSlim = window.DungeonAPI?.getMarketSlim?.(uiKey, pricingModel) || null;
    const rows = buildTokenShopRows(rowsFromInit, marketSlim, short);

    const askVals = positiveMetricValues(rows, "askCpt", essenceHrid);
    const bidVals = positiveMetricValues(rows, "bidCpt", essenceHrid);
    const meanAsk = computeAverage(askVals);
    const meanBid = computeAverage(bidVals);
    const sdAsk = computeStdDev(askVals, meanAsk);
    const sdBid = computeStdDev(bidVals, meanBid);

    return {
      uiKey,
      short,
      title: zone.title,
      icon: zone.icon,
      accent: zone.accent,
      essenceHrid,
      rows,
      meanAsk,
      meanBid,
      sdAsk,
      sdBid,
      bestAskIdx: bestIndexSet(rows, "askCpt", essenceHrid),
      bestBidIdx: bestIndexSet(rows, "bidCpt", essenceHrid),
      bestOverallIdx: bestIndexSet(rows, "bestMetric", essenceHrid),
    };
  }

  function tokenZoneCardHtml(zoneData, selectedUiKey) {
    const isSelected = zoneData.uiKey === selectedUiKey;
    const zoneIconHtml = zoneData.icon
      ? `<img src="${escAttr(zoneData.icon)}" alt="" loading="lazy" onerror="this.style.display='none'">`
      : "";
    const bodyRows = zoneData.rows.map((row, idx) => {
      const rowClass = zoneData.bestOverallIdx.has(idx) ? " is-best" : "";
      const mark = zoneData.bestOverallIdx.has(idx)
        ? `<span class="tsZoneCheck" title="${escAttr(t("ui.topCoinsPerToken", "Top coins/token"))}">✓</span>`
        : "";
      const iconHtml = row.icon ? `<img src="${escAttr(row.icon)}" alt="" class="icon" loading="lazy" onerror="this.style.display='none'">` : "";
      return `
        <div class="tsZoneRow${rowClass}">
          <div class="tsZoneLabel">${iconHtml}<span class="tsZoneName">${escHtml(summaryItemName(row.item))}</span></div>
          <div class="tsZoneValue tsRight"><span class="tsZoneValueWrap">${mark}<span>${escHtml(fmtCpt(row.askCpt))}</span></span></div>
        </div>
      `;
    }).join("");

    return `
      <button
        class="tsZoneCard${isSelected ? " is-selected" : ""}"
        type="button"
        data-token-zone="${escAttr(zoneData.uiKey)}"
        aria-pressed="${isSelected ? "true" : "false"}"
        style="--ts-accent:${escAttr(zoneData.accent || "#34d399")};"
      >
        <div class="tsZoneHead">
          ${zoneIconHtml}
          <h4>${escHtml(zoneData.title)}</h4>
        </div>
        <div class="tsZoneBody">
          <div class="tsZoneCols">
            <span>${escHtml(t("ui.item", "Item"))}</span>
            <span class="tsRight">${escHtml(t("ui.coinsPerToken", "Coins/Token"))}</span>
          </div>
          ${bodyRows}
        </div>
      </button>
    `;
  }

  function tokenZoneCardsHtml(zoneDataList, selectedUiKey) {
    return `<div class="tsGrid">${zoneDataList.map((zoneData) => tokenZoneCardHtml(zoneData, selectedUiKey)).join("")}</div>`;
  }

  function detailTableHtml(zoneData) {
    if (!zoneData) return "";
    const bodyRows = zoneData.rows.map((r, idx) => {
      const isEssence = r.hrid === zoneData.essenceHrid;
      const isBestOverall = zoneData.bestOverallIdx.has(idx);
      const rowClass = isBestOverall ? ' class="isBest"' : "";
      const badge = isBestOverall ? bestBadgeHtml() : "";
      const iconHtml = r.icon ? `<img src="${escAttr(r.icon)}" alt="" class="icon" loading="lazy" onerror="this.style.display='none'">` : "";
      const askModel = isEssence ? null : lineModel(r.askCpt, zoneData.meanAsk, zoneData.sdAsk);
      const bidModel = isEssence ? null : lineModel(r.bidCpt, zoneData.meanBid, zoneData.sdBid);
      const askHtml = priceCellHtml(r.ask, r.askCpt, askModel, zoneData.bestAskIdx.has(idx), !isEssence);
      const bidHtml = priceCellHtml(r.bid, r.bidCpt, bidModel, zoneData.bestBidIdx.has(idx), !isEssence);
      return `<tr${rowClass}>
        <td>${iconHtml}<span>${escHtml(r.item)}</span>${badge}</td>
        <td class="tRight">${escHtml(String(r.cost))}</td>
        <td class="tRight">${askHtml}</td>
        <td class="tRight">${bidHtml}</td>
      </tr>`;
    }).join("");

    return `
      <table class="tokenTable">
        <thead>
          <tr>
            <th>${escHtml(t("ui.items", "Item"))}</th>
            <th class="tRight">${escHtml(t("ui.tokens", "Tokens"))}</th>
            <th class="tRight">${escHtml(t("ui.ask", "Ask"))}</th>
            <th class="tRight">${escHtml(t("ui.bid", "Bid"))}</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
  }

  function summaryItemName(name) {
    const text = asText(name);
    const firstSpace = text.indexOf(" ");
    if (firstSpace < 0) return text;
    return asText(text.slice(firstSpace + 1)) || text;
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

  function detailShellHtml(zoneData) {
    if (!zoneData) {
      return `<div class="muted">${escHtml(t("ui.noData", "No data"))}</div>`;
    }
    return `
      <div class="panelHead">
        <div><h4>${escHtml(t("ui.tokenShop", "Token Shop"))} • ${escHtml(zoneData.title)}</h4></div>
        <div class="shopActions">
          <span class="refreshAge" id="tokenShopRefreshAge">—</span>
          <button class="miniBtn" type="button" id="tokenShopRefreshBtn" title="${escAttr(t("ui.refreshPricingApi", "Refresh pricing API"))}">${escHtml(t("ui.refreshPrices", "Refresh prices"))}</button>
        </div>
      </div>
      ${detailTableHtml(zoneData)}
    `;
  }

  function updateZoneSelection(panel, selectedUiKey) {
    if (!panel) return;
    panel.querySelectorAll("[data-token-zone]").forEach((btn) => {
      const uiKey = asText(btn.getAttribute("data-token-zone"));
      const isSelected = uiKey === asText(selectedUiKey);
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function renderDetailShell(panel, zoneData, pricingModel) {
    if (!panel) return;
    const shell = panel.querySelector(".tsDetailShell");
    if (!shell) return;
    const priorHeight = shell.offsetHeight;
    const lockedHeight = Number(shell.dataset.lockedMinHeight || 0);
    const baseHeight = Math.max(priorHeight, lockedHeight);
    if (baseHeight > 0) shell.style.minHeight = `${baseHeight}px`;
    shell.innerHTML = detailShellHtml(zoneData);
    const nextHeight = shell.offsetHeight;
    const stableHeight = Math.max(baseHeight, nextHeight);
    if (stableHeight > 0) {
      shell.style.minHeight = `${stableHeight}px`;
      shell.dataset.lockedMinHeight = String(stableHeight);
    }
    const ageSpan = shell.querySelector("#tokenShopRefreshAge");
    const ageKey = refreshKey(pricingModel, zoneData?.uiKey || "");
    if (ageSpan) startAgeTimer(ageSpan, ageKey);
    const refreshBtn = shell.querySelector("#tokenShopRefreshBtn");
    if (refreshBtn) bindTokenShopRefreshButton(refreshBtn, pricingModel, ageSpan, ageKey);
  }

  function bindTokenShopRefreshButton(refreshBtn, pricingModel, ageSpan, ageKey) {
    if (!refreshBtn) return;
    refreshBtn.addEventListener("click", async () => {
      const ok = await requestAllRefresh(pricingModel);
      if (ok) {
        if (ageSpan) startAgeTimer(ageSpan, ageKey);
      } else {
        refreshBtn.textContent = t("ui.noApi", "No API");
        window.setTimeout(() => { refreshBtn.textContent = t("ui.refreshPrices", "Refresh prices"); }, 900);
      }
      window.setTimeout(() => { render({ suppressBump: true }); }, AUTO_REFRESH_RENDER_DELAY_MS);
    }, { once: true });
  }

  function findZoneDataByUiKey(zoneDataList, uiKey) {
    const key = asText(uiKey);
    if (!key) return null;
    return (zoneDataList || []).find((zoneData) => zoneData.uiKey === key) || null;
  }

  function resolveSelectedZoneData(zoneDataList, requestedUiKey, opts = {}) {
    const selectionOnly = !!opts.selectionOnly;
    const globalMatch = findZoneDataByUiKey(zoneDataList, requestedUiKey);
    if (selectionOnly && globalMatch) {
      tokenShopSelectedUiKey = globalMatch.uiKey;
      return globalMatch;
    }
    const localMatch = findZoneDataByUiKey(zoneDataList, tokenShopSelectedUiKey);
    const selectedData = localMatch || globalMatch || (zoneDataList || [])[0] || null;
    tokenShopSelectedUiKey = asText(selectedData?.uiKey || "");
    return selectedData;
  }

  async function render(opts = {}) {
    const suppressBump = !!opts.suppressBump;
    const selectionOnly = !!opts.selectionOnly;
    const panel = document.getElementById("tokenShopInline");
    if (!panel) return;

    const toggle = document.getElementById("tokenShopToggle");
    const requestedUiKey = asText(window.DungeonAPI?.getSelectedDungeon?.() || "");

    if (!toggle || !toggle.checked) {
      clearTokenShopInlinePanel(panel);
      lastAutoRefreshSignature = "";
      lastRenderState = null;
      tokenShopSelectedUiKey = "";
      return;
    }

    injectStyleOnce();

    const pricingModel = window.DungeonAPI?.getPricingModel?.() || "official";
    if (selectionOnly && lastRenderState && lastRenderState.pricingModel === pricingModel && panel.querySelector(".tsShell")) {
      const selectedData = resolveSelectedZoneData(lastRenderState.zoneDataList || [], requestedUiKey, { selectionOnly: true });
      if (selectedData) {
        updateZoneSelection(panel, selectedData.uiKey);
        renderDetailShell(panel, selectedData, pricingModel);
        return;
      }
    }

    const refreshSignature = `${String(pricingModel || "official").toLowerCase()}::token-shop`;
    if (refreshSignature !== lastAutoRefreshSignature) {
      lastAutoRefreshSignature = refreshSignature;
      void requestAllRefresh(pricingModel).then((ok) => {
        if (ok) window.setTimeout(() => { render({ suppressBump: true }); }, AUTO_REFRESH_RENDER_DELAY_MS);
      });
    }
    const zones = readZones();
    const zoneDataList = await Promise.all(zones.map((zone) => buildZoneTokenData(zone, pricingModel)));
    const selectedData = resolveSelectedZoneData(zoneDataList, requestedUiKey, { selectionOnly });
    lastRenderState = { pricingModel, zoneDataList };

    panel.hidden = false;
    panel.innerHTML = `
      <div class="tsShell">
        ${tokenZoneCardsHtml(zoneDataList, selectedData?.uiKey || "")}
        <div class="tsDetailShell"></div>
      </div>
    `;
    panel.scrollLeft = 0;
    renderDetailShell(panel, selectedData, pricingModel);
    panel.querySelectorAll("[data-token-zone]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextUiKey = asText(btn.getAttribute("data-token-zone"));
        if (!nextUiKey || nextUiKey === asText(tokenShopSelectedUiKey)) return;
        const nextData = findZoneDataByUiKey(zoneDataList, nextUiKey);
        if (!nextData) return;
        tokenShopSelectedUiKey = nextUiKey;
        updateZoneSelection(panel, nextUiKey);
        renderDetailShell(panel, nextData, pricingModel);
      });
    });

    if (!suppressBump) {
      panel.classList.remove("bump");
      void panel.offsetWidth;
      panel.classList.add("bump");
      window.setTimeout(() => panel.classList.remove("bump"), 300);
    }
  }

  function bind() {
    const toggle = document.getElementById("tokenShopToggle");
    const panel = document.getElementById("tokenShopInline");
    if (!toggle || !panel) return;

    document.addEventListener("dungeon:prices-refreshed", (evt) => {
      const detail = evt?.detail || {};
      const dungeonKey = String(detail.dungeonKey || "").trim();
      const apiSource = String(detail.apiSource || "official").toLowerCase();
      const fetchedAt = Number(detail.fetchedAt);
      if (!dungeonKey || !Number.isFinite(fetchedAt) || fetchedAt <= 0) return;

      writeRefreshTimestampForEvent(dungeonKey, apiSource, fetchedAt);
      if (!toggle.checked) return;
      window.setTimeout(() => { render({ suppressBump: true }); }, 60);
    });

    const apply = () => {
      document.body.classList.toggle("token-shop-active", !!toggle.checked);
      if (!toggle.checked) {
        clearTokenShopInlinePanel(panel);
        lastRenderState = null;
        tokenShopSelectedUiKey = "";
        return;
      }
      const selectedDungeon = asText(window.DungeonAPI?.getSelectedDungeon?.() || "");
      if (!selectedDungeon && typeof window.DungeonAPI?.ensureTokenShopDungeonSelection === "function") {
        const autoSelected = !!window.DungeonAPI.ensureTokenShopDungeonSelection();
        if (autoSelected) return;
      }
      render();
    };

    toggle.addEventListener("change", apply);
    document.addEventListener("site:lang-changed", () => {
      if (toggle.checked) window.setTimeout(() => { render({ suppressBump: true }); }, 20);
    });
    apply();

    window.TokenShopInline = {
      render,
      isActive: () => !!toggle.checked,
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();


