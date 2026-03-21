// js/item-hrid-shared.js
(() => {
  "use strict";
  // Ownership: shared /items/* HRID to SVG filename/path conversion helpers.
  // Invariant: preserve current filename convention and null fallback behavior for unknown HRIDs.

  function filenameFromItemHrid(itemHrid) {
    if (typeof itemHrid !== "string") return null;
    const m = itemHrid.match(/^\/items\/([^/]+)$/);
    if (!m) return null;
    const id = m[1];
    return id.length ? (id[0].toUpperCase() + id.slice(1) + ".svg") : null;
  }

  function iconPathFromHrid(itemHrid, basePath = "./assets/Svg/") {
    const file = filenameFromItemHrid(itemHrid);
    if (!file) return null;
    return String(basePath || "./assets/Svg/") + encodeURIComponent(file).replace(/%2F/g, "/");
  }

  window.DungeonItemHridShared = {
    filenameFromItemHrid,
    iconPathFromHrid,
  };
})();

