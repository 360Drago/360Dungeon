// js/key-pricing-import-shared.js
(() => {
  "use strict";

  let provider = null;
  const cache = new Map();

  function getShared(name) {
    return window[name] || null;
  }

  function t(key, fallback) {
    const fn = window.SiteI18n?.t;
    if (typeof fn === "function") return fn(key, fallback);
    return fallback;
  }

  function tf(key, fallback, vars = {}) {
    const fn = getShared("DungeonTextShared")?.tf;
    if (typeof fn === "function") return fn(key, fallback, vars);
    let out = String(fallback || "");
    Object.entries(vars || {}).forEach(([varKey, value]) => {
      out = out.replace(new RegExp(`\\{${varKey}\\}`, "g"), String(value ?? ""));
    });
    return out;
  }

  function normalizeApiSource(raw) {
    const normalize = getShared("DungeonPricingStateShared")?.normalizeApiSource;
    if (typeof normalize === "function") return normalize(raw);
    return String(raw || "").trim().toLowerCase() === "other" ? "other" : "official";
  }

  function formatCoinsCompact(value) {
    const formatter = getShared("DungeonNumberShared")?.formatCoinsCompact;
    if (typeof formatter === "function") return formatter(value);
    if (!Number.isFinite(value)) return "-";
    const abs = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    return `${sign}${Math.round(abs).toLocaleString()}`;
  }

  function toFiniteOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function cacheKeyFor(dungeonKey, apiSource) {
    return `${normalizeApiSource(apiSource)}:${String(dungeonKey || "").trim().toLowerCase()}`;
  }

  function describePouchState(info) {
    const enabled = !!info?.guzzlingPouchEnabled;
    const level = Math.max(0, Math.floor(Number(info?.guzzlingPouchLevel) || 0));
    if (!enabled) return t("ui.offShort", "Off");
    return tf("ui.keysImportTooltipPouchOn", "On (+{level})", { level });
  }

  function buildTooltip(info = {}) {
    const apiSource = normalizeApiSource(info.apiSource);
    const sourceLabel = apiSource === "other"
      ? t("ui.mooket", "Mooket")
      : t("ui.official", "Official");
    const buyMode = String(info.buyMode || "").trim().toLowerCase() === "order"
      ? t("ui.order", "Order")
      : t("ui.instant", "Instant");
    const artisan = info.artisanEnabled ? t("ui.onShort", "On") : t("ui.offShort", "Off");
    const lines = [
      t("ui.keysImportTooltipTitle", "Keys planner import"),
      tf("ui.keysImportTooltipSource", "Source: {source}", { source: sourceLabel }),
      tf("ui.keysImportTooltipBuyMode", "Buy mode: {mode}", { mode: buyMode }),
      tf("ui.keysImportTooltipArtisan", "Artisan tea: {state}", { state: artisan }),
      tf("ui.keysImportTooltipPouch", "Guzzling pouch: {state}", { state: describePouchState(info) }),
    ];

    if (Number.isFinite(info.entryPrice)) {
      lines.push(tf("ui.keysImportTooltipEntry", "Entry key: {price}", {
        price: formatCoinsCompact(info.entryPrice),
      }));
    }
    if (Number.isFinite(info.chestKeyPrice)) {
      lines.push(tf("ui.keysImportTooltipChest", "Chest key: {price}", {
        price: formatCoinsCompact(info.chestKeyPrice),
      }));
    }
    if (Number.isFinite(info.overrideCount) && info.overrideCount > 0) {
      lines.push(tf("ui.keysImportTooltipOverrides", "Manual fragment overrides: {count}", {
        count: info.overrideCount,
      }));
    }
    if (info.errorMessage) lines.push(String(info.errorMessage));

    return lines.join("\n");
  }

  function normalizeResult(raw, opts = {}) {
    const base = raw && typeof raw === "object" ? raw : {};
    const dungeonKey = String(opts.dungeonKey || base.dungeonKey || "").trim().toLowerCase();
    const apiSource = normalizeApiSource(opts.apiSource || base.apiSource);
    const entryPrice = toFiniteOrNull(base.entryPrice);
    const chestKeyPrice = toFiniteOrNull(base.chestKeyPrice);
    const overrideCount = Math.max(0, Math.floor(Number(base.overrideCount) || 0));
    const result = {
      ok: !!base.ok && Number.isFinite(entryPrice) && Number.isFinite(chestKeyPrice),
      ready: base.ready !== false,
      dungeonKey,
      apiSource,
      buyMode: String(base.buyMode || "").trim().toLowerCase() === "order" ? "order" : "instant",
      artisanEnabled: base.artisanEnabled !== false,
      guzzlingPouchEnabled: !!base.guzzlingPouchEnabled,
      guzzlingPouchLevel: Math.max(0, Math.floor(Number(base.guzzlingPouchLevel) || 0)),
      overrideCount,
      entryPrice,
      chestKeyPrice,
      entryAsk: Number.isFinite(entryPrice) ? entryPrice : -1,
      entryBid: Number.isFinite(entryPrice) ? entryPrice : -1,
      chestKeyAsk: Number.isFinite(chestKeyPrice) ? chestKeyPrice : -1,
      chestKeyBid: Number.isFinite(chestKeyPrice) ? chestKeyPrice : -1,
      errorMessage: String(base.errorMessage || base.error || "").trim(),
      tooltip: "",
    };
    result.tooltip = String(base.tooltip || "").trim() || buildTooltip(result);
    return result;
  }

  function setCached(result) {
    if (!result?.dungeonKey) return result;
    cache.set(cacheKeyFor(result.dungeonKey, result.apiSource), result);
    return result;
  }

  function getCachedImportedPricing(dungeonKey, opts = {}) {
    const normalizedKey = String(dungeonKey || "").trim().toLowerCase();
    const apiSource = normalizeApiSource(opts.apiSource);
    const cached = cache.get(cacheKeyFor(normalizedKey, apiSource));
    if (cached) return cached;
    if (!provider || typeof provider.getCachedImportedPricing !== "function") {
      return normalizeResult({ ok: false, ready: false }, { dungeonKey: normalizedKey, apiSource });
    }
    try {
      return setCached(normalizeResult(provider.getCachedImportedPricing(normalizedKey, { ...opts, apiSource }), {
        dungeonKey: normalizedKey,
        apiSource,
      }));
    } catch (err) {
      return normalizeResult({
        ok: false,
        ready: false,
        errorMessage: err?.message || String(err),
      }, { dungeonKey: normalizedKey, apiSource });
    }
  }

  async function ensureImportedPricing(dungeonKey, opts = {}) {
    const normalizedKey = String(dungeonKey || "").trim().toLowerCase();
    const apiSource = normalizeApiSource(opts.apiSource);
    if (!provider || typeof provider.ensureImportedPricing !== "function") {
      return normalizeResult({
        ok: false,
        ready: false,
        errorMessage: t("ui.keysImportUnavailable", "Keys planner pricing is not ready yet."),
      }, { dungeonKey: normalizedKey, apiSource });
    }
    try {
      return setCached(normalizeResult(
        await provider.ensureImportedPricing(normalizedKey, { ...opts, apiSource }),
        { dungeonKey: normalizedKey, apiSource }
      ));
    } catch (err) {
      return normalizeResult({
        ok: false,
        ready: false,
        errorMessage: err?.message || String(err),
      }, { dungeonKey: normalizedKey, apiSource });
    }
  }

  function emitChanged(detail = {}) {
    try {
      document.dispatchEvent(new CustomEvent("keys:import-pricing-changed", {
        detail: { ...(detail || {}) },
      }));
    } catch (_) { }
  }

  function registerProvider(nextProvider) {
    provider = (nextProvider && typeof nextProvider === "object") ? nextProvider : null;
    emitChanged({ reason: "provider-registered" });
  }

  function clearCache() {
    cache.clear();
  }

  window.DungeonKeyPricingImportShared = {
    registerProvider,
    ensureImportedPricing,
    getCachedImportedPricing,
    emitChanged,
    clearCache,
    buildTooltip,
  };
})();
