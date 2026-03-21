// js/text-shared.js
(() => {
  "use strict";
  // Ownership: shared text helpers for i18n fallback/interpolation and safe HTML/attribute escaping.
  // Invariant: preserve current fallback semantics used by existing runtime modules.

  function interpolateTemplate(template, vars = {}) {
    let out = String(template || "");
    Object.entries(vars || {}).forEach(([name, value]) => {
      out = out.replace(new RegExp(`\\{${String(name)}\\}`, "g"), String(value ?? ""));
    });
    return out;
  }

  function t(key, fallback = "") {
    const fn = window.SiteI18n?.t;
    if (typeof fn === "function") return fn(key, fallback);
    return fallback;
  }

  function tValue(key, fallback = "") {
    const fn = window.SiteI18n?.t;
    const value = (typeof fn === "function") ? fn(key) : "";
    return value || fallback;
  }

  function tf(key, fallback = "", vars = {}) {
    const fn = window.SiteI18n?.tf;
    if (typeof fn === "function") return fn(key, fallback, vars);
    return interpolateTemplate(fallback, vars);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }

  function escapeAttrFull(value) {
    return escapeAttr(value).replace(/'/g, "&#39;");
  }

  window.DungeonTextShared = {
    interpolateTemplate,
    t,
    tValue,
    tf,
    escapeHtml,
    escapeAttr,
    escapeAttrFull,
  };
})();
