// js/player-input-shared.js
(() => {
  "use strict";
  // Ownership: shared clear-time/combat-buff parsing helpers for landing and related runtime modules.
  // Invariant: keep validation bounds stable (clear time > 0, buff range 0..20).

  function parseClearAndBuff(clearRaw, buffRaw) {
    const ctRaw = String(clearRaw == null ? "" : clearRaw).trim();
    const buffText = String(buffRaw == null ? "" : buffRaw).trim();

    const ctNum = ctRaw === "" ? NaN : Number(ctRaw);
    const buffNum = buffText === "" ? NaN : Number(buffText);

    const ctOk = Number.isFinite(ctNum) && ctNum > 0;
    const buffOk = Number.isFinite(buffNum) && buffNum >= 0 && buffNum <= 20;

    return { ctRaw, buffRaw: buffText, ctNum, buffNum, ctOk, buffOk };
  }

  function parsePositiveMinutes(raw) {
    const text = String(raw == null ? "" : raw).trim();
    const num = text === "" ? NaN : Number(text);
    const ok = Number.isFinite(num) && num > 0;
    return { raw: text, num, ok };
  }

  function clampCombatBuff(raw) {
    const text = String(raw == null ? "" : raw).trim();
    const num = text === "" ? NaN : Number(text);
    const ok = Number.isFinite(num) && num >= 0 && num <= 20;
    return { ok, num: ok ? num : 20 };
  }

  window.DungeonPlayerInputShared = {
    parseClearAndBuff,
    parsePositiveMinutes,
    clampCombatBuff,
  };
})();

