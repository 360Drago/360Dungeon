// js/openable-loot-raw.js
// Builds an immutable "expected quantity per open" table from init_Character_data.js openableLootDropMap.
//
// API (global):
//   await OpenableLootRaw.ready()
//   OpenableLootRaw.getOpenables() -> string[]
//   OpenableLootRaw.getExpectedMap(openableHrid, { resolveNested?: boolean }) -> Record<itemHrid, number>
//   OpenableLootRaw.getExpectedRows(openableHrid, { resolveNested?: boolean, minExpected?: number, sort?: "expected"|"item" }) -> Array<{itemHrid, expectedQty}>
//   OpenableLootRaw.getDirectDetailRows(openableHrid) -> Array<{itemHrid, chance, minCount, maxCount, meanCount, expectedQty}>
//   OpenableLootRaw.renderTable(rootEl, { openableHrid?, resolveNested?, minExpected?, decimals?, caption? })
//   OpenableLootRaw.consoleTable(openableHrid, { resolveNested?, minExpected?, decimals? })
//
// Notes:
// - Duplicate itemHrid rows are SUMMED (no overwriting).
// - resolveNested=true expands nested openables into leaf items (e.g., dungeon chest -> treasure chest -> items).
// - Raw quantities only: no pricing/tax/keys.
(() => {
  "use strict";

  const DEFAULT_DECIMALS = 4;

  /** @type {null|{
   *  init:any,
   *  direct:Record<string, Record<string, number>>,
   *  directAggRows:Record<string, Array<{itemHrid:string, expectedQty:number}>>,
   *  directDetailRows:Record<string, Array<{itemHrid:string, chance:number, minCount:number, maxCount:number, meanCount:number, expectedQty:number}>>,
   *  isOpenable:Set<string>
   * }} */
  let CACHE = null;

  function toFiniteNumber(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeDropRate(x) {
    const n = toFiniteNumber(x, 0);
    if (n <= 0) return 0;
    if (n > 1) return Math.min(1, n / 100);
    return Math.min(1, n);
  }

  function normalizeMinMax(row) {
    const min = toFiniteNumber(
      row.minCount ?? row.minQty ?? row.min ?? row.minQuantity ?? row.qtyMin ?? row.count ?? row.quantity ?? row.qty,
      0,
    );
    const maxRaw = row.maxCount ?? row.maxQty ?? row.max ?? row.maxQuantity ?? row.qtyMax;
    const max = (maxRaw == null) ? min : toFiniteNumber(maxRaw, min);
    return { min, max: Math.max(max, min) };
  }

  function deepFreeze(obj) {
    if (!obj || typeof obj !== "object" || Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    for (const k of Object.keys(obj)) deepFreeze(obj[k]);
    return obj;
  }

  function getInitDataShared() {
    return window.DungeonInitDataShared || null;
  }

  async function ensureInit() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      const data = await shared.getInitData();
      if (data) return data;
    }
    if (window.InitCharacterData) return window.InitCharacterData;
    if (window.InitLoader?.loadInitData) return await window.InitLoader.loadInitData();
    return null;
  }

  function buildDirectTables(init) {
    const map = init?.openableLootDropMap || {};
    /** @type {Record<string, Record<string, number>>} */
    const direct = Object.create(null);
    /** @type {Record<string, Array<{itemHrid:string, expectedQty:number}>>} */
    const directAggRows = Object.create(null);
    /** @type {Record<string, Array<{itemHrid:string, chance:number, minCount:number, maxCount:number, meanCount:number, expectedQty:number}>>} */
    const directDetailRows = Object.create(null);
    const openables = new Set(Object.keys(map));

    for (const openableHrid of Object.keys(map)) {
      const rows = Array.isArray(map[openableHrid]) ? map[openableHrid] : [];
      const agg = new Map(); // itemHrid -> expectedQty sum
      const detail = [];

      for (const r of rows) {
        const itemHrid = String(r?.itemHrid ?? r?.itemId ?? r?.id ?? r?.item ?? "");
        if (!itemHrid) continue;

        const chance = normalizeDropRate(r?.dropRate ?? r?.chance);
        const { min, max } = normalizeMinMax(r || {});
        const mean = (min + max) / 2;
        const expectedQty = chance * mean;

        if (expectedQty !== 0) agg.set(itemHrid, (agg.get(itemHrid) || 0) + expectedQty);

        detail.push({ itemHrid, chance, minCount: min, maxCount: max, meanCount: mean, expectedQty });
      }

      // aggregated map + rows
      const aggObj = Object.create(null);
      const aggRows = [];
      for (const [itemHrid, expectedQty] of agg.entries()) {
        aggObj[itemHrid] = expectedQty;
        aggRows.push({ itemHrid, expectedQty });
      }
      aggRows.sort((a, b) => (b.expectedQty - a.expectedQty) || a.itemHrid.localeCompare(b.itemHrid));
      detail.sort((a, b) => (b.expectedQty - a.expectedQty) || a.itemHrid.localeCompare(b.itemHrid));

      direct[openableHrid] = aggObj;
      directAggRows[openableHrid] = aggRows;
      directDetailRows[openableHrid] = detail;
    }

    deepFreeze(direct);
    deepFreeze(directAggRows);
    deepFreeze(directDetailRows);

    return { direct, directAggRows, directDetailRows, isOpenable: openables };
  }

  /**
   * Expand nested openables into leaf items (memoized per openableHrid).
   * @param {string} openableHrid
   * @param {Map<string, Record<string, number>>} memo
   * @param {Set<string>} visiting
   * @returns {Record<string, number>}
   */
  function resolveNestedExpectedMap(openableHrid, memo, visiting) {
    if (memo.has(openableHrid)) return memo.get(openableHrid);
    if (visiting.has(openableHrid)) return Object.create(null); // cycle guard
    visiting.add(openableHrid);

    const directMap = CACHE?.direct?.[openableHrid] || Object.create(null);
    /** @type {Record<string, number>} */
    const out = Object.create(null);

    for (const [itemHrid, qty] of Object.entries(directMap)) {
      if (qty === 0) continue;

      if (CACHE?.isOpenable?.has(itemHrid)) {
        const sub = resolveNestedExpectedMap(itemHrid, memo, visiting);
        for (const [leafHrid, leafQty] of Object.entries(sub)) {
          out[leafHrid] = (out[leafHrid] || 0) + (leafQty * qty);
        }
      } else {
        out[itemHrid] = (out[itemHrid] || 0) + qty;
      }
    }

    visiting.delete(openableHrid);
    memo.set(openableHrid, out);
    return out;
  }

  function fmtQty(x, decimals = DEFAULT_DECIMALS) {
    return toFiniteNumber(x, 0).toFixed(decimals);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function nameForHrid(hrid, init) {
    const items = init?.itemDetailMap || init?.itemMap || init?.items;
    const it = items?.[hrid];
    const nm = it?.name ?? it?.displayName ?? it?.localizedName;
    return nm ? String(nm) : hrid;
  }

  async function ready() {
    if (CACHE) return CACHE;
    const init = await ensureInit();
    if (!init) throw new Error("[OpenableLootRaw] InitCharacterData not available");
    const built = buildDirectTables(init);
    CACHE = deepFreeze({ init, ...built });
    return CACHE;
  }

  /** @returns {string[]} */
  function getOpenables() {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    return Array.from(CACHE.isOpenable).sort();
  }

  /**
   * Aggregated expected quantities map for a single openable.
   * @param {string} openableHrid
   * @param {{resolveNested?: boolean}} [opts]
   * @returns {Record<string, number>}
   */
  function getExpectedMap(openableHrid, opts = {}) {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    if (!opts.resolveNested) return CACHE.direct?.[openableHrid] || Object.create(null);

    const memo = new Map();
    return deepFreeze(resolveNestedExpectedMap(openableHrid, memo, new Set()));
  }

  /**
   * Aggregated expected rows for display (expectedQty shown to 0.0001 via formatting).
   * @param {string} openableHrid
   * @param {{resolveNested?: boolean, minExpected?: number, sort?: "expected"|"item"}} [opts]
   * @returns {Array<{itemHrid:string, expectedQty:number}>}
   */
  function getExpectedRows(openableHrid, opts = {}) {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    const minExpected = toFiniteNumber(opts.minExpected, 0);
    const sort = opts.sort || "expected";

    let rows;
    if (!opts.resolveNested) {
      rows = (CACHE.directAggRows?.[openableHrid] || []).slice();
    } else {
      rows = Object.entries(getExpectedMap(openableHrid, { resolveNested: true }))
        .map(([itemHrid, expectedQty]) => ({ itemHrid, expectedQty }));
    }

    rows = rows.filter(r => r.expectedQty >= minExpected);

    if (sort === "item") rows.sort((a, b) => a.itemHrid.localeCompare(b.itemHrid));
    else rows.sort((a, b) => (b.expectedQty - a.expectedQty) || a.itemHrid.localeCompare(b.itemHrid));

    return deepFreeze(rows);
  }

  /**
   * Direct, per-row details from openableLootDropMap (useful for debugging).
   * @param {string} openableHrid
   * @returns {Array<{itemHrid:string, chance:number, minCount:number, maxCount:number, meanCount:number, expectedQty:number}>}
   */
  function getDirectDetailRows(openableHrid) {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    return CACHE.directDetailRows?.[openableHrid] || [];
  }

  /**
   * Render an HTML table into rootEl.
   * @param {HTMLElement} rootEl
   * @param {{openableHrid?: string, resolveNested?: boolean, minExpected?: number, decimals?: number, caption?: string}} [opts]
   */
  function renderTable(rootEl, opts = {}) {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    if (!rootEl) return;

    const openableHrid = opts.openableHrid || "";
    const resolveNested = !!opts.resolveNested;
    const minExpected = toFiniteNumber(opts.minExpected, 0);
    const decimals = Number.isInteger(opts.decimals) ? opts.decimals : DEFAULT_DECIMALS;

    const list = openableHrid ? [openableHrid] : getOpenables();
    const cap = opts.caption || (resolveNested ? "Openable loot (flattened)" : "Openable loot (direct)");

    const parts = [];
    parts.push(`<table class="openable-loot-table"><caption>${escapeHtml(cap)}</caption>`);
    parts.push("<thead><tr><th>Openable</th><th>Item</th><th>Expected Qty / Open</th></tr></thead><tbody>");

    for (const oh of list) {
      const rows = getExpectedRows(oh, { resolveNested, minExpected });
      if (!rows.length) continue;
      const ohName = nameForHrid(oh, CACHE.init);

      for (const r of rows) {
        const itemName = nameForHrid(r.itemHrid, CACHE.init);
        parts.push(
          `<tr>` +
          `<td title="${escapeHtml(oh)}">${escapeHtml(ohName)}</td>` +
          `<td title="${escapeHtml(r.itemHrid)}">${escapeHtml(itemName)}</td>` +
          `<td style="text-align:right" title="${escapeHtml(String(r.expectedQty))}">${escapeHtml(fmtQty(r.expectedQty, decimals))}</td>` +
          `</tr>`
        );
      }
    }

    parts.push("</tbody></table>");
    rootEl.innerHTML = parts.join("");
  }

  /**
   * Convenience: log a compact console.table for a single openable.
   * @param {string} openableHrid
   * @param {{resolveNested?: boolean, minExpected?: number, decimals?: number}} [opts]
   */
  function consoleTable(openableHrid, opts = {}) {
    if (!CACHE) throw new Error("[OpenableLootRaw] call await OpenableLootRaw.ready() first");
    const decimals = Number.isInteger(opts.decimals) ? opts.decimals : DEFAULT_DECIMALS;
    const rows = getExpectedRows(openableHrid, { resolveNested: !!opts.resolveNested, minExpected: opts.minExpected ?? 0 })
      .map(r => ({ itemHrid: r.itemHrid, expectedQty: Number(fmtQty(r.expectedQty, decimals)) }));
    console.table(rows);
  }

  window.OpenableLootRaw = {
    ready,
    getOpenables,
    getExpectedMap,
    getExpectedRows,
    getDirectDetailRows,
    renderTable,
    consoleTable,
  };
})();

