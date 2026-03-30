// js/personal-loot-import-shared.js
(() => {
  "use strict";

  const STORAGE_KEY = "dungeon.personalLootImport.v1";
  const SUPPORTED_EXPORT_FORMAT = "360dungeon.edible-tools.chest-open-export";
  const NORMALIZED_FORMAT = "360dungeon.personal-chest-loot-import";
  const RAW_EDIBLE_TOOLS_FORMAT = "edible-tools.chest-open-data.raw";

  const KEY_PLAYER_NAME = "\u73a9\u5bb6\u6635\u79f0";
  const KEY_CHESTS = "\u5f00\u7bb1\u6570\u636e";
  const KEY_TOTAL_OPENS = "\u603b\u8ba1\u5f00\u7bb1\u6570\u91cf";
  const KEY_ITEMS = "\u83b7\u5f97\u7269\u54c1";
  const KEY_ITEM_QTY = "\u6570\u91cf";

  let cachedImport;
  let nameMapsPromise = null;

  function getShared(name) {
    return window[name] || null;
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function getInitDataShared() {
    return getShared("DungeonInitDataShared");
  }

  function storageGetJson(key, fallback) {
    const shared = getStorageShared();
    if (shared && typeof shared.getJson === "function") return shared.getJson(key, fallback);
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function storageSetJson(key, value) {
    const shared = getStorageShared();
    if (shared && typeof shared.setJson === "function") {
      shared.setJson(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  function storageRemoveItem(key) {
    const shared = getStorageShared();
    if (shared && typeof shared.removeItem === "function") {
      shared.removeItem(key);
      return;
    }
    localStorage.removeItem(key);
  }

  async function getInitData() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      const data = await shared.getInitData();
      if (data) return data;
    }
    if (window.InitCharacterData) return window.InitCharacterData;
    if (window.InitLoader?.loadInitData) return await window.InitLoader.loadInitData();
    return null;
  }

  function normalizeNameKey(value) {
    const base = String(value == null ? "" : value);
    const normalized = typeof base.normalize === "function" ? base.normalize("NFKC") : base;
    return normalized
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function toFinitePositive(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  async function buildNameMaps() {
    if (nameMapsPromise) return nameMapsPromise;
    nameMapsPromise = (async () => {
      const init = await getInitData();
      if (!init) throw new Error("Init data is not ready yet.");
      const items = init?.itemDetailMap || init?.itemMap || init?.items || {};
      const openableMap = init?.openableLootDropMap || {};
      const openableSet = new Set(Object.keys(openableMap));
      const itemNameToHrid = new Map();
      const chestNameToHrid = new Map();

      Object.entries(items).forEach(([hrid, item]) => {
        const name = String(item?.name || item?.displayName || item?.localizedName || "").trim();
        if (!name) return;
        const key = normalizeNameKey(name);
        if (!itemNameToHrid.has(key)) itemNameToHrid.set(key, hrid);
        if (openableSet.has(hrid) && !chestNameToHrid.has(key)) chestNameToHrid.set(key, hrid);
      });

      return { itemNameToHrid, chestNameToHrid };
    })();
    return nameMapsPromise;
  }

  function resolveNameToHrid(name, map) {
    if (!map || typeof map.get !== "function") return null;
    const key = normalizeNameKey(name);
    return key ? (map.get(key) || null) : null;
  }

  function sanitizeStoredImport(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (String(raw.format || "") !== NORMALIZED_FORMAT) return null;
    const chests = (raw.chests && typeof raw.chests === "object") ? raw.chests : {};
    const summary = (raw.summary && typeof raw.summary === "object") ? raw.summary : {};
    return {
      format: NORMALIZED_FORMAT,
      version: Number(raw.version) || 1,
      importedAt: String(raw.importedAt || ""),
      selectedPlayerId: String(raw.selectedPlayerId || ""),
      selectedPlayerName: String(raw.selectedPlayerName || ""),
      source: (raw.source && typeof raw.source === "object") ? raw.source : {},
      summary: {
        chestCount: Math.max(0, Math.floor(Number(summary.chestCount) || 0)),
        totalTrackedOpens: Math.max(0, Number(summary.totalTrackedOpens) || 0),
        unmappedChestCount: Math.max(0, Math.floor(Number(summary.unmappedChestCount) || 0)),
        unmappedItemCount: Math.max(0, Math.floor(Number(summary.unmappedItemCount) || 0)),
      },
      chests,
      unmappedChests: Array.isArray(raw.unmappedChests) ? raw.unmappedChests.slice() : [],
      unmappedItems: Array.isArray(raw.unmappedItems) ? raw.unmappedItems.slice() : [],
    };
  }

  function readStoredImport() {
    if (cachedImport !== undefined) return cachedImport;
    cachedImport = sanitizeStoredImport(storageGetJson(STORAGE_KEY, null));
    return cachedImport;
  }

  function writeStoredImport(data) {
    const normalized = sanitizeStoredImport(data);
    if (!normalized) throw new Error("Normalized personal loot import is invalid.");
    storageSetJson(STORAGE_KEY, normalized);
    cachedImport = normalized;
    return normalized;
  }

  function coercePayloadEnvelope(rawPayload) {
    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      throw new Error("Paste a valid 360Dungeon chest export JSON object.");
    }

    if (
      String(rawPayload.format || "") === SUPPORTED_EXPORT_FORMAT &&
      rawPayload.players &&
      typeof rawPayload.players === "object"
    ) {
      return rawPayload;
    }

    const looksLikeRawChestOpenData = Object.values(rawPayload).some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const chests = entry[KEY_CHESTS];
      return !!(chests && typeof chests === "object");
    });

    if (looksLikeRawChestOpenData) {
      return {
        format: RAW_EDIBLE_TOOLS_FORMAT,
        exportedAt: "",
        selectedPlayerId: "",
        selectedPlayerName: "",
        source: {},
        players: rawPayload,
      };
    }

    throw new Error("Unsupported import format. Paste the 360Dungeon chest export JSON.");
  }

  function pickPlayerEnvelope(payload, opts = {}) {
    const players = (payload?.players && typeof payload.players === "object") ? payload.players : null;
    if (!players) throw new Error("Imported payload does not include any player records.");

    const preferredId = String(
      opts.playerId ||
      payload.selectedPlayerId ||
      payload.source?.currentCharacterId ||
      ""
    ).trim();

    if (preferredId && players[preferredId]) {
      return { playerId: preferredId, player: players[preferredId] };
    }

    const playerIds = Object.keys(players).filter(Boolean);
    if (!playerIds.length) throw new Error("Imported payload does not include any player records.");

    const playerId = playerIds[0];
    return { playerId, player: players[playerId] };
  }

  async function normalizeImportPayload(rawPayload, opts = {}) {
    const payload = coercePayloadEnvelope(rawPayload);
    const { playerId, player } = pickPlayerEnvelope(payload, opts);
    const chestEntries = (player && typeof player === "object") ? player[KEY_CHESTS] : null;
    if (!chestEntries || typeof chestEntries !== "object") {
      throw new Error("The selected player does not have any chest records.");
    }

    const maps = await buildNameMaps();
    const chests = {};
    const unmappedChests = [];
    const unmappedItems = [];
    let chestCount = 0;
    let totalTrackedOpens = 0;

    Object.entries(chestEntries).forEach(([rawChestName, rawChestRecord]) => {
      const chestName = String(rawChestName || "").trim();
      const chestHrid = resolveNameToHrid(chestName, maps.chestNameToHrid);
      if (!chestHrid) {
        if (chestName) unmappedChests.push(chestName);
        return;
      }

      const opens = toFinitePositive(rawChestRecord?.[KEY_TOTAL_OPENS]);
      if (!opens) return;

      const rawItems = rawChestRecord?.[KEY_ITEMS];
      if (!rawItems || typeof rawItems !== "object") return;

      const items = {};
      const expectedMap = {};
      let mappedItemCount = 0;

      Object.entries(rawItems).forEach(([rawItemName, rawItemRecord]) => {
        const itemName = String(rawItemName || "").trim();
        const itemHrid = resolveNameToHrid(itemName, maps.itemNameToHrid);
        if (!itemHrid) {
          if (itemName) unmappedItems.push(`${chestName}: ${itemName}`);
          return;
        }

        const totalQty = toFinitePositive(rawItemRecord?.[KEY_ITEM_QTY]);
        if (!totalQty) return;

        const expectedQty = totalQty / opens;
        items[itemHrid] = {
          itemName,
          totalQty,
          expectedQty,
        };
        expectedMap[itemHrid] = expectedQty;
        mappedItemCount += 1;
      });

      if (!mappedItemCount) return;

      chests[chestHrid] = {
        chestName,
        opens,
        itemCount: mappedItemCount,
        items,
        expectedMap,
      };
      chestCount += 1;
      totalTrackedOpens += opens;
    });

    if (!chestCount) {
      throw new Error("No usable chest records were found in the pasted data.");
    }

    const playerName = String(
      player?.[KEY_PLAYER_NAME] ||
      payload.selectedPlayerName ||
      ""
    ).trim();

    return {
      format: NORMALIZED_FORMAT,
      version: 1,
      importedAt: new Date().toISOString(),
      selectedPlayerId: playerId,
      selectedPlayerName: playerName,
      source: {
        format: String(payload.format || ""),
        exportedAt: String(payload.exportedAt || ""),
        origin: String(payload.source?.origin || ""),
        href: String(payload.source?.href || ""),
        currentCharacterId: String(payload.source?.currentCharacterId || ""),
        exportedMode: String(payload.source?.exportedMode || ""),
      },
      summary: {
        chestCount,
        totalTrackedOpens,
        unmappedChestCount: unmappedChests.length,
        unmappedItemCount: unmappedItems.length,
      },
      chests,
      unmappedChests,
      unmappedItems,
    };
  }

  function buildStatusSummary(data = readStoredImport()) {
    if (!data) {
      return {
        active: false,
        playerId: "",
        playerName: "",
        chestCount: 0,
        totalTrackedOpens: 0,
        importedAt: "",
        sourceExportedAt: "",
        unmappedChestCount: 0,
        unmappedItemCount: 0,
      };
    }

    return {
      active: true,
      playerId: String(data.selectedPlayerId || ""),
      playerName: String(data.selectedPlayerName || ""),
      chestCount: Math.max(0, Math.floor(Number(data.summary?.chestCount) || 0)),
      totalTrackedOpens: Math.max(0, Number(data.summary?.totalTrackedOpens) || 0),
      importedAt: String(data.importedAt || ""),
      sourceFormat: String(data.source?.format || ""),
      sourceExportedAt: String(data.source?.exportedAt || ""),
      unmappedChestCount: Math.max(0, Math.floor(Number(data.summary?.unmappedChestCount) || 0)),
      unmappedItemCount: Math.max(0, Math.floor(Number(data.summary?.unmappedItemCount) || 0)),
    };
  }

  function emitChanged(detail = {}) {
    const summary = buildStatusSummary(detail.data || readStoredImport());
    try {
      document.dispatchEvent(new CustomEvent("dungeon:personal-loot-import-changed", {
        detail: {
          ...(detail || {}),
          summary,
        },
      }));
    } catch (_) { }
  }

  async function importFromObject(payload, opts = {}) {
    const normalized = await normalizeImportPayload(payload, opts);
    const stored = writeStoredImport(normalized);
    emitChanged({ reason: "imported", data: stored });
    return stored;
  }

  async function importFromText(text, opts = {}) {
    const rawText = String(text == null ? "" : text).trim();
    if (!rawText) throw new Error("Paste the 360Dungeon chest export JSON first.");

    let payload;
    try {
      payload = JSON.parse(rawText);
    } catch (_) {
      throw new Error("Couldn't parse the pasted JSON. Make sure you pasted the full 360Dungeon export.");
    }

    return importFromObject(payload, opts);
  }

  function clearImport() {
    storageRemoveItem(STORAGE_KEY);
    cachedImport = null;
    emitChanged({ reason: "cleared" });
  }

  function getActiveImport() {
    return readStoredImport();
  }

  function hasActiveImport() {
    return !!readStoredImport();
  }

  function getOpenableProfile(openableHrid) {
    const data = readStoredImport();
    const chest = data?.chests?.[openableHrid];
    if (!chest || typeof chest !== "object") return null;

    const rows = Object.entries(chest.expectedMap || {})
      .map(([itemHrid, expectedQty]) => ({
        itemHrid,
        itemName: String(chest.items?.[itemHrid]?.itemName || itemHrid),
        totalQty: toFinitePositive(chest.items?.[itemHrid]?.totalQty),
        expectedQty: toFinitePositive(expectedQty),
        chance: 1,
        meanCount: toFinitePositive(expectedQty),
        source: "personal",
        observedOpens: toFinitePositive(chest.opens),
      }))
      .filter((row) => row.itemHrid && row.expectedQty > 0)
      .sort((a, b) => (b.expectedQty - a.expectedQty) || String(a.itemName).localeCompare(String(b.itemName)));

    if (!rows.length) return null;

    return {
      openableHrid,
      chestName: String(chest.chestName || openableHrid),
      opens: toFinitePositive(chest.opens),
      rows,
    };
  }

  window.DungeonPersonalLootImportShared = {
    STORAGE_KEY,
    SUPPORTED_EXPORT_FORMAT,
    getActiveImport,
    getStatusSummary: buildStatusSummary,
    hasActiveImport,
    getOpenableProfile,
    normalizeImportPayload,
    importFromObject,
    importFromText,
    clearImport,
    emitChanged,
  };
})();
