// js/market-shared.js
// Shared market fetch/parse helpers used across UI modules.
(() => {
  "use strict";
  // Ownership: shared marketplace fetch + ask/bid extraction helpers.
  // Invariant: preserve existing timeout, proxy-fallback, and return-shape semantics.

  if (window.DungeonMarketShared) return;

  function corsProxyUrl(url) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }

  async function fetchJsonWithTimeout(url, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      window.clearTimeout(t);
    }
  }

  async function fetchWithProxyFallback(url, timeoutMs = 12000) {
    try {
      const json = await fetchJsonWithTimeout(url, timeoutMs);
      return { json, usedProxy: false };
    } catch (_) {
      const json = await fetchJsonWithTimeout(corsProxyUrl(url), timeoutMs);
      return { json, usedProxy: true };
    }
  }

  function normalizeAskBidQuote(entry) {
    const askRaw = entry?.a ?? entry?.ask ?? null;
    const bidRaw = entry?.b ?? entry?.bid ?? null;
    const ask = Number(askRaw);
    const bid = Number(bidRaw);
    return {
      ask: Number.isFinite(ask) ? ask : null,
      bid: Number.isFinite(bid) ? bid : null,
    };
  }

  function extractAskBidFromMarketJson(json, hrid) {
    const q0 =
      json?.marketData?.[hrid]?.["0"] ??
      json?.marketData?.[hrid]?.[0] ??
      json?.[hrid]?.["0"] ??
      json?.[hrid]?.[0] ??
      null;
    return normalizeAskBidQuote(q0);
  }

  function extractAskBidFromMarketSlim(marketSlim, hrid) {
    if (!marketSlim || !hrid) return { ask: null, bid: null };
    const rec = marketSlim[hrid];
    const entry = (rec && (rec["0"] || rec[0] || rec)) || null;
    return normalizeAskBidQuote(entry);
  }

  window.DungeonMarketShared = {
    corsProxyUrl,
    fetchJsonWithTimeout,
    fetchWithProxyFallback,
    normalizeAskBidQuote,
    extractAskBidFromMarketJson,
    extractAskBidFromMarketSlim,
  };
})();

