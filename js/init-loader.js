// js/init-loader.js
(() => {
  "use strict";
  // Ownership/invariant:
  // - Returns init data object or null.
  // - Uses js/init_Character_data.js as the single source of truth.
  // - That file is loaded as executable data script: window.InitCharacterData = {...};
  // - Keeps a single in-flight load so parallel callers share one resolution path.
  const INIT_DATA_SCRIPT_URL = "./js/init_Character_data.js";
  const CACHE_KEY = "dungeon.init_client_data.cache";
  const CACHE_MAX_CHARS = 900000; // Keep localStorage cache bounded to avoid main-thread stalls/quota failures.
  let loadInitDataInFlight = null;
  let initScriptInFlight = null;

  function getStorageShared() {
    return window.DungeonStorageShared || null;
  }

  function storageCall(methodName, ...args) {
    const method = getStorageShared()?.[methodName];
    if (typeof method === "function") return method(...args);
    return localStorage[methodName](...args);
  }

  function storageGetItem(key) {
    return storageCall("getItem", key);
  }

  function storageSetItem(key, value) {
    storageCall("setItem", key, value);
  }

  function cacheAndReturn(data) {
    if (!data || typeof data !== "object") return null;
    window.InitCharacterData = data;
    try {
      const serialized = JSON.stringify(data);
      if (serialized.length <= CACHE_MAX_CHARS) {
        storageSetItem(CACHE_KEY, serialized);
      }
    } catch (_) { }
    return data;
  }

  function tryLoadCachedInit() {
    try {
      const raw = storageGetItem(CACHE_KEY);
      if (!raw) return null;
      if (raw.length > CACHE_MAX_CHARS) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch (_) { }
    return null;
  }

  function resolveInitScriptUrl() {
    try {
      return new URL(INIT_DATA_SCRIPT_URL, window.location.href).href;
    } catch (_) {
      return INIT_DATA_SCRIPT_URL;
    }
  }

  function warnInitLoader(message, err) {
    console.warn(message, err);
  }

  function ensureInitScriptLoaded() {
    if (window.InitCharacterData) return Promise.resolve(window.InitCharacterData);
    if (initScriptInFlight) return initScriptInFlight;

    initScriptInFlight = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = resolveInitScriptUrl();
      script.async = true;
      script.dataset.initDataScript = "1";
      script.onload = () => resolve(window.InitCharacterData || null);
      script.onerror = () => reject(new Error("Failed to load init_Character_data.js script"));
      (document.head || document.documentElement).appendChild(script);
    }).finally(() => {
      initScriptInFlight = null;
    });

    return initScriptInFlight;
  }

  async function loadInitData() {
    if (window.InitCharacterData) return cacheAndReturn(window.InitCharacterData);
    if (loadInitDataInFlight) return await loadInitDataInFlight;

    loadInitDataInFlight = (async () => {
      try {
        await ensureInitScriptLoaded();
        if (window.InitCharacterData) return cacheAndReturn(window.InitCharacterData);
        throw new Error("InitCharacterData missing after script load");
      } catch (e) {
        const cached = tryLoadCachedInit();
        if (cached) {
          warnInitLoader("[init-loader] Init script load failed, using cached init data:", e);
          return cacheAndReturn(cached);
        }
        warnInitLoader("[init-loader] Unable to load init_Character_data.js:", e);
        return null;
      }
    })();

    try {
      return await loadInitDataInFlight;
    } finally {
      loadInitDataInFlight = null;
    }
  }

  window.InitLoader = { loadInitData };
})();

