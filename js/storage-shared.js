// js/storage-shared.js
(() => {
  "use strict";
  // Ownership: shared localStorage access primitives and JSON helpers.
  // Invariant: no implicit try/catch; callers keep their existing error handling behavior.

  function getItem(key) {
    return localStorage.getItem(key);
  }

  function setItem(key, value) {
    localStorage.setItem(key, value);
  }

  function removeItem(key) {
    localStorage.removeItem(key);
  }

  function getJson(key, fallback, parseFn) {
    const raw = getItem(key);
    if (raw == null || raw === "") return fallback;
    if (typeof parseFn === "function") return parseFn(raw, fallback);
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function setJson(key, value) {
    setItem(key, JSON.stringify(value));
  }

  function migrateLegacyStoragePrefix() {
    const legacyPrefix = String.fromCharCode(100, 117, 110, 103, 101, 110, 46);
    const currentPrefix = "dungeon.";
    if (legacyPrefix === currentPrefix) return;

    const legacyKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (typeof key === "string" && key.startsWith(legacyPrefix)) {
        legacyKeys.push(key);
      }
    }

    for (const legacyKey of legacyKeys) {
      const suffix = legacyKey.slice(legacyPrefix.length);
      const currentKey = `${currentPrefix}${suffix}`;
      if (getItem(currentKey) != null) continue;
      const value = getItem(legacyKey);
      if (value != null) setItem(currentKey, value);
    }
  }

  try {
    migrateLegacyStoragePrefix();
  } catch (_) { }

  window.DungeonStorageShared = {
    getItem,
    setItem,
    removeItem,
    getJson,
    setJson,
  };
})();

