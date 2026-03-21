// js/init-data-shared.js
(() => {
  "use strict";
  // Ownership: canonical shared init-data accessor for runtime modules.
  // Invariant: prefer in-memory InitCharacterData, then delegate to InitLoader without reshaping data.

  async function getInitData() {
    if (window.InitCharacterData) return window.InitCharacterData;
    if (window.InitLoader && typeof window.InitLoader.loadInitData === "function") {
      return await window.InitLoader.loadInitData();
    }
    return null;
  }

  window.DungeonInitDataShared = {
    getInitData,
  };
})();

