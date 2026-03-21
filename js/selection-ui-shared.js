// js/selection-ui-shared.js
(() => {
  "use strict";
  // Ownership: shared selection-button UI state toggles.
  // Invariant: preserve `is-selected` class and `aria-pressed` semantics.

  function applyPressedSelectionState(items, selectedValue, valueOf) {
    const list = Array.isArray(items) ? items : [];
    const resolver = (typeof valueOf === "function") ? valueOf : (() => undefined);
    for (const el of list) {
      if (!el) continue;
      const is = resolver(el) === selectedValue;
      el.classList.toggle("is-selected", is);
      el.setAttribute("aria-pressed", is ? "true" : "false");
    }
  }

  function shouldClearOnSelectionChange(fromUser, prevValue, nextValue) {
    return !!(fromUser && prevValue && prevValue !== nextValue);
  }

  window.DungeonSelectionUiShared = {
    applyPressedSelectionState,
    shouldClearOnSelectionChange,
  };
})();

