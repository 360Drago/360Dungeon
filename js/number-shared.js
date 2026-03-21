// js/number-shared.js
(() => {
  "use strict";
  // Ownership: shared number parse/normalize/compact-format helpers for UI inputs and summaries.
  // Invariant: preserve existing compact-number semantics ("k","m") and output text formatting.

  function parseCompactNumber(input) {
    if (input == null) return null;
    const raw = String(input).trim();
    if (!raw) return null;

    const cleaned = raw
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .toLowerCase();

    const match = cleaned.match(/^(\d+(\.\d+)?)([km])?$/);
    if (!match) return null;

    const base = Number(match[1]);
    if (!Number.isFinite(base)) return null;

    const suffix = match[3] || "";
    const mult = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
    return base * mult;
  }

  function normalizeFoodPerDayInput(input) {
    if (input == null) return "";
    const raw = String(input).trim();
    if (!raw) return "";

    const cleaned = raw
      .replace(/\$/g, "")
      .replace(/\s+/g, "")
      .replace(/,/g, "")
      .toLowerCase();

    const match = cleaned.match(/^(\d+(\.\d+)?)([km])?$/);
    if (!match) return raw;

    const base = Number(match[1]);
    if (!Number.isFinite(base)) return raw;

    const suffix = match[3] || "";
    if (!suffix) {
      // Food/day shorthand:
      // 1..99 defaults to millions; 100..9999 defaults to thousands.
      if (base >= 1 && base <= 99) return `${match[1]}m`;
      if (base >= 100 && base <= 999) return `${match[1]}k`;
      if (base >= 1000 && base <= 9999) return `${match[1]}k`;
    }

    return cleaned;
  }

  function parseFoodPerDay(input) {
    const normalized = normalizeFoodPerDayInput(input);
    return parseCompactNumber(normalized);
  }

  function formatCoinsCompact(v) {
    if (!Number.isFinite(v)) return "-";
    const sign = v < 0 ? "-" : "";
    const n = Math.abs(v);
    const fmt = (num, suffix) => {
      const rounded = Math.round(num * 10) / 10;
      const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
      return `${sign}${str}${suffix}`;
    };
    if (n >= 1_000_000_000) return fmt(n / 1_000_000_000, "b");
    if (n >= 1_000_000) return fmt(n / 1_000_000, "m");
    if (n >= 1_000) return fmt(n / 1_000, "k");
    return `${sign}${Math.round(n).toLocaleString()}`;
  }

  function formatCoinsShort(v, opts = {}) {
    const invalidText = (typeof opts.invalidText === "string") ? opts.invalidText : "-";
    const millionSuffix = (typeof opts.millionSuffix === "string" && opts.millionSuffix) ? opts.millionSuffix : "M";
    const thousandSuffix = (typeof opts.thousandSuffix === "string" && opts.thousandSuffix) ? opts.thousandSuffix : "k";
    if (!Number.isFinite(v)) return invalidText;
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2).replace(/\.00$/, "") + millionSuffix;
    if (v >= 1_000) return (v / 1_000).toFixed(2).replace(/\.00$/, "") + thousandSuffix;
    return Math.floor(v).toLocaleString();
  }

  function formatWholeNumber(v, opts = {}) {
    const invalidText = (typeof opts.invalidText === "string") ? opts.invalidText : "-";
    const mode = (opts.mode === "round") ? "round" : "floor";
    if (!Number.isFinite(v)) return invalidText;
    const rounded = mode === "round" ? Math.round(v) : Math.floor(v);
    return rounded.toLocaleString();
  }

  window.DungeonNumberShared = {
    parseCompactNumber,
    normalizeFoodPerDayInput,
    parseFoodPerDay,
    formatCoinsCompact,
    formatCoinsShort,
    formatWholeNumber,
  };
})();

