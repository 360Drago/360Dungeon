// js/dungeon-meta-shared.js
(() => {
  "use strict";
  // Ownership: shared dungeon uiKey metadata helpers.
  // Invariant: preserve current uiKey->short/name mappings and unknown-key fallbacks.

  const UI_TO_SHORT = {
    chimerical_den: "chimerical",
    sinister_circus: "sinister",
    enchanted_fortress: "enchanted",
    pirate_cove: "pirate",
  };

  const UI_TO_NAME = {
    chimerical_den: "Chimerical Den",
    sinister_circus: "Sinister Circus",
    enchanted_fortress: "Enchanted Fortress",
    pirate_cove: "Pirate Cove",
  };

  function shortForUiKey(uiKey) {
    return UI_TO_SHORT[uiKey] || null;
  }

  function shortForUiOrSelf(uiKey) {
    return UI_TO_SHORT[uiKey] || uiKey;
  }

  function displayNameForUiKey(uiKey) {
    return UI_TO_NAME[uiKey] || uiKey;
  }

  function marketHridsForUiKey(uiKey) {
    const short = shortForUiKey(uiKey);
    if (!short) return null;
    return {
      entry: `/items/${short}_entry_key`,
      chestKey: `/items/${short}_chest_key`,
    };
  }

  window.DungeonMetaShared = {
    shortForUiKey,
    shortForUiOrSelf,
    displayNameForUiKey,
    marketHridsForUiKey,
  };
})();

