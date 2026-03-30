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
  let devApiDiffFilter = "different";
  let devApiCompareOpen = true;
  let devChestBreakdownOpen = true;
  let devRefreshTimer = 0;
  let devPersonalLootStatusText = "";
  let devPersonalLootStatusIsError = false;
  const ZC_STORAGE = {
    lowDrop: "dungeon.zoneCompare.removeLowDrops.v3",
    legacyManualLoot: "dungeon.zoneCompare.manualLoot.v1",
    legacyManualOverrides: "dungeon.zoneCompare.manualOverrides.v1",
    mirrorBackslot: "dungeon.zoneCompare.mirrorBackslot.v1",
  };
  const SHARED_LOOT_OVERRIDE_ENABLED_KEY = "dungeon.lootOverrideEnabled";
  const SHARED_LOOT_PRICE_OVERRIDES_KEY = "dungeon.lootPriceOverrides";
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

  function getInitDataShared() {
    return getShared("DungeonInitDataShared");
  }

  function getMetaShared() {
    return getShared("DungeonMetaShared");
  }

  function getPersonalLootImportShared() {
    return getShared("DungeonPersonalLootImportShared");
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

  function normalizeApiSource(source) {
    const normalize = getPricingStateShared()?.normalizeApiSource;
    if (typeof normalize === "function") return normalize(source);
    return source === "other" ? "other" : "official";
  }

  function apiSourceLabel(source) {
    return normalizeApiSource(source) === "other"
      ? t("ui.mooket", "Mooket")
      : t("ui.official", "Official");
  }

  function normalizeApiDiffFilter(filter) {
    return filter === "all" ? "all" : "different";
  }

  function formatPricingModelLabel(model, activeApiSource = "official") {
    const shared = getPricingStateShared();
    if (shared && typeof shared.pricingModelLabel === "function") {
      return shared.pricingModelLabel(model, { activeApiSource: normalizeApiSource(activeApiSource) });
    }
    if (model === "manual") {
      return normalizeApiSource(activeApiSource) === "other"
        ? t("ui.manualPlusMooket", "Manual + Mooket")
        : t("ui.manualPlusOfficial", "Manual + Official");
    }
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
      #devPanel .dev-compare-meta{
        margin:6px 0 10px;
        color:var(--muted-color,#9ca3af);
        font-size:12px;
      }
      #devPanel .dev-section-head{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        margin-bottom:6px;
      }
      #devPanel .dev-section-head.is-collapsed{
        margin-bottom:0;
      }
      #devPanel .dev-section-title{
        display:flex;
        align-items:center;
        gap:8px;
        flex-wrap:wrap;
      }
      #devPanel .dev-section-toggle{
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.05);
        color:inherit;
        border-radius:999px;
        width:28px;
        height:28px;
        font-size:14px;
        cursor:pointer;
        flex:0 0 auto;
      }
      #devPanel .dev-compare-grid{
        display:grid;
        grid-template-columns:minmax(170px,1.8fr) minmax(110px,1fr) minmax(110px,1fr);
        gap:6px 10px;
        align-items:center;
      }
      #devPanel .dev-compare-cell{
        min-width:0;
        font-size:12px;
      }
      #devPanel .dev-compare-name{
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      #devPanel .dev-compare-row.is-different,
      #devPanel .dev-compare-delta{
        font-weight:700;
      }
      #devPanel .dev-compare-delta.pos{
        color:#34d399;
      }
      #devPanel .dev-compare-delta.neg{
        color:#f87171;
      }
      #devPanel .dev-compare-delta.neutral{
        color:var(--muted-color,#9ca3af);
      }
      #devPanel .dev-compare-empty{
        grid-column:1 / -1;
        color:var(--muted-color,#9ca3af);
        font-size:12px;
        padding:6px 0 2px;
      }
      #devPanel .dev-import-summary,
      #devPanel .dev-import-status{
        color:var(--muted-color,#9ca3af);
        font-size:12px;
        line-height:1.5;
        white-space:pre-wrap;
      }
      #devPanel .dev-import-textarea{
        width:100%;
        min-height:132px;
        resize:vertical;
        border:1px solid rgba(255,255,255,.16);
        background:rgba(255,255,255,.05);
        color:inherit;
        border-radius:10px;
        padding:10px 12px;
        font:12px/1.45 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
      }
      #devPanel .dev-import-textarea::placeholder{
        color:rgba(255,255,255,.42);
      }
      #devPanel .dev-import-status{
        min-height:18px;
      }
      #devPanel .dev-import-status.is-error{
        color:#fca5a5;
      }
      #devPanel .dev-actions{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
      }
      #devPanel .dev-btn{
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.06);
        color:inherit;
        border-radius:10px;
        padding:8px 12px;
        font-size:12px;
        cursor:pointer;
      }
      #devPanel .dev-btn:hover{
        background:rgba(255,255,255,.1);
      }
      #devPanel .dev-btn.dev-btn-danger{
        border-color:rgba(248,113,113,.35);
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
          <div><label>${t("ui.activeApi", "Active API")}:</label> <span id="devActiveApi">-</span></div>
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
          <div id="devApiCompareHead" class="dev-section-head">
            <div class="dev-section-title">
              <div id="devApiDiffToggle" class="dev-side-toggle" role="group" aria-label="${t("ui.apiCompareFilter", "API compare filter")}">
                <button type="button" class="dev-side-btn${devApiDiffFilter === "different" ? " is-active" : ""}" data-diff-filter="different" aria-pressed="${devApiDiffFilter === "different" ? "true" : "false"}">${t("ui.differentOnly", "Different only")}</button>
                <button type="button" class="dev-side-btn${devApiDiffFilter === "all" ? " is-active" : ""}" data-diff-filter="all" aria-pressed="${devApiDiffFilter === "all" ? "true" : "false"}">${t("ui.allItems", "All items")}</button>
              </div>
              <h4>${t("ui.apiPriceCompare", "API price compare")}</h4>
            </div>
            <button id="devApiCompareCollapseBtn" class="dev-section-toggle" type="button" aria-expanded="${devApiCompareOpen ? "true" : "false"}" aria-label="${t("ui.toggleSection", "Toggle section")}">${devApiCompareOpen ? "−" : "+"}</button>
          </div>
          <div id="devApiCompareBody"${devApiCompareOpen ? "" : ' hidden'}>
            <div id="devApiCompareMeta" class="dev-compare-meta">-</div>
            <div id="devApiCompare" class="dev-compare-grid"></div>
          </div>
        </div>

        <div class="dev-section">
          <div id="devChestBreakdownHead" class="dev-section-head">
            <div class="dev-section-title">
              <div id="devEvSideToggle" class="dev-side-toggle" role="group" aria-label="${t("ui.price", "Price")}">
                <button type="button" class="dev-side-btn${devEvSide === "bid" ? " is-active" : ""}" data-side="bid" aria-pressed="${devEvSide === "bid" ? "true" : "false"}">${t("ui.bid", "bid")}</button>
                <button type="button" class="dev-side-btn${devEvSide === "ask" ? " is-active" : ""}" data-side="ask" aria-pressed="${devEvSide === "ask" ? "true" : "false"}">${t("ui.ask", "ask")}</button>
              </div>
              <h4>${t("ui.chestEvBreakdownTitle", "Chest EV breakdown")} <span id="devSide">${sideLabel}</span></h4>
            </div>
            <button id="devChestBreakdownCollapseBtn" class="dev-section-toggle" type="button" aria-expanded="${devChestBreakdownOpen ? "true" : "false"}" aria-label="${t("ui.toggleSection", "Toggle section")}">${devChestBreakdownOpen ? "−" : "+"}</button>
          </div>
          <div id="devChestBreakdownBody"${devChestBreakdownOpen ? "" : ' hidden'}>
            <div id="devBreakdown" class="dev-grid"></div>
            <div class="dev-row" id="devSumRow">
              <div><label>${t("ui.sumContrib", "Σ contrib:")}</label> <span id="devSumContrib">-</span></div>
              <div><label>${t("ui.chestEv", "Chest EV:")}</label> <span id="devChestEv">-</span></div>
              <div><label>${t("ui.deltaSumEv", "Δ (sum - EV):")}</label> <span id="devDelta">-</span></div>
            </div>
          </div>
        </div>

        <div class="dev-section">
          <h4>${t("ui.refinedChestEvBreakdownTitle", "Refined Chest EV breakdown")} <span id="devSideRef">${sideLabel}</span></h4>
          <div id="devRefined" class="dev-grid"></div>
        </div>

        <div class="dev-section">
          <h4>${t("ui.trace", "Trace")}</h4>
          <pre id="devTrace" class="dev-pre"></pre>
        </div>
        <div class="dev-section">
          <h4>${t("ui.personalChestLootImport", "Personal chest loot import")}</h4>
          <div id="devPersonalLootSummary" class="dev-import-summary">${t("ui.loading", "Loading...")}</div>
          <textarea
            id="devPersonalLootPaste"
            class="dev-import-textarea"
            rows="8"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            placeholder="${t("ui.personalLootPastePlaceholder", "Paste the 360Dungeon chest export JSON here, then click Import pasted JSON.")}"
            aria-label="${t("ui.personalLootPasteLabel", "Paste personal chest loot export JSON")}"></textarea>
          <div id="devPersonalLootStatus" class="dev-import-status" aria-live="polite"></div>
        </div>
        <div class="dev-actions">
          <button id="devPersonalLootImportBtn" class="dev-btn">${t("ui.importPastedJson", "Import pasted JSON")}</button>
          <button id="devPersonalLootResetBtn" class="dev-btn dev-btn-danger">${t("ui.clearImport", "Clear import")}</button>
          <button id="devRefresh" class="dev-btn">${t("ui.refresh", "Refresh")}</button>
        </div>
      </div>
      <div class="dev-resize-handle" aria-hidden="true"></div>`;
    document.body.appendChild(panel);
    const closeBtn = panel.querySelector(".dev-close");
    if (closeBtn) closeBtn.addEventListener("click", () => panel.classList.add("hidden"));
    const refreshBtn = document.getElementById("devRefresh");
    if (refreshBtn) refreshBtn.addEventListener("click", () => void refresh());
    const importBtn = document.getElementById("devPersonalLootImportBtn");
    if (importBtn) importBtn.addEventListener("click", () => void handlePersonalLootImport());
    const resetBtn = document.getElementById("devPersonalLootResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", () => handlePersonalLootReset());
    const pasteEl = document.getElementById("devPersonalLootPaste");
    if (pasteEl) {
      pasteEl.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          void handlePersonalLootImport();
        }
      });
    }
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
    const apiDiffToggle = document.getElementById("devApiDiffToggle");
    if (apiDiffToggle) {
      apiDiffToggle.addEventListener("click", (e) => {
        const btn = e.target?.closest?.("button[data-diff-filter]");
        if (!btn) return;
        const next = normalizeApiDiffFilter(btn.dataset.diffFilter);
        if (next === devApiDiffFilter) return;
        devApiDiffFilter = next;
        updateApiDiffToggleUi();
        void refresh();
      });
    }
    const apiCompareCollapseBtn = document.getElementById("devApiCompareCollapseBtn");
    if (apiCompareCollapseBtn) {
      apiCompareCollapseBtn.addEventListener("click", () => {
        devApiCompareOpen = !devApiCompareOpen;
        updateApiCompareCollapseUi();
      });
    }
    const chestBreakdownCollapseBtn = document.getElementById("devChestBreakdownCollapseBtn");
    if (chestBreakdownCollapseBtn) {
      chestBreakdownCollapseBtn.addEventListener("click", () => {
        devChestBreakdownOpen = !devChestBreakdownOpen;
        updateChestBreakdownCollapseUi();
      });
    }
    bindResize(panel);
    renderPersonalLootImportSummary({});
    setPersonalLootStatus(devPersonalLootStatusText, devPersonalLootStatusIsError);
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

  function normalizeLootOverrideEntry(raw) {
    const numeric = typeof raw === "number"
      ? (Number.isFinite(raw) && raw >= 0 ? raw : NaN)
      : (typeof raw === "string" && String(raw).trim() !== "" ? Number(raw) : NaN);
    if (Number.isFinite(numeric) && numeric >= 0) return Math.round(numeric);
    if (!raw || typeof raw !== "object") return null;
    const mode = String(raw.mode || "").trim().toLowerCase();
    const price = typeof raw.price === "number"
      ? (Number.isFinite(raw.price) ? raw.price : NaN)
      : (typeof raw.price === "string" && String(raw.price).trim() !== "" ? Number(raw.price) : NaN);
    if (mode === "bid") return Number.isFinite(price) && price > 0 ? { mode: "Bid", price: Math.round(price) } : { mode: "Bid" };
    if (mode === "ask") return Number.isFinite(price) && price > 0 ? { mode: "Ask", price: Math.round(price) } : { mode: "Ask" };
    if (mode === "custom") {
      if (Number.isFinite(price) && price >= 0) return { mode: "Custom", price: Math.round(price) };
    }
    return null;
  }

  function normalizeLootOverrideMap(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const [hrid, value] of Object.entries(raw)) {
      const key = String(hrid || "").trim();
      if (!key) continue;
      const normalized = normalizeLootOverrideEntry(value);
      if (normalized != null) out[key] = normalized;
    }
    return out;
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
    const sharedEnabledRaw = storageGetItem(SHARED_LOOT_OVERRIDE_ENABLED_KEY);
    const sharedOverridesRawText = storageGetItem(SHARED_LOOT_PRICE_OVERRIDES_KEY);
    const hasSharedState = sharedEnabledRaw != null || (sharedOverridesRawText != null && String(sharedOverridesRawText).trim() !== "");
    const rawOverrides = hasSharedState
      ? parseJson(sharedOverridesRawText, {})
      : parseJson(storageGetItem(ZC_STORAGE.legacyManualOverrides), {});
    const manualOverrides = normalizeLootOverrideMap(rawOverrides);
    return {
      lowDrop: storageGetItem(ZC_STORAGE.lowDrop) === "1",
      manualLoot: hasSharedState
        ? sharedEnabledRaw === "1"
        : storageGetItem(ZC_STORAGE.legacyManualLoot) === "1",
      mirrorBackslot: storageGetItem(ZC_STORAGE.mirrorBackslot) === "1",
      manualOverrides,
    };
  }

  function formatStamp(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const stamp = new Date(text);
    return Number.isFinite(stamp.getTime()) ? stamp.toLocaleString() : text;
  }

  function readPersonalLootStatusSummary() {
    const shared = getPersonalLootImportShared();
    if (!shared || typeof shared.getStatusSummary !== "function") return null;
    try {
      return shared.getStatusSummary();
    } catch (_) {
      return null;
    }
  }

  function readPersonalOpenableProfile(openableHrid) {
    if (!openableHrid) return null;
    const shared = getPersonalLootImportShared();
    if (!shared || typeof shared.getOpenableProfile !== "function") return null;
    try {
      return shared.getOpenableProfile(openableHrid);
    } catch (_) {
      return null;
    }
  }

  function describePersonalCoverage(openableHrid, fallbackLabel = "") {
    const profile = readPersonalOpenableProfile(openableHrid);
    const label = String(profile?.chestName || fallbackLabel || fallbackItemName(openableHrid) || openableHrid || "-");
    if (profile?.rows?.length) {
      return `${label}: personal (${fmt(profile.opens)} opens)`;
    }
    return `${label}: theoretical`;
  }

  function setPersonalLootStatus(message, isError = false) {
    devPersonalLootStatusText = String(message || "");
    devPersonalLootStatusIsError = !!isError;
    const el = document.getElementById("devPersonalLootStatus");
    if (!el) return;
    el.textContent = devPersonalLootStatusText;
    el.classList.toggle("is-error", devPersonalLootStatusIsError);
  }

  function renderPersonalLootImportSummary(ctx = {}) {
    const summaryEl = document.getElementById("devPersonalLootSummary");
    if (!summaryEl) return;
    const summary = readPersonalLootStatusSummary();
    if (!summary) {
      summaryEl.textContent = "Personal chest import module is not loaded.";
      if (!devPersonalLootStatusText) setPersonalLootStatus("Personal chest import module is not loaded.", true);
      return;
    }

    const lines = [];
    if (!summary.active) {
      lines.push("No personal chest loot import is active.");
      lines.push("Paste a 360Dungeon chest export to override chest EV with observed averages.");
      if (!devPersonalLootStatusText) setPersonalLootStatus("Paste a 360Dungeon chest export JSON, then click Import pasted JSON.");
    } else {
      const playerName = String(summary.playerName || "").trim();
      const playerId = String(summary.playerId || "").trim();
      const playerLabel = playerName || playerId || "Unknown player";
      const showPlayerId = playerId && playerId !== playerLabel;
      lines.push(`Active player: ${playerLabel}${showPlayerId ? ` (${playerId})` : ""}`);
      lines.push(`Mapped chests: ${fmt(summary.chestCount)} | Tracked opens: ${fmt(summary.totalTrackedOpens)}`);

      const coverage = [];
      const shortKey = toShortDungeonKey(ctx?.dungeonKey || "");
      const set = CHESTS[shortKey] || null;
      if (set?.chest) coverage.push(describePersonalCoverage(set.chest, "Dungeon chest"));
      if (set?.refined) coverage.push(describePersonalCoverage(set.refined, "Refined chest"));
      coverage.push(describePersonalCoverage(LARGE_CHEST_HRID, "Large Treasure Chest"));
      lines.push(`Current coverage: ${coverage.join(" | ")}`);

      const importedAt = formatStamp(summary.importedAt);
      if (importedAt) lines.push(`Imported: ${importedAt}`);
      const exportedAt = formatStamp(summary.sourceExportedAt);
      if (exportedAt) lines.push(`Source export: ${exportedAt}`);
      if (summary.unmappedChestCount || summary.unmappedItemCount) {
        lines.push(`Skipped while mapping: ${fmt(summary.unmappedChestCount)} chest names | ${fmt(summary.unmappedItemCount)} item names`);
      }
      if (!devPersonalLootStatusText) setPersonalLootStatus("Personal chest loot import is active.");
    }

    summaryEl.textContent = lines.join("\n");
  }

  async function handlePersonalLootImport() {
    const shared = getPersonalLootImportShared();
    if (!shared || typeof shared.importFromText !== "function") {
      setPersonalLootStatus("Personal chest import module is not loaded.", true);
      return;
    }
    const pasteEl = document.getElementById("devPersonalLootPaste");
    const rawText = String(pasteEl?.value || "").trim();
    if (!rawText) {
      setPersonalLootStatus("Paste a 360Dungeon chest export JSON first.", true);
      pasteEl?.focus();
      return;
    }

    setPersonalLootStatus("Importing personal chest loot...");
    try {
      const stored = await shared.importFromText(rawText);
      const summary = typeof shared.getStatusSummary === "function" ? shared.getStatusSummary(stored) : null;
      const playerLabel = String(summary?.playerName || summary?.playerId || stored?.selectedPlayerName || stored?.selectedPlayerId || "player");
      const chestCount = Number(summary?.chestCount ?? stored?.summary?.chestCount) || 0;
      setPersonalLootStatus(`Imported ${fmt(chestCount)} chests for ${playerLabel}.`);
      renderPersonalLootImportSummary({});
      scheduleRefreshIfPanelOpen(0);
    } catch (err) {
      setPersonalLootStatus(err?.message || String(err), true);
      renderPersonalLootImportSummary({});
    }
  }

  function handlePersonalLootReset() {
    const shared = getPersonalLootImportShared();
    if (!shared || typeof shared.clearImport !== "function") {
      setPersonalLootStatus("Personal chest import module is not loaded.", true);
      return;
    }
    try {
      shared.clearImport();
      setPersonalLootStatus("Personal chest loot import cleared.");
      renderPersonalLootImportSummary({});
      scheduleRefreshIfPanelOpen(0);
    } catch (err) {
      setPersonalLootStatus(err?.message || String(err), true);
    }
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

    if (zc.manualLoot) out = mergeOverrideMaps(out, zc.manualOverrides || {}) || {};

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

  function updateApiDiffToggleUi() {
    const host = document.getElementById("devApiDiffToggle");
    if (!host) return;
    host.querySelectorAll("button[data-diff-filter]").forEach((btn) => {
      const filter = normalizeApiDiffFilter(btn.dataset.diffFilter);
      const isActive = filter === devApiDiffFilter;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function updateApiCompareCollapseUi() {
    const body = document.getElementById("devApiCompareBody");
    const btn = document.getElementById("devApiCompareCollapseBtn");
    const head = document.getElementById("devApiCompareHead");
    if (body) body.hidden = !devApiCompareOpen;
    if (btn) {
      btn.textContent = devApiCompareOpen ? "−" : "+";
      btn.setAttribute("aria-expanded", devApiCompareOpen ? "true" : "false");
    }
    if (head) head.classList.toggle("is-collapsed", !devApiCompareOpen);
  }

  function updateChestBreakdownCollapseUi() {
    const body = document.getElementById("devChestBreakdownBody");
    const btn = document.getElementById("devChestBreakdownCollapseBtn");
    const head = document.getElementById("devChestBreakdownHead");
    if (body) body.hidden = !devChestBreakdownOpen;
    if (btn) {
      btn.textContent = devChestBreakdownOpen ? "−" : "+";
      btn.setAttribute("aria-expanded", devChestBreakdownOpen ? "true" : "false");
    }
    if (head) head.classList.toggle("is-collapsed", !devChestBreakdownOpen);
  }

  function scheduleRefreshIfPanelOpen(delayMs = 60) {
    if (devRefreshTimer) window.clearTimeout(devRefreshTimer);
    devRefreshTimer = window.setTimeout(() => {
      devRefreshTimer = 0;
      const panel = document.getElementById("devPanel");
      if (!panel || panel.classList.contains("hidden")) return;
      void refresh();
    }, Math.max(0, Number(delayMs) || 0));
  }

  async function getInitData() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      const data = await shared.getInitData();
      if (data) return data;
    }
    return window.InitCharacterData || null;
  }

  function fallbackItemName(hrid) {
    const text = String(hrid || "");
    const id = text.split("/").pop() || text;
    return id
      .split("_")
      .map((part) => part ? (part[0].toUpperCase() + part.slice(1)) : "")
      .join(" ");
  }

  function normalizeComparablePrice(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function appendCompareCell(grid, text, className, title = "") {
    const cell = document.createElement("div");
    cell.className = className;
    cell.textContent = text;
    if (title) cell.title = String(title);
    grid.appendChild(cell);
  }

  function getAllDungeonKeys(fallbackDungeonKey = "") {
    const keys = readAvailableDungeonTabs()
      .map((tab) => String(tab?.key || "").trim())
      .filter(Boolean);
    if (!keys.length) {
      const fallback = String(fallbackDungeonKey || "").trim();
      return fallback ? [fallback] : [];
    }
    return Array.from(new Set(keys));
  }

  async function collectRelevantHridsAcrossDungeons(dungeonKeys, getter) {
    const hrids = new Set();
    const keys = Array.isArray(dungeonKeys) ? dungeonKeys : [];
    await Promise.all(keys.map(async (key) => {
      const list = await getter(key);
      (Array.isArray(list) ? list : []).forEach((hrid) => {
        const text = String(hrid || "").trim();
        if (text) hrids.add(text);
      });
    }));
    return Array.from(hrids);
  }

  async function getMergedMarketSlimForDungeons(api, dungeonKeys, source) {
    const merged = {};
    const missing = [];
    const keys = Array.isArray(dungeonKeys) ? dungeonKeys : [];

    keys.forEach((key) => {
      const market = api.getMarketSlim?.(key, source) || null;
      if (market && typeof market === "object") {
        Object.assign(merged, market);
      } else {
        missing.push(key);
      }
    });

    if (missing.length && typeof api.refreshPricesForDungeon === "function") {
      await Promise.all(
        missing.map((key) =>
          api.refreshPricesForDungeon(key, source, { silent: true, reason: "devtools" }).catch(() => null)
        )
      );
      missing.forEach((key) => {
        const market = api.getMarketSlim?.(key, source) || null;
        if (market && typeof market === "object") Object.assign(merged, market);
      });
    }

    return Object.keys(merged).length ? merged : null;
  }

  async function getActiveCalculatorPricingContext(dungeonKey) {
    const hrids = new Set();
    let source = "default";
    let label = t("ui.relevantItems", "relevant items");
    let dungeonKeys = [];

    if (document.getElementById("keysToggle")?.checked && typeof window.KeysInline?.getRelevantPricingHrids === "function") {
      source = "keys";
      label = t("ui.keysPricingItems", "key pricing items");
      dungeonKeys = getAllDungeonKeys(dungeonKey);
      const list = await collectRelevantHridsAcrossDungeons(
        dungeonKeys,
        (key) => window.KeysInline.getRelevantPricingHrids(key)
      );
      list.forEach((hrid) => hrids.add(hrid));
      return { source, label, hrids: Array.from(hrids), dungeonKeys };
    }

    if (document.getElementById("tokenShopToggle")?.checked && typeof window.TokenShopInline?.getRelevantPricingHrids === "function") {
      source = "token_shop";
      label = t("ui.tokenShopPricingItems", "token shop pricing items");
      dungeonKeys = getAllDungeonKeys(dungeonKey);
      const list = await collectRelevantHridsAcrossDungeons(
        dungeonKeys,
        (key) => window.TokenShopInline.getRelevantPricingHrids(key)
      );
      list.forEach((hrid) => hrids.add(hrid));
      return { source, label, hrids: Array.from(hrids), dungeonKeys };
    }

    if (document.getElementById("zoneCompareToggle")?.checked && typeof window.ZoneCompareInline?.getRelevantPricingHrids === "function") {
      source = "zone_compare";
      label = t("ui.zoneComparePricingItems", "zone compare chest items");
      dungeonKeys = getAllDungeonKeys(dungeonKey);
      const list = await window.ZoneCompareInline.getRelevantPricingHrids(dungeonKey);
      (Array.isArray(list) ? list : []).forEach((hrid) => {
        const text = String(hrid || "").trim();
        if (text) hrids.add(text);
      });
      return { source, label, hrids: Array.from(hrids), dungeonKeys };
    }

    dungeonKeys = getAllDungeonKeys(dungeonKey);
    return { source, label, hrids: [], dungeonKeys };
  }

  function formatDelta(delta) {
    if (!Number.isFinite(delta)) return "—";
    if (delta === 0) return "0";
    const sign = delta > 0 ? "+" : "−";
    return `${sign}${fmt(Math.abs(delta))}`;
  }

  function deltaClass(delta) {
    if (!Number.isFinite(delta) || delta === 0) return "neutral";
    return delta > 0 ? "pos" : "neg";
  }

  async function buildApiCompareData(dungeonKey, activeApiSource = "official") {
    const api = window.DungeonAPI || {};
    const activeContext = await getActiveCalculatorPricingContext(dungeonKey);
    const compareDungeonKeys = Array.isArray(activeContext.dungeonKeys) && activeContext.dungeonKeys.length
      ? activeContext.dungeonKeys
      : getAllDungeonKeys(dungeonKey);
    const leftSource = normalizeApiSource(activeApiSource) === "other" ? "other" : "official";
    const rightSource = leftSource === "other" ? "official" : "other";
    const officialMarket = await getMergedMarketSlimForDungeons(api, compareDungeonKeys, "official");
    const otherMarket = await getMergedMarketSlimForDungeons(api, compareDungeonKeys, "other");
    const hrids = new Set(activeContext.hrids || []);
    if (!hrids.size) {
      const relevantHrids = (typeof window.DungeonChestEV.getEvRelevantHrids === "function")
        ? await window.DungeonChestEV.getEvRelevantHrids(dungeonKey, officialMarket || otherMarket || {})
        : [];
      (relevantHrids || []).forEach((hrid) => hrids.add(hrid));
      const keyHrids = getMetaShared()?.marketHridsForUiKey?.(dungeonKey) || null;
      if (keyHrids?.entry) hrids.add(keyHrids.entry);
      if (keyHrids?.chestKey) hrids.add(keyHrids.chestKey);
    }

    const init = await getInitData();
    const itemMap = init?.itemDetailMap || init?.itemMap || init?.items || {};
    const allRows = Array.from(hrids).map((hrid) => {
      const official = extractAskBid(officialMarket, hrid);
      const other = extractAskBid(otherMarket, hrid);
      const left = leftSource === "other" ? other : official;
      const right = rightSource === "other" ? other : official;
      const leftBid = normalizeComparablePrice(left?.bid);
      const rightBid = normalizeComparablePrice(right?.bid);
      const leftAsk = normalizeComparablePrice(left?.ask);
      const rightAsk = normalizeComparablePrice(right?.ask);
      const bidDelta = (leftBid !== null && rightBid !== null) ? (leftBid - rightBid) : NaN;
      const askDelta = (leftAsk !== null && rightAsk !== null) ? (leftAsk - rightAsk) : NaN;
      return {
        hrid,
        name: itemMap?.[hrid]?.name || fallbackItemName(hrid),
        bidDelta,
        askDelta,
        different: (Number.isFinite(bidDelta) && bidDelta !== 0) || (Number.isFinite(askDelta) && askDelta !== 0),
        official,
        other,
      };
    }).sort((a, b) => {
      if (a.different !== b.different) return a.different ? -1 : 1;
      const deltaDiff = Math.max(Math.abs(Number(b.bidDelta) || 0), Math.abs(Number(b.askDelta) || 0))
        - Math.max(Math.abs(Number(a.bidDelta) || 0), Math.abs(Number(a.askDelta) || 0));
      if (deltaDiff !== 0) return deltaDiff;
      return String(a.name).localeCompare(String(b.name));
    });

    const rows = devApiDiffFilter === "all" ? allRows : allRows.filter((row) => row.different);
    return {
      rows,
      totalCount: allRows.length,
      shownCount: rows.length,
      filter: devApiDiffFilter,
      sourceLabel: hrids.size && activeContext.hrids?.length ? activeContext.label : t("ui.relevantItems", "relevant items"),
      deltaLeftSource: leftSource,
      deltaRightSource: rightSource,
      deltaLeftLabel: apiSourceLabel(leftSource),
      deltaRightLabel: apiSourceLabel(rightSource),
      officialReady: !!officialMarket,
      otherReady: !!otherMarket,
    };
  }

  function buildApiCompareCellTitle(row, side, data = {}) {
    const leftSource = data.deltaLeftSource === "official" ? "official" : "other";
    const rightSource = data.deltaRightSource === "other" ? "other" : "official";
    const leftLabel = String(data.deltaLeftLabel || apiSourceLabel(leftSource));
    const rightLabel = String(data.deltaRightLabel || apiSourceLabel(rightSource));
    const sideLabel = side === "ask" ? t("ui.ask", "ask") : t("ui.bid", "bid");
    const leftQuote = leftSource === "other" ? row?.other : row?.official;
    const rightQuote = rightSource === "other" ? row?.other : row?.official;
    const leftValue = side === "ask" ? leftQuote?.ask : leftQuote?.bid;
    const rightValue = side === "ask" ? rightQuote?.ask : rightQuote?.bid;
    const delta = side === "ask" ? row?.askDelta : row?.bidDelta;
    return tf(
      "ui.apiCompareCellTitle",
      "{left} {side}: {leftValue} | {right} {side}: {rightValue} | Delta: {delta}",
      {
        left: leftLabel,
        right: rightLabel,
        side: sideLabel,
        leftValue: fmt(leftValue),
        rightValue: fmt(rightValue),
        delta: formatDelta(delta),
      }
    );
  }

  function renderApiCompare(data = {}) {
    const grid = document.getElementById("devApiCompare");
    const meta = document.getElementById("devApiCompareMeta");
    if (!grid || !meta) return;

    grid.innerHTML = "";
    const showingText = tf(
      "ui.apiCompareShowing",
      "Showing {shown} of {total} {label}",
      {
        shown: String(data.shownCount ?? 0),
        total: String(data.totalCount ?? 0),
        label: String(data.sourceLabel || t("ui.relevantItems", "relevant items")),
      }
    );
    const compareFormulaText = tf(
      "ui.apiCompareFormula",
      "Delta = {left} - {right}",
      {
        left: String(data.deltaLeftLabel || apiSourceLabel("other")),
        right: String(data.deltaRightLabel || apiSourceLabel("official")),
      }
    );
    const positiveMeansText = tf(
      "ui.apiComparePositiveMeans",
      "positive means {left} is higher",
      {
        left: String(data.deltaLeftLabel || apiSourceLabel("other")),
      }
    );
    meta.textContent = `${showingText} • ${compareFormulaText} • ${positiveMeansText}`;
    if (!data.officialReady || !data.otherReady) {
      meta.textContent += ` • ${t("ui.apiCompareMissingSource", "Missing one saved API snapshot")}`;
    }

    [
      t("ui.items", "Item"),
      tf("ui.bidDelta", "Bid Δ"),
      tf("ui.askDelta", "Ask Δ"),
    ].forEach((header) => {
      const el = document.createElement("div");
      el.className = "dev-th";
      el.textContent = header;
      grid.appendChild(el);
    });

    if (!Array.isArray(data.rows) || !data.rows.length) {
      const empty = document.createElement("div");
      empty.className = "dev-compare-empty";
      empty.textContent = data.filter === "all"
        ? t("ui.noRelevantItems", "No relevant items found.")
        : t("ui.noApiDiffs", "No informative API price differences found for this dungeon.");
      grid.appendChild(empty);
      return;
    }

    data.rows.forEach((row) => {
      const rowClass = row.different ? " dev-compare-row is-different" : " dev-compare-row";
      appendCompareCell(grid, row.name, `dev-compare-cell dev-compare-name${rowClass}`, row.hrid || row.name);
      appendCompareCell(
        grid,
        formatDelta(row.bidDelta),
        `dev-compare-cell dev-compare-delta ${deltaClass(row.bidDelta)}${rowClass}`,
        buildApiCompareCellTitle(row, "bid", data)
      );
      appendCompareCell(
        grid,
        formatDelta(row.askDelta),
        `dev-compare-cell dev-compare-delta ${deltaClass(row.askDelta)}${rowClass}`,
        buildApiCompareCellTitle(row, "ask", data)
      );
    });
  }

  function renderSummaryFields(opts = {}) {
    const {
      dungeonKey,
      selectedTier,
      pricing,
      activeApiSource,
      runs,
      buff,
      tax,
      prices = {},
      side = "bid",
    } = opts;
    const sideLabel = evSideLabel(side);
    setRequiredText("devDungeon", dungeonKey);
    setRequiredText("devTier", selectedTier || "-");
    setRequiredText("devPricing", formatPricingModelLabel(pricing, activeApiSource));
    setRequiredText("devActiveApi", apiSourceLabel(activeApiSource));
    setRequiredText("devRuns", String(runs));
    setRequiredText("devBuff", String(buff));
    setRequiredText("devTax", String(tax));
    setRequiredText("devSide", sideLabel);
    setRequiredText("devSideRef", sideLabel);
    setRequiredText("devEntry", `${fmt(prices.entryAsk)} / ${fmt(prices.entryBid)}`);
    setRequiredText("devChest", `${fmt(prices.chestKeyAsk)} / ${fmt(prices.chestKeyBid)}`);
    updateEvSideToggleUi();
    updateApiDiffToggleUi();
    updateApiCompareCollapseUi();
    updateChestBreakdownCollapseUi();
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
      const explicitExpectedQty = Number(r.expectedQty);
      const expectedQty = Number.isFinite(explicitExpectedQty) ? explicitExpectedQty : (chance * meanQty);
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
    const activeApiSource = normalizeApiSource(window.DungeonAPI.getActiveApiSource?.() || (pricing === "other" ? "other" : "official"));
    const runs = window.DungeonAPI.getRunsPerDay?.() || 0;
    const buff = window.DungeonAPI.getBuffTier?.() || 0;
    const tax = window.DungeonAPI.getDefaultTaxPct?.() || 0;
    const side = normalizeEvSide(devEvSide);
    const prices = window.DungeonAPI.getKeyPricesAB(dungeonKey, pricing);
    const selectedTier = window.DungeonAPI.getSelectedTier?.() || "-";
    return { dungeonKey, pricing, activeApiSource, runs, buff, tax, side, prices, selectedTier, zoneCompareOn, zoneTabs };
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
    renderPersonalLootImportSummary({});
    try {
      const ctx = readDevRefreshContext();
      renderDungeonTabs(ctx);
      const { dungeonKey, pricing, activeApiSource, runs, buff, tax, side, prices, selectedTier } = ctx;
      const [{ ev }, apiCompare] = await Promise.all([
        computeDevRefreshData(ctx),
        buildApiCompareData(dungeonKey, activeApiSource),
      ]);

      renderSummaryFields({
        dungeonKey,
        selectedTier,
        pricing,
        activeApiSource,
        runs,
        buff,
        tax,
        side,
        prices,
      });
      renderPersonalLootImportSummary(ctx);
      renderApiCompare(apiCompare);

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
    document.addEventListener("dungeon:pricing-context-changed", () => {
      scheduleRefreshIfPanelOpen(80);
    });
    document.addEventListener("dungeon:selection-changed", () => {
      scheduleRefreshIfPanelOpen(40);
    });
    document.addEventListener("dungeon:prices-refreshed", () => {
      scheduleRefreshIfPanelOpen(120);
    });
    document.addEventListener("keys:planner-changed", () => {
      scheduleRefreshIfPanelOpen(40);
    });
    document.addEventListener("token-shop:selection-changed", () => {
      scheduleRefreshIfPanelOpen(40);
    });
    document.addEventListener("zone-compare:rendered", () => {
      scheduleRefreshIfPanelOpen(80);
    });
    document.addEventListener("dungeon:loot-overrides-changed", () => {
      scheduleRefreshIfPanelOpen(60);
    });
    document.addEventListener("dungeon:personal-loot-import-changed", () => {
      scheduleRefreshIfPanelOpen(40);
    });
    ["advMode", "keysToggle", "tokenShopToggle", "zoneCompareToggle"].forEach((id) => {
      const input = document.getElementById(id);
      if (!input) return;
      input.addEventListener("change", () => {
        scheduleRefreshIfPanelOpen(50);
      });
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


