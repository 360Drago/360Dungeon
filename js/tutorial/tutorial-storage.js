// js/tutorial/tutorial-storage.js
(() => {
  "use strict";

  const STORAGE_KEY = "d360.tutorial.v2";
  const VERSION = 2;
  const DEFAULT_CHAPTER_IDS = ["quick_calculator", "advanced", "compare", "keys_tokens"];

  function normalizeChapterIdList(rawList) {
    if (!Array.isArray(rawList) || !rawList.length) return [];
    const seen = new Set();
    const out = [];
    rawList.forEach((id) => {
      const key = String(id || "").trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(key);
    });
    return out;
  }

  function chapterIds() {
    const fromChapters = normalizeChapterIdList(window.DungeonTutorialChapters?.order);
    if (fromChapters.length) return fromChapters;
    return [...DEFAULT_CHAPTER_IDS];
  }

  function chapterDefaults() {
    return {
      started: false,
      completed: false,
      skipped: false,
      lastStep: 0,
      updatedAt: 0,
    };
  }

  function buildDefaultState() {
    const chapters = {};
    for (const id of chapterIds()) chapters[id] = chapterDefaults();
    return {
      version: VERSION,
      skipAll: false,
      activeChapter: "",
      activeStep: 0,
      chapters,
      updatedAt: 0,
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeReadRaw() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function safeWriteRaw(raw) {
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
      return true;
    } catch (_) {
      return false;
    }
  }

  function normalizeChapter(raw) {
    const base = chapterDefaults();
    const src = raw && typeof raw === "object" ? raw : {};
    return {
      started: !!src.started,
      completed: !!src.completed,
      skipped: !!src.skipped,
      lastStep: Number.isFinite(Number(src.lastStep)) ? Math.max(0, Math.floor(Number(src.lastStep))) : 0,
      updatedAt: Number.isFinite(Number(src.updatedAt)) ? Math.max(0, Math.floor(Number(src.updatedAt))) : 0,
    };
  }

  function normalizeState(raw) {
    if (!raw || typeof raw !== "object") return buildDefaultState();
    if (Number(raw.version) !== VERSION) return buildDefaultState();

    const ids = chapterIds();
    const out = buildDefaultState();
    out.skipAll = !!raw.skipAll;
    out.activeChapter = ids.includes(raw.activeChapter) ? raw.activeChapter : "";
    out.activeStep = Number.isFinite(Number(raw.activeStep)) ? Math.max(0, Math.floor(Number(raw.activeStep))) : 0;
    out.updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Math.max(0, Math.floor(Number(raw.updatedAt))) : 0;

    const srcChapters = raw.chapters && typeof raw.chapters === "object" ? raw.chapters : {};
    for (const id of ids) out.chapters[id] = normalizeChapter(srcChapters[id]);
    return out;
  }

  function readState() {
    const raw = safeReadRaw();
    if (!raw) return buildDefaultState();
    try {
      return normalizeState(JSON.parse(raw));
    } catch (_) {
      return buildDefaultState();
    }
  }

  function writeState(nextState) {
    const normalized = normalizeState(nextState);
    normalized.updatedAt = Date.now();
    return safeWriteRaw(JSON.stringify(normalized));
  }

  function mutate(mutator) {
    const prev = readState();
    const draft = clone(prev);
    const maybeNext = typeof mutator === "function" ? mutator(draft) : draft;
    const next = normalizeState(maybeNext && typeof maybeNext === "object" ? maybeNext : draft);
    next.updatedAt = Date.now();
    writeState(next);
    return next;
  }

  function chapterState(state, chapterId) {
    if (!chapterIds().includes(chapterId)) return chapterDefaults();
    const src = state && state.chapters ? state.chapters[chapterId] : null;
    return normalizeChapter(src);
  }

  function isChapterDone(chapterId) {
    const st = readState();
    const cs = chapterState(st, chapterId);
    return !!(cs.completed || cs.skipped);
  }

  function shouldAutoStartChapter(chapterId) {
    const st = readState();
    if (!chapterIds().includes(chapterId)) return false;
    if (st.skipAll) return false;
    const cs = chapterState(st, chapterId);
    return !cs.started && !cs.completed && !cs.skipped;
  }

  function markStarted(chapterId) {
    return mutate((st) => {
      if (!chapterIds().includes(chapterId)) return st;
      const cs = st.chapters[chapterId];
      cs.started = true;
      cs.updatedAt = Date.now();
      return st;
    });
  }

  function markProgress(chapterId, stepIndex) {
    return mutate((st) => {
      if (!chapterIds().includes(chapterId)) return st;
      const cs = st.chapters[chapterId];
      cs.started = true;
      cs.lastStep = Math.max(0, Math.floor(Number(stepIndex) || 0));
      cs.updatedAt = Date.now();
      return st;
    });
  }

  function markCompleted(chapterId) {
    return mutate((st) => {
      if (!chapterIds().includes(chapterId)) return st;
      const cs = st.chapters[chapterId];
      cs.started = true;
      cs.completed = true;
      cs.skipped = false;
      cs.updatedAt = Date.now();
      st.activeChapter = "";
      st.activeStep = 0;
      return st;
    });
  }

  function markSkipped(chapterId) {
    return mutate((st) => {
      if (!chapterIds().includes(chapterId)) return st;
      const cs = st.chapters[chapterId];
      cs.started = true;
      cs.skipped = true;
      cs.updatedAt = Date.now();
      st.activeChapter = "";
      st.activeStep = 0;
      return st;
    });
  }

  function setActive(chapterId, stepIndex) {
    return mutate((st) => {
      if (!chapterIds().includes(chapterId)) return st;
      st.activeChapter = chapterId;
      st.activeStep = Math.max(0, Math.floor(Number(stepIndex) || 0));
      return st;
    });
  }

  function clearActive() {
    return mutate((st) => {
      st.activeChapter = "";
      st.activeStep = 0;
      return st;
    });
  }

  function setSkipAll(skipAll = true) {
    return mutate((st) => {
      st.skipAll = !!skipAll;
      st.activeChapter = "";
      st.activeStep = 0;
      return st;
    });
  }

  function reset() {
    const next = buildDefaultState();
    writeState(next);
    return next;
  }

  function allDone() {
    const st = readState();
    for (const id of chapterIds()) {
      const cs = chapterState(st, id);
      if (!cs.completed && !cs.skipped) return false;
    }
    return true;
  }

  window.DungeonTutorialStorage = {
    key: STORAGE_KEY,
    version: VERSION,
    get chapterIds() { return [...chapterIds()]; },
    read: readState,
    write: writeState,
    reset,
    allDone,
    isChapterDone,
    shouldAutoStartChapter,
    chapterState: (chapterId) => chapterState(readState(), chapterId),
    markStarted,
    markProgress,
    markCompleted,
    markSkipped,
    setActive,
    clearActive,
    setSkipAll,
  };
})();
