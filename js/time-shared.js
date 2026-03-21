// js/time-shared.js
(() => {
  "use strict";
  // Ownership: shared relative-time formatting and localStorage-backed age timers.
  // Invariant: preserve existing "ago"/"compact" text output semantics.

  function getTextShared() {
    return window.DungeonTextShared || null;
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

  function formatAge(ms, opts = {}) {
    const resolved = (typeof opts === "string")
      ? { invalidText: opts, style: "ago" }
      : (opts || {});
    const style = resolved.style || "ago";
    const invalidText = (typeof resolved.invalidText === "string") ? resolved.invalidText : "-";

    if (!Number.isFinite(ms) || ms < 0) return invalidText;

    if (style === "compact") {
      const s = Math.max(0, Math.floor(ms / 1000));
      const m = Math.floor(s / 60);
      const r = s % 60;
      if (m <= 0) return tf("ui.secondsShort", "{count}s", { count: r });
      if (m < 60) return tf("ui.minutesShort", "{count}m {rem}s", { count: m, rem: r });
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return tf("ui.hoursShort", "{count}h {rem}m", { count: h, rem: mm });
    }

    const s = Math.floor(ms / 1000);
    if (s < 10) return t("ui.justNow", "just now");
    if (s < 60) return tf("ui.secondsAgo", "{count}s ago", { count: s });
    const m = Math.floor(s / 60);
    if (m < 60) return tf("ui.minutesAgo", "{count}m ago", { count: m });
    const h = Math.floor(m / 60);
    if (h < 24) return tf("ui.hoursAgo", "{count}h ago", { count: h });
    const d = Math.floor(h / 24);
    return tf("ui.daysAgo", "{count}d ago", { count: d });
  }

  function formatStamp(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return tf("ui.refreshedStamp", "Refreshed: {time}", { time: d.toLocaleString() });
  }

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

  function startAgeTimerFromStorage(spanEl, opts = {}) {
    if (!spanEl) return null;
    const resolved = opts || {};
    const timerKey = (typeof resolved.timerKey === "string" && resolved.timerKey) ? resolved.timerKey : null;
    const storageKey = (typeof resolved.storageKey === "string" && resolved.storageKey) ? resolved.storageKey : null;
    const invalidText = (typeof resolved.invalidText === "string") ? resolved.invalidText : "-";
    const intervalMs = (Number.isFinite(resolved.intervalMs) && resolved.intervalMs > 0) ? resolved.intervalMs : 5000;
    const formatter = (typeof resolved.formatter === "function")
      ? resolved.formatter
      : ((ms) => formatAge(ms, { style: "ago", invalidText }));

    if (timerKey && window[timerKey]) {
      window.clearInterval(window[timerKey]);
      window[timerKey] = null;
    }

    if (!storageKey) {
      spanEl.textContent = invalidText;
      return null;
    }

    const tick = () => {
      let ts = null;
      try { ts = Number(storageGetItem(storageKey)); } catch (_) { }
      if (!Number.isFinite(ts) || ts <= 0) {
        spanEl.textContent = invalidText;
        return;
      }
      spanEl.textContent = formatter(Date.now() - ts);
    };

    tick();
    const timerId = window.setInterval(tick, intervalMs);
    if (timerKey) window[timerKey] = timerId;
    return timerId;
  }

  window.DungeonTimeShared = {
    formatAge,
    formatStamp,
    startAgeTimerFromStorage,
  };
})();

