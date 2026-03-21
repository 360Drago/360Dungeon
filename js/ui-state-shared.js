// js/ui-state-shared.js
(() => {
  "use strict";
  // Ownership: shared UI state helpers for body stage classes and accordion/panel visibility state.
  // Invariant: preserve existing CSS class and aria-expanded semantics for panel toggles.

  function setBodyStage(stageDungeon, stageTier) {
    if (!document.body) return;
    document.body.classList.toggle("stage-dungeon", !!stageDungeon);
    document.body.classList.toggle("stage-tier", !!stageTier);
  }

  function isPanelOpen(panelEl) {
    return !!(panelEl && panelEl.classList.contains("is-open"));
  }

  function setPanelOpen(panelEl, open) {
    if (!panelEl) return;
    const isOpen = !!open;
    panelEl.classList.toggle("is-open", isOpen);
    const toggle = panelEl.querySelector(".panelToggle");
    if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  function hideAndClear(el) {
    if (!el) return;
    el.hidden = true;
    el.innerHTML = "";
  }

  window.DungeonUiStateShared = {
    setBodyStage,
    isPanelOpen,
    setPanelOpen,
    hideAndClear,
  };
})();

