(() => {
  "use strict";
  // Ownership/invariant:
  // - Optional developer-only diagnostics panel.
  // - Reads live state from DungeonAPI/DungeonCalc/DungeonChestEV and never mutates gameplay math.
  const CLICK_TARGET_SELECTOR = ".siteWatermark";
  const REQUIRED_CLICKS = 10;
  let clicks = 0, timer = null;
  let devZoneDungeonKey = "";
  let devEvSide = "bid";
  const ZC_STORAGE = {
    lowDrop: "dungeon.zoneCompare.removeLowDrops.v3",
    manualLoot: "dungeon.zoneCompare.manualLoot.v1",
    manualOverrides: "dungeon.zoneCompare.manualOverrides.v1",
    mirrorBackslot: "dungeon.zoneCompare.mirrorBackslot.v1",
  };
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
  const MIRROR_HRID = "/items/mirror_of_protection";
  const BACKSLOT_HRIDS = [
    "/items/enchanted_cloak",
    "/items/sinister_cape",
    "/items/chimerical_quiver",
  ];

  function getTextShared() {
    return window.DungeonTextShared || null;
  }

  function getShared(name) {
    return window[name] || null;
  }

  function getPricingStateShared() {
    return getShared("DungeonPricingStateShared");
  }

  function getMetaShared() {
    return getShared("DungeonMetaShared");
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

  function formatViaLabel(value) {
    const raw = String(value || "").trim();
    const normalized = raw.toLowerCase();
    if (!raw || raw === "-") return "-";
    if (normalized === "market") return t("ui.market", "market");
    if (normalized === "mixed") return t("ui.mixed", "mixed");
    if (normalized === "bid") return t("ui.bid", "bid");
    if (normalized === "ask") return t("ui.ask", "ask");
    return raw;
  }

  function normalizeEvSide(side) {
    return side === "ask" ? "ask" : "bid";
  }

  function evSideLabel(side) {
    return normalizeEvSide(side) === "ask" ? t("ui.ask", "ask") : t("ui.bid", "bid");
  }

  function formatPricingModelLabel(model) {
    const shared = getPricingStateShared();
    if (shared && typeof shared.pricingModelLabel === "function") return shared.pricingModelLabel(model);
    if (model === "manual") return t("ui.manualPlusOfficial", "Manual + Official");
    if (model === "other") return t("ui.mooket", "Mooket");
    return t("ui.official", "Official");
  }

  function ensureResizeHandleLeftStyle() {
    if (document.getElementById("devResizeHandleLeftStyle")) return;
    const style = document.createElement("style");
    style.id = "devResizeHandleLeftStyle";
    style.textContent = `
      #devPanel .dev-resize-handle{
        right: auto !important;
        left: 10px !important;
        cursor: nesw-resize !important;
        transform: scaleX(-1);
        transform-origin: center;
      }
      #devPanel .dev-tabs-wrap{
        display:flex;
        align-items:center;
        gap:8px;
        margin:0 0 8px;
      }
      #devPanel .dev-tabs-wrap > label{
        color:var(--muted-color,#9ca3af);
        font-size:12px;
        white-space:nowrap;
      }
      #devPanel .dev-tabs{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
      }
      #devPanel .dev-tab{
        border:1px solid rgba(255,255,255,.22);
        background:rgba(255,255,255,.06);
        color:inherit;
        border-radius:999px;
        padding:3px 10px;
        font-size:12px;
        cursor:pointer;
      }
      #devPanel .dev-tab.is-active{
        border-color:rgba(16,185,129,.9);
        background:rgba(16,185,129,.18);
        font-weight:700;
      }
      #devPanel .dev-ev-head{
        display:flex;
        align-items:center;
        justify-content:flex-start;
        gap:8px;
        flex-wrap:wrap;
      }
      #devPanel .dev-side-toggle{
        display:inline-flex;
        gap:6px;
      }
      #devPanel .dev-side-btn{
        border:1px solid rgba(255,255,255,.22);
        background:rgba(255,255,255,.06);
        color:inherit;
        border-radius:999px;
        padding:3px 10px;
        font-size:12px;
        cursor:pointer;
      }
      #devPanel .dev-side-btn.is-active{
        border-color:rgba(16,185,129,.9);
        background:rgba(16,185,129,.18);
        font-weight:700;
      }
    `;
    document.head.appendChild(style);
  }


  function ensurePanel() {
    if (document.getElementById("devPanel")) return;
    ensureResizeHandleLeftStyle();
    const panel = document.createElement("div");
    panel.id = "devPanel"; panel.className = "dev-panel hidden";
    const sideLabel = evSideLabel(devEvSide);
    panel.innerHTML = `
      <div class="dev-head"><strong>${t("ui.developerPanel", "Developer Panel")}</strong><button class="dev-close">×</button></div>
      <div class="dev-body">
        <div id="devZoneTabsWrap" class="dev-tabs-wrap hidden">
          <label>${t("ui.zoneView", "Zone view:")}</label>
          <div id="devZoneTabs" class="dev-tabs" role="tablist" aria-label="${t("ui.zoneSelector", "Zone selector")}"></div>
        </div>
        <div class="dev-row">
          <div><label>${t("ui.dungeon", "Dungeon")}:</label> <span id="devDungeon">-</span></div>
          <div><label>${t("ui.tier", "Tier")}:</label> <span id="devTier">-</span></div>
          <div><label>${t("ui.pricing", "Pricing")}:</label> <span id="devPricing">-</span></div>
        </div>
        <div class="dev-row">
          <div><label>${t("ui.runsPerDay", "Runs / day")}:</label> <span id="devRuns">-</span></div>
          <div><label>${t("ui.buffTier", "Buff tier:")}</label> <span id="devBuff">-</span></div>
          <div><label>${t("ui.taxPercent", "Tax %:")}</label> <span id="devTax">-</span></div>
        </div>
        <div class="dev-row">
          <div><label>${t("ui.entryKeyAskBid", "Entry key (ask/bid):")}</label> <span id="devEntry">-</span></div>
          <div><label>${t("ui.chestKeyAskBid", "Chest key (ask/bid):")}</label> <span id="devChest">-</span></div>
        </div>

        <div id="devError" class="dev-error hidden"></div>

        <div class="dev-section">
          <div class="dev-ev-head">
            <div id="devEvSideToggle" class="dev-side-toggle" role="group" aria-label="${t("ui.price", "Price")}">
              <button type="button" class="dev-side-btn${devEvSide === "bid" ? " is-active" : ""}" data-side="bid" aria-pressed="${devEvSide === "bid" ? "true" : "false"}">${t("ui.bid", "bid")}</button>
              <button type="button" class="dev-side-btn${devEvSide === "ask" ? " is-active" : ""}" data-side="ask" aria-pressed="${devEvSide === "ask" ? "true" : "false"}">${t("ui.ask", "ask")}</button>
            </div>
            <h4>${t("ui.chestEvBreakdownTitle", "Chest EV breakdown")} <span id="devSide">${sideLabel}</span></h4>
          </div>
          <div id="devBreakdown" class="dev-grid"></div>
        </div>

        <div class="dev-row" id="devSumRow">
          <div><label>${t("ui.sumContrib", "Σ contrib:")}</label> <span id="devSumContrib">-</span></div>
          <div><label>${t("ui.chestEv", "Chest EV:")}</label> <span id="devChestEv">-</span></div>
          <div><label>${t("ui.deltaSumEv", "Δ (sum - EV):")}</label> <span id="devDelta">-</span></div>
        </div>

        <div class="dev-section">
          <h4>${t("ui.refinedChestEvBreakdownTitle", "Refined Chest EV breakdown")} <span id="devSideRef">${sideLabel}</span></h4>
          <div id="devRefined" class="dev-grid"></div>
        </div>

        <div class="dev-section">
          <h4>${t("ui.trace", "Trace")}</h4>
          <pre id="devTrace" class="dev-pre"></pre>
        </div>
        <div class="dev-actions">
          <button id="devRefresh" class="dev-btn">${t("ui.refresh", "Refresh")}</button>
        </div>
      </div>
      <div class="dev-resize-handle" aria-hidden="true"></div>`;
    document.body.appendChild(panel);
    const closeBtn = panel.querySelector(".dev-close");
    if (closeBtn) closeBtn.addEventListener("click", () => panel.classList.add("hidden"));
    const refreshBtn = document.getElementById("devRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => void refresh());
    const evSideToggle = document.getElementById("devEvSideToggle");
    if (evSideToggle) {
      evSideToggle.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("button[data-side]");
        if (!btn) return;
        const next = normalizeEvSide(btn.dataset.side);
        if (next === devEvSide) return;
        devEvSide = next;
        updateEvSideToggleUi();
        void refresh();
      });
    }
    bindResize(panel);
  }


  function bindResize(panel) {
    const handle = panel.querySelector(".dev-resize-handle");
    if (!handle) return;

    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);

      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startW = rect.width;
      startH = rect.height;

      // Lock to px so resize feels stable even if height was "auto".
      panel.style.width = `${startW}px`;
      panel.style.height = `${startH}px`;
    });

    handle.addEventListener("pointermove", (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;

      const dx = startX - e.clientX; // drag left => wider
      const dy = e.clientY - startY; // drag down => taller

      const minW = 360;
      const minH = 260;
      const maxW = window.innerWidth - 28;
      const maxH = Math.floor(window.innerHeight * 0.92);

      const nextW = clamp(startW + dx, minW, maxW);
      const nextH = clamp(startH + dy, minH, maxH);

      panel.style.width = `${nextW}px`;
      panel.style.height = `${nextH}px`;
    });

    function end(e) {
      try {
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      } catch (_) { }
    }

    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function fmt(n) { if (!Number.isFinite(n)) return "-"; return Math.round(n).toLocaleString(); }

  function fmtQty(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "-";
    const abs = Math.abs(x);
    const digits = abs >= 1 ? 2 : 4;
    return x.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function getMarketShared() {
    return getShared("DungeonMarketShared");
  }

  function storageGetItem(key) {
    const shared = getStorageShared();
    if (shared && typeof shared.getItem === "function") return shared.getItem(key);
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function parseJson(text, fallback) {
    try {
      return (text == null || text === "") ? fallback : JSON.parse(text);
    } catch (_) {
      return fallback;
    }
  }

  function mergeOverrideMaps(base, more) {
    const out = {};
    if (base && typeof base === "object") Object.assign(out, base);
    if (more && typeof more === "object") Object.assign(out, more);
    return Object.keys(out).length ? out : null;
  }

  function toShortDungeonKey(dungeonKey) {
    const shared = getMetaShared();
    if (shared && typeof shared.shortForUiOrSelf === "function") return shared.shortForUiOrSelf(dungeonKey);
    return UI_TO_SHORT[dungeonKey] || dungeonKey;
  }

  function readZoneCompareState() {
    const rawOverrides = parseJson(storageGetItem(ZC_STORAGE.manualOverrides), {});
    const manualOverrides = {};
    if (rawOverrides && typeof rawOverrides === "object") {
      for (const [k, v] of Object.entries(rawOverrides)) {
        const n = Number(v);
        if (Number.isFinite(n) && n >= 0) manualOverrides[k] = n;
      }
    }
    return {
      lowDrop: storageGetItem(ZC_STORAGE.lowDrop) === "1",
      manualLoot: storageGetItem(ZC_STORAGE.manualLoot) === "1",
      mirrorBackslot: storageGetItem(ZC_STORAGE.mirrorBackslot) === "1",
      manualOverrides,
    };
  }

  function extractAskBid(market, hrid) {
    const row = market?.[hrid] || null;
    const normalize = getMarketShared()?.normalizeAskBidQuote;
    if (typeof normalize === "function") return normalize(row);
    return { ask: null, bid: null };
  }

  async function buildLowDropOverrides(shortKey, enabled) {
    if (!enabled) return {};
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

  async function buildZoneCompareOverrides(dungeonKey, marketData) {
    const zc = readZoneCompareState();
    const short = toShortDungeonKey(dungeonKey);
    const low = await buildLowDropOverrides(short, !!zc.lowDrop);

    let out = mergeOverrideMaps(null, low) || {};
    if (zc.manualLoot) out = mergeOverrideMaps(out, zc.manualOverrides || {}) || {};

    if (zc.mirrorBackslot) {
      const mirrorAB = extractAskBid(marketData, MIRROR_HRID);
      const mirrorPrice = (Number.isFinite(mirrorAB.bid) && mirrorAB.bid >= 0)
        ? mirrorAB.bid
        : ((Number.isFinite(mirrorAB.ask) && mirrorAB.ask >= 0) ? mirrorAB.ask : NaN);
      const mirrorMap = {};
      if (Number.isFinite(mirrorPrice) && mirrorPrice >= 0) {
        BACKSLOT_HRIDS.forEach((h) => { mirrorMap[h] = mirrorPrice; });
      } else {
        BACKSLOT_HRIDS.forEach((h) => { mirrorMap[h] = 0; });
      }
      out = mergeOverrideMaps(out, mirrorMap) || {};
    } else {
      const zeroBackslot = {};
      BACKSLOT_HRIDS.forEach((h) => { zeroBackslot[h] = 0; });
      out = mergeOverrideMaps(out, zeroBackslot) || {};
    }

    return Object.keys(out).length ? out : null;
  }


  // helper to set sum/ev/delta row
  function renderSums(sumContrib, chestEv) {
    const sumEl = document.getElementById("devSumContrib");
    const evEl = document.getElementById("devChestEv");
    const dEl = document.getElementById("devDelta");

    if (sumEl) sumEl.textContent = fmt(sumContrib);
    if (evEl) evEl.textContent = fmt(chestEv);

    if (dEl) {
      const left = Number.isFinite(sumContrib) ? sumContrib : 0;
      const right = Number.isFinite(chestEv) ? chestEv : 0;
      const delta = left - right;
      dEl.textContent = fmt(delta);
      // Visual cue for mismatch without relying on extra CSS.
      dEl.style.color = Math.abs(delta) < 0.5 ? "" : "salmon";
      dEl.title = Math.abs(delta) < 0.5
        ? t("ui.ok", "OK")
        : t("ui.mismatchSumVsEv", "Mismatch (sum vs EV)");
    }
  }


  function renderGridHeader(grid) {
    const headers = [
      t("ui.items", "Item"),
      t("ui.quantity", "Quantity"),
      t("ui.value", "Value"),
      t("ui.price", "Price"),
      t("ui.contribution", "Contribution"),
    ];
    for (const h of headers) {
      const el = document.createElement("div");
      el.className = "dev-th";
      el.textContent = h;
      grid.appendChild(el);
    }
  }

  function appendGridRow(grid, row) {
    const name = document.createElement("div"); name.className = "dev-name"; name.textContent = row.name;
    const qty = document.createElement("div"); qty.className = "dev-qty"; qty.textContent = row.qty;
    const unit = document.createElement("div"); unit.className = "dev-unit"; unit.textContent = row.unit;
    const via = document.createElement("div"); via.className = "dev-via"; via.textContent = row.via;
    const contrib = document.createElement("div"); contrib.className = "dev-contrib"; contrib.textContent = row.contrib;
    grid.appendChild(name);
    grid.appendChild(qty);
    grid.appendChild(unit);
    grid.appendChild(via);
    grid.appendChild(contrib);
  }

  function setRequiredText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value ?? "");
  }

  function prettyDungeonLabel(dungeonKey) {
    const k = String(dungeonKey || "");
    if (!k) return "-";
    const shared = getMetaShared();
    const viaShared = shared?.displayForUiKey?.(k) || shared?.displayForUiOrSelf?.(k) || "";
    if (viaShared) return String(viaShared);
    return k.split("_").map((p) => p ? (p[0].toUpperCase() + p.slice(1)) : "").join(" ");
  }

  function readAvailableDungeonTabs() {
    const cards = Array.from(document.querySelectorAll(".card[data-dungeon]"));
    const seen = new Set();
    const out = [];
    for (const card of cards) {
      const key = String(card?.dataset?.dungeon || "").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const label = String(card.querySelector("h2")?.textContent || "").trim() || prettyDungeonLabel(key);
      out.push({ key, label });
    }
    return out;
  }

  function isZoneCompareOn() {
    return !!document.getElementById("zoneCompareToggle")?.checked;
  }

  function renderDungeonTabs(ctx = {}) {
    const wrap = document.getElementById("devZoneTabsWrap");
    const host = document.getElementById("devZoneTabs");
    if (!wrap || !host) return;
    const tabs = Array.isArray(ctx.zoneTabs) ? ctx.zoneTabs : [];
    const on = !!ctx.zoneCompareOn && tabs.length > 1;
    wrap.classList.toggle("hidden", !on);
    host.innerHTML = "";
    if (!on) return;

    tabs.forEach((z) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `dev-tab${z.key === ctx.dungeonKey ? " is-active" : ""}`;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", z.key === ctx.dungeonKey ? "true" : "false");
      btn.dataset.dungeon = z.key;
      btn.textContent = z.label;
      btn.addEventListener("click", () => {
        if (devZoneDungeonKey === z.key) return;
        devZoneDungeonKey = z.key;
        void refresh();
      });
      host.appendChild(btn);
    });
  }

  function updateEvSideToggleUi() {
    const host = document.getElementById("devEvSideToggle");
    if (!host) return;
    host.querySelectorAll("button[data-side]").forEach((btn) => {
      const side = normalizeEvSide(btn.dataset.side);
      const isActive = side === devEvSide;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function renderSummaryFields(opts = {}) {
    const {
      dungeonKey,
      selectedTier,
      pricing,
      runs,
      buff,
      tax,
      prices = {},
      side = "bid",
    } = opts;
    const sideLabel = evSideLabel(side);
    setRequiredText("devDungeon", dungeonKey);
    setRequiredText("devTier", selectedTier || "-");
    setRequiredText("devPricing", formatPricingModelLabel(pricing));
    setRequiredText("devRuns", String(runs));
    setRequiredText("devBuff", String(buff));
    setRequiredText("devTax", String(tax));
    setRequiredText("devSide", sideLabel);
    setRequiredText("devSideRef", sideLabel);
    setRequiredText("devEntry", `${fmt(prices.entryAsk)} / ${fmt(prices.entryBid)}`);
    setRequiredText("devChest", `${fmt(prices.chestKeyAsk)} / ${fmt(prices.chestKeyBid)}`);
    updateEvSideToggleUi();
  }

  // helper to render refined section
  function renderRefined(ev) {
    const grid = document.getElementById("devRefined");
    if (!grid) return;
    grid.innerHTML = "";
    renderGridHeader(grid);

    // Attempt to read refined fields from ev (with safe fallbacks)
    const rName = (ev && ev.refinedShardName != null) ? ev.refinedShardName
      : (ev && ev.refined && ev.refined.name != null) ? ev.refined.name
        : t("ui.refinedShards", "Refined Shards");

    let rQty = NaN;
    if (ev && ev.refinedExpectedShards != null) rQty = Number(ev.refinedExpectedShards);
    if (!Number.isFinite(rQty) && ev && ev.refined && ev.refined.expectedShards != null) rQty = Number(ev.refined.expectedShards);
    if (!Number.isFinite(rQty)) rQty = 0;

    let rUnit = NaN;
    if (ev && ev.refinedShardUnitValue != null) rUnit = Number(ev.refinedShardUnitValue);
    if (!Number.isFinite(rUnit) && ev && ev.refined && ev.refined.unitValue != null) rUnit = Number(ev.refined.unitValue);
    if (!Number.isFinite(rUnit)) rUnit = 0;

    const rViaRaw = (ev && ev.refinedValuedVia != null) ? ev.refinedValuedVia
      : (ev && ev.refined && ev.refined.via != null) ? ev.refined.via
        : "market";

    let rContrib = NaN;
    if (ev && ev.refinedChestEv != null && Number.isFinite(Number(ev.refinedChestEv))) rContrib = Number(ev.refinedChestEv);
    if (!Number.isFinite(rContrib)) rContrib = rQty * rUnit;
    if (!Number.isFinite(rContrib)) rContrib = 0;


    // Render as a 5-column row (matches headers)
    appendGridRow(grid, {
      name: rName,
      qty: fmtQty(rQty),
      unit: fmt(rUnit),
      via: formatViaLabel(rViaRaw),
      contrib: fmt(rContrib),
    });
  }

  function buildBreakdownRows(ev) {
    const agg = new Map();
    for (const r of (ev?.breakdown || [])) {
      const chance = Number(r.chance) || 0;
      const meanQty = Number(r.meanQty) || 0;
      const expectedQty = chance * meanQty;
      const key = r.hrid || r.item || "";

      if (!agg.has(key)) {
        agg.set(key, {
          item: r.item || r.hrid || "-",
          hrid: r.hrid || "",
          expectedQty: 0,
          unitValue: r.unitValue,
          valuedVia: r.valuedVia || "-",
          contrib: 0,
        });
      }

      const cur = agg.get(key);
      cur.expectedQty += expectedQty;
      cur.contrib += Number(r.contrib) || 0;

      if (cur.valuedVia !== (r.valuedVia || "-")) cur.valuedVia = "mixed";
      if (!Number.isFinite(Number(cur.unitValue))) cur.unitValue = r.unitValue;
    }

    return Array.from(agg.values())
      .sort((a, b) => (b.expectedQty - a.expectedQty) || String(a.item).localeCompare(String(b.item)));
  }

  function resolveChestEvValue(ev) {
    let chestEv = 0;
    let hasChestEv = false;
    if (ev && ev.chestEv != null && Number.isFinite(Number(ev.chestEv))) {
      chestEv = Number(ev.chestEv);
      hasChestEv = true;
    } else if (ev && ev.totalEV != null && Number.isFinite(Number(ev.totalEV))) {
      chestEv = Number(ev.totalEV);
      hasChestEv = true;
    } else if (ev && ev.ev != null && Number.isFinite(Number(ev.ev))) {
      chestEv = Number(ev.ev);
      hasChestEv = true;
    }
    return { chestEv, hasChestEv };
  }

  function readDevRefreshContext() {
    if (!window.DungeonAPI || !window.DungeonCalc || !window.DungeonChestEV?.computeDungeonChestEV) {
      throw new Error(t("ui.coreModulesNotLoaded", "Core modules not loaded"));
    }
    const selectedDungeon = window.DungeonAPI.getSelectedDungeon?.() || "";
    const zoneCompareOn = isZoneCompareOn();
    const zoneTabs = zoneCompareOn ? readAvailableDungeonTabs() : [];
    let dungeonKey = selectedDungeon;
    if (zoneTabs.length) {
      const keys = zoneTabs.map((z) => z.key);
      if (!keys.includes(devZoneDungeonKey)) {
        devZoneDungeonKey = keys.includes(selectedDungeon) ? selectedDungeon : keys[0];
      }
      dungeonKey = devZoneDungeonKey;
    } else {
      devZoneDungeonKey = "";
    }
    if (!dungeonKey) throw new Error(t("ui.noDungeonSelected", "No dungeon selected"));
    const pricing = window.DungeonAPI.getPricingModel?.() || "official";
    const runs = window.DungeonAPI.getRunsPerDay?.() || 0;
    const buff = window.DungeonAPI.getBuffTier?.() || 0;
    const tax = window.DungeonAPI.getDefaultTaxPct?.() || 0;
    const side = normalizeEvSide(devEvSide);
    const prices = window.DungeonAPI.getKeyPricesAB(dungeonKey, pricing);
    const selectedTier = window.DungeonAPI.getSelectedTier?.() || "-";
    return { dungeonKey, pricing, runs, buff, tax, side, prices, selectedTier, zoneCompareOn, zoneTabs };
  }

  async function computeDevRefreshData(ctx) {
    const { dungeonKey, pricing, runs, buff, tax, side, zoneCompareOn } = ctx;
    const marketData = window.DungeonAPI.getMarketSlim(dungeonKey, pricing);
    const baseOverrides = window.DungeonAPI.getActiveLootOverrides?.() || null;
    const zcOverrides = zoneCompareOn ? await buildZoneCompareOverrides(dungeonKey, marketData) : null;
    const priceOverrides = mergeOverrideMaps(baseOverrides, zcOverrides);
    const ev = await window.DungeonChestEV.computeDungeonChestEV({
      dungeonKey,
      marketData,
      side,
      priceOverrides
    });
    await window.DungeonCalc.computeEconomics({
      dungeonKey,
      pricing,
      side,
      runsPerDay: runs,
      buffTier: buff,
      taxPct: tax
    });
    return { ev };
  }

  function resetDevError(errEl) {
    if (!errEl) return;
    errEl.classList.add("hidden");
    errEl.textContent = "";
  }

  function showDevError(errEl, err) {
    if (!errEl) return;
    errEl.textContent = (err?.message || String(err));
    errEl.classList.remove("hidden");
  }

  function renderBreakdownGrid(ev) {
    const grid = document.getElementById("devBreakdown");
    if (!grid) return 0;
    grid.innerHTML = "";
    renderGridHeader(grid);

    const rows = buildBreakdownRows(ev);
    let sumContrib = 0;
    for (const row of rows) {
      appendGridRow(grid, {
        name: row.item || row.hrid || "-",
        qty: fmtQty(row.expectedQty),
        unit: fmt(row.unitValue),
        via: formatViaLabel(row.valuedVia || "-"),
        contrib: fmt(row.contrib),
      });
      sumContrib += Number(row.contrib) || 0;
    }
    return sumContrib;
  }

  async function refresh() {
    const errEl = document.getElementById("devError");
    resetDevError(errEl);
    try {
      const ctx = readDevRefreshContext();
      renderDungeonTabs(ctx);
      const { dungeonKey, pricing, runs, buff, tax, side, prices, selectedTier } = ctx;
      const { ev } = await computeDevRefreshData(ctx);

      renderSummaryFields({
        dungeonKey,
        selectedTier,
        pricing,
        runs,
        buff,
        tax,
        side,
        prices,
      });

      const sumContrib = renderBreakdownGrid(ev);

      // Try to read an explicit chest EV; if not available, show "-" and delta stays colored
      const { chestEv, hasChestEv } = resolveChestEvValue(ev);
      renderSums(sumContrib, hasChestEv ? chestEv : NaN);

      // Render refined section
      renderRefined(ev);

      const traceEl = document.getElementById("devTrace");
      if (traceEl) traceEl.textContent = JSON.stringify(window.DungeonCalc.lastTrace || {}, null, 2);
    } catch (err) {
      showDevError(errEl, err);
    }
  }

  function showPanel() {
    ensurePanel();
    const panel = document.getElementById("devPanel");
    if (!panel) return;
    panel.classList.remove("hidden");
    void refresh();
  }

  function handleWatermarkDevClick() {
    clicks += 1;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => { clicks = 0; }, 5000);
    if (clicks >= REQUIRED_CLICKS) { clicks = 0; showPanel(); }
  }

  function bindClickEasterEggTarget() {
    const targetEl = document.querySelector(CLICK_TARGET_SELECTOR);
    if (!targetEl) return;
    targetEl.style.pointerEvents = "auto";
    targetEl.style.cursor = "pointer";
    targetEl.addEventListener("click", handleWatermarkDevClick);
  }

  function handleDevShortcutKeydown(e) {
    if (e.shiftKey && (e.key === "D" || e.key === "d")) showPanel();
  }

  function bindDevOpenShortcuts() {
    // also allow Shift+D and ?dev=1
    document.addEventListener("keydown", handleDevShortcutKeydown);
    const usp = new URLSearchParams(location.search);
    if (usp.get("dev") === "1") {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showPanel, { once: true });
      else showPanel();
    }
  }

  function bind() {
    bindClickEasterEggTarget();
    bindDevOpenShortcuts();
    document.addEventListener("site:lang-changed", () => {
      const panel = document.getElementById("devPanel");
      if (!panel) return;
      const wasOpen = !panel.classList.contains("hidden");
      const width = panel.style.width;
      const height = panel.style.height;
      panel.remove();
      ensurePanel();
      const rebuilt = document.getElementById("devPanel");
      if (!rebuilt) return;
      if (width) rebuilt.style.width = width;
      if (height) rebuilt.style.height = height;
      if (wasOpen) {
        rebuilt.classList.remove("hidden");
        void refresh();
      }
    });
  }

  // listen to calc errors and surface a toast
  document.addEventListener("dungeon:error", (evt) => {
    const err = evt?.detail;
    console.warn("[Dungeon Error]", err);
    const banner = document.getElementById("calcErrorBanner");
    if (banner) {
      banner.textContent = err?.message || t("ui.anErrorOccurredCalculation", "An error occurred in calculation");
      banner.classList.remove("hidden");
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind, { once: true });
  } else {
    bind();
  }
})();


