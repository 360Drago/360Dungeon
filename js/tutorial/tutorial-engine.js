// js/tutorial/tutorial-engine.js
(() => {
  "use strict";

  const state = {
    active: false,
    pickerOpen: false,
    completionOpen: false,
    completionNextChapterId: "",
    completionCompletedChapterId: "",
    completionTerminal: false,
    chapterId: "",
    stepIndex: 0,
    replayMode: false,
    currentTarget: null,
    repositionRaf: 0,
    repositionBound: false,
    bodyClassObserver: null,
  };

  function storage() {
    return window.DungeonTutorialStorage || null;
  }

  function guides() {
    return window.DungeonTutorialGuides || null;
  }

  function chaptersApi() {
    return window.DungeonTutorialChapters || null;
  }

  function ui() {
    return window.DungeonTutorialUI || null;
  }

  function tt(key, fallback = "") {
    return window.DungeonTutorialI18n?.t?.(key, fallback) || fallback;
  }

  function tf(key, fallback = "", vars = {}) {
    return window.DungeonTutorialI18n?.tf?.(key, fallback, vars) || fallback;
  }

  function safeChapter(id) {
    const api = chaptersApi();
    if (!api || typeof api.get !== "function") return null;
    return api.get(id);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function prefersReducedMotion() {
    try {
      return !!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (_) {
      return false;
    }
  }

  function normalizeSelector(value) {
    if (typeof value !== "string") return "";
    return value.trim();
  }

  function getElementFromTargetDef(targetDef) {
    if (!targetDef) return null;
    if (targetDef instanceof Element) return targetDef;
    if (typeof targetDef === "function") {
      try {
        const out = targetDef();
        return getElementFromTargetDef(out);
      } catch (_) {
        return null;
      }
    }
    if (Array.isArray(targetDef)) {
      for (const item of targetDef) {
        const el = getElementFromTargetDef(item);
        if (el) return el;
      }
      return null;
    }
    const sel = normalizeSelector(targetDef);
    if (!sel) return null;
    try {
      return document.querySelector(sel);
    } catch (_) {
      return null;
    }
  }

  function isElementVisible(el) {
    if (!(el instanceof Element)) return false;
    if (el.hidden) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    const style = window.getComputedStyle(el);
    if (!style) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (Number(style.opacity) <= 0.03) return false;
    return true;
  }

  function resolveVisibleTarget(step) {
    const target = getElementFromTargetDef(step?.target);
    if (!target) return null;
    return isElementVisible(target) ? target : null;
  }

  function safeQuery(selector) {
    const sel = normalizeSelector(selector);
    if (!sel) return null;
    try {
      return document.querySelector(sel);
    } catch (_) {
      return null;
    }
  }

  function dispatchInputChange(inputEl) {
    if (!inputEl) return;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function runEnsureAction(action) {
    if (!action || typeof action !== "object") return;
    const type = String(action.type || "").trim().toLowerCase();

    if (type === "wait") {
      await wait(Math.max(0, Number(action.ms) || 80));
      return;
    }

    if (type === "toggle") {
      const input = safeQuery(action.selector);
      if (input && "checked" in input) {
        const targetChecked = !!action.checked;
        if (input.checked !== targetChecked) {
          input.checked = targetChecked;
          dispatchInputChange(input);
          await wait(90);
        }
      }
      return;
    }

    if (type === "click") {
      const el = safeQuery(action.selector);
      if (el && typeof el.click === "function") {
        el.click();
        await wait(90);
      }
      return;
    }

    if (type === "expand") {
      const el = safeQuery(action.selector);
      if (
        el &&
        el.getAttribute("aria-expanded") === "false" &&
        typeof el.click === "function"
      ) {
        el.click();
        await wait(120);
      }
      return;
    }

    if (type === "selectdungeon") {
      const selector = action.selector || '.card[data-dungeon="chimerical_den"]';
      const el = safeQuery(selector);
      if (el && el.getAttribute("aria-pressed") !== "true" && typeof el.click === "function") {
        el.click();
        await wait(120);
      }
      return;
    }

    if (type === "selecttier") {
      const selector = action.selector || '.tierBtn[data-tier="T1"]';
      const el = safeQuery(selector);
      if (el && el.getAttribute("aria-pressed") !== "true" && typeof el.click === "function") {
        el.click();
        await wait(120);
      }
    }
  }

  async function runStepEnsures(step) {
    const ensure = Array.isArray(step?.ensure) ? step.ensure : [];
    for (const action of ensure) {
      await runEnsureAction(action);
    }
  }

  function currentChapter() {
    return safeChapter(state.chapterId);
  }

  function currentStep() {
    const chapter = currentChapter();
    if (!chapter || !Array.isArray(chapter.steps)) return null;
    if (state.stepIndex < 0 || state.stepIndex >= chapter.steps.length) return null;
    return chapter.steps[state.stepIndex];
  }

  function getGuideForStep(chapter, step) {
    const api = guides();
    if (!api || typeof api.get !== "function") return null;
    const guideId = step?.guideId || chapter?.guideId || "novice";
    return api.get(guideId);
  }

  function progressText(index, total) {
    return tf("ui.progressStepOf", "Step {step} of {total}", {
      step: index + 1,
      total,
    });
  }

  function scheduleReposition() {
    if (!state.active || state.pickerOpen) return;
    if (state.repositionRaf) window.cancelAnimationFrame(state.repositionRaf);
    state.repositionRaf = window.requestAnimationFrame(() => {
      state.repositionRaf = 0;
      refreshPosition();
    });
  }

  function refreshPosition() {
    if (!state.active || state.pickerOpen) return;
    const step = currentStep();
    if (!step) return;
    const target = resolveVisibleTarget(step);
    state.currentTarget = target;
    const uiApi = ui();
    if (!uiApi) return;
    uiApi.updateTourPosition({
      targetRect: target ? target.getBoundingClientRect() : null,
      placement: step.placement || "auto",
      highlightPadding: Number(step.highlightPadding) || 10,
    });
  }

  function bindReposition() {
    if (state.repositionBound) return;
    state.repositionBound = true;
    window.addEventListener("resize", scheduleReposition, { passive: true });
    window.addEventListener("orientationchange", scheduleReposition, { passive: true });
    window.addEventListener("scroll", scheduleReposition, { passive: true, capture: true });
    document.addEventListener("dungeon:selection-changed", scheduleReposition);
    if (typeof MutationObserver === "function") {
      state.bodyClassObserver = new MutationObserver(() => scheduleReposition());
      state.bodyClassObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }

  function unbindReposition() {
    if (!state.repositionBound) return;
    state.repositionBound = false;
    window.removeEventListener("resize", scheduleReposition);
    window.removeEventListener("orientationchange", scheduleReposition);
    window.removeEventListener("scroll", scheduleReposition, true);
    document.removeEventListener("dungeon:selection-changed", scheduleReposition);
    if (state.bodyClassObserver) {
      state.bodyClassObserver.disconnect();
      state.bodyClassObserver = null;
    }
    if (state.repositionRaf) {
      window.cancelAnimationFrame(state.repositionRaf);
      state.repositionRaf = 0;
    }
  }

  function closeTourUiOnly() {
    const uiApi = ui();
    if (uiApi && typeof uiApi.hideAll === "function") uiApi.hideAll();
    state.currentTarget = null;
  }

  function closeActiveTour() {
    state.active = false;
    state.pickerOpen = false;
    state.completionOpen = false;
    state.completionNextChapterId = "";
    state.completionCompletedChapterId = "";
    state.completionTerminal = false;
    state.chapterId = "";
    state.stepIndex = 0;
    state.replayMode = false;
    unbindReposition();
    closeTourUiOnly();
    const store = storage();
    if (store && typeof store.clearActive === "function") store.clearActive();
  }

  async function renderCurrentStep() {
    if (!state.active || state.pickerOpen) return;
    const chapter = currentChapter();
    const step = currentStep();
    const uiApi = ui();
    const store = storage();
    if (!chapter || !step || !uiApi || !store) {
      closeActiveTour();
      return;
    }

    await runStepEnsures(step);

    let target = resolveVisibleTarget(step);
    if (target) {
      try {
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      } catch (_) {}
      await wait(prefersReducedMotion() ? 0 : 140);
      target = resolveVisibleTarget(step) || target;
    }
    state.currentTarget = target;

    store.markProgress(state.chapterId, state.stepIndex);
    store.setActive(state.chapterId, state.stepIndex);

    const total = Array.isArray(chapter.steps) ? chapter.steps.length : 0;
    const isLast = state.stepIndex >= total - 1;

    uiApi.showTour({
      guide: getGuideForStep(chapter, step),
      title: step.title || chapter.title || "Tutorial",
      body: step.body || "",
      progressText: progressText(state.stepIndex, total),
      canBack: state.stepIndex > 0,
      backLabel: tt("ui.back", "Back"),
      skipLabel: tt("ui.skipChapter", "Skip chapter"),
      nextLabel: isLast ? tt("ui.done", "Done") : tt("ui.next", "Next"),
      placement: step.placement || "auto",
      targetRect: target ? target.getBoundingClientRect() : null,
      highlightPadding: Number(step.highlightPadding) || 10,
      allowTargetInteraction: !!step.allowTargetInteraction,
      handlers: {
        onBack: prevStep,
        onNext: nextStep,
        onSkip: () => skipChapter(),
        onSkipAll: skipAll,
      },
    });

    bindReposition();
  }

  function nextStep() {
    if (!state.active) return;
    const chapter = currentChapter();
    if (!chapter || !Array.isArray(chapter.steps)) {
      closeActiveTour();
      return;
    }
    if (state.stepIndex >= chapter.steps.length - 1) {
      finishChapter();
      return;
    }
    state.stepIndex += 1;
    void renderCurrentStep();
  }

  function prevStep() {
    if (!state.active) return;
    if (state.stepIndex <= 0) return;
    state.stepIndex -= 1;
    void renderCurrentStep();
  }

  function findNextChapterId(afterChapterId, storeState) {
    const api = chaptersApi();
    if (!api || !Array.isArray(api.order)) return "";
    const order = api.order;
    const idx = order.indexOf(afterChapterId);
    if (idx < 0) return "";
    for (let i = idx + 1; i < order.length; i += 1) {
      const id = order[i];
      const cs = storeState?.chapters?.[id];
      if (!cs || (!cs.completed && !cs.skipped)) return id;
    }
    return "";
  }

  function closeCompletionPrompt() {
    state.completionOpen = false;
    state.completionNextChapterId = "";
    state.completionCompletedChapterId = "";
    state.completionTerminal = false;
    const uiApi = ui();
    if (uiApi && typeof uiApi.hideAll === "function") uiApi.hideAll();
  }

  async function goToLandingView() {
    const adv = safeQuery("#advMode");
    if (adv && "checked" in adv && adv.checked) {
      adv.checked = false;
      dispatchInputChange(adv);
      await wait(90);
    }

    const inlineToggleSelectors = ["#zoneCompareToggle", "#tokenShopToggle", "#keysToggle"];
    for (const selector of inlineToggleSelectors) {
      const input = safeQuery(selector);
      if (input && "checked" in input && input.checked) {
        input.checked = false;
        dispatchInputChange(input);
        await wait(50);
      }
    }

    const resetBtn = safeQuery("#resetBtn");
    if (resetBtn && typeof resetBtn.click === "function") {
      resetBtn.click();
    }

    try {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    } catch (_) {
      try { window.scrollTo(0, 0); } catch (_) {}
    }
  }

  function continueFromCompletion() {
    if (!state.completionOpen) return;
    const nextChapterId = state.completionNextChapterId || "";
    closeCompletionPrompt();
    if (nextChapterId) {
      startChapter(nextChapterId, { force: true, replay: false, startStep: 0 });
    }
  }

  function exploreFromCompletion() {
    if (!state.completionOpen) return;
    const shouldGoLanding = !!state.completionTerminal;
    closeCompletionPrompt();
    if (shouldGoLanding) void goToLandingView();
  }

  function openCompletionPrompt(completedChapterId, nextChapterId) {
    const uiApi = ui();
    const api = chaptersApi();
    const guideApi = guides();
    if (!uiApi || !api || typeof uiApi.showCompletion !== "function") return;

    const completedTitle = api.get(completedChapterId)?.title || "Current chapter";
    const completedGuide = guideApi && api.get(completedChapterId)
      ? guideApi.get(api.get(completedChapterId).guideId || "novice")
      : null;
    const nextChapter = nextChapterId ? api.get(nextChapterId) : null;
    const nextGuide = guideApi && nextChapter ? guideApi.get(nextChapter.guideId || "novice") : null;
    const handoffLine = completedGuide?.handoff?.[nextChapterId] || "";
    const nextIntroLine = nextGuide?.intro || "";
    const continueLabel = nextChapter
      ? tf(
          "ui.continueGuide",
          "Continue: {name}",
          { name: nextGuide ? nextGuide.name : nextChapter.title }
        )
      : "";

    let body = tt(
      "completion.allDoneBody",
      "You have completed all tutorial chapters. You can explore freely or reopen chapters any time."
    );
    let fromLine = "";
    let toLine = "";
    let guideStrip = [];
    let stripLine = "";
    let scene = "";
    let fromGuide = completedGuide;
    let showExplore = true;
    let showChapters = true;
    if (nextChapter) {
      body = tf(
        "completion.chapterDoneBody",
        "{chapter} is complete. Continue to the next chapter now, or explore on your own.",
        { chapter: completedTitle }
      );
      if (handoffLine) {
        fromLine = handoffLine;
      } else if (nextGuide) {
        fromLine = tf("completion.nextUpName", "Next up is {name}.", { name: nextGuide.name });
      } else {
        fromLine = tt("completion.readyNext", "We are ready for the next chapter.");
      }

      if (nextIntroLine) toLine = nextIntroLine;
      else if (nextGuide) {
        toLine = tf("completion.guideThrough", "I will guide you through {chapter}.", {
          chapter: nextChapter.title,
        });
      }
    } else if (guideApi) {
      body = "";
      scene = "final-team";
      guideStrip = ["novice", "ice", "flame", "elementalist"]
        .map((id) => guideApi?.get?.(id))
        .filter((g) => !!g);
      fromGuide = guideApi.get("novice");
      fromLine = tt(
        "completion.finalFromLine",
        "Thanks for listening to all we have to share. If you ever need a refresher course, you can click the Guide in the top left. We hope to have a few more friends share their tips and tools with you soon. Good luck with your dungeons!"
      );
      toLine = "";
      stripLine = "";
      showChapters = false;
    }

    state.completionOpen = true;
    state.completionNextChapterId = nextChapterId || "";
    state.completionCompletedChapterId = completedChapterId || "";
    state.completionTerminal = !nextChapter;
    uiApi.showCompletion({
      title: nextChapter ? tt("ui.chapterComplete", "Chapter Complete") : tt("ui.tutorialComplete", "Tutorial Complete"),
      body,
      fromGuide,
      fromLine,
      toGuide: nextGuide,
      toLine,
      guideStrip,
      stripLine,
      scene,
      continueLabel,
      showContinue: !!nextChapter,
      showExplore,
      showChapters,
      handlers: {
        onContinue: continueFromCompletion,
        onExplore: exploreFromCompletion,
        onOpenChapters: () => {
          closeCompletionPrompt();
          openPicker();
        },
      },
    });
  }

  function finishChapter() {
    if (!state.active) return;
    const chapterId = state.chapterId;
    const replayMode = state.replayMode;
    const store = storage();
    closeActiveTour();
    if (!store) return;
    if (replayMode) return;

    store.markCompleted(chapterId);
    const st = store.read();
    const nextChapterId = findNextChapterId(chapterId, st);
    openCompletionPrompt(chapterId, nextChapterId);
  }

  function skipChapter() {
    if (!state.active) return;
    const chapterId = state.chapterId;
    const replayMode = state.replayMode;
    const store = storage();
    closeActiveTour();
    if (!store) return;
    if (!replayMode) store.markSkipped(chapterId);
  }

  function skipAll() {
    const store = storage();
    if (store && typeof store.setSkipAll === "function") store.setSkipAll(true);
    closeActiveTour();
  }

  function shouldStartAtDefaultLanding(chapterId, stepIndex) {
    if (String(chapterId || "") !== "quick_calculator") return false;
    return Number(stepIndex) <= 0;
  }

  function startChapter(chapterId, opts = {}) {
    const chapter = safeChapter(chapterId);
    const store = storage();
    const uiApi = ui();
    if (!chapter || !store || !uiApi) return false;

    const force = !!opts.force;
    const replay = !!opts.replay;
    const startStep = Math.max(0, Number(opts.startStep) || 0);
    const currentState = store.read();
    const chapterState = currentState?.chapters?.[chapterId] || {};

    if (!force) {
      if (currentState?.skipAll) return false;
      if (chapterState.completed || chapterState.skipped) return false;
    }

    if (state.active) closeActiveTour();
    if (state.completionOpen) closeCompletionPrompt();
    if (state.pickerOpen) {
      state.pickerOpen = false;
      uiApi.hideAll();
    }

    store.markStarted(chapterId);
    store.setActive(chapterId, startStep);

    const normalizedStartStep = Math.min(startStep, Math.max(0, chapter.steps.length - 1));
    state.active = true;
    state.pickerOpen = false;
    state.chapterId = chapterId;
    state.stepIndex = normalizedStartStep;
    state.replayMode = replay;

    if (shouldStartAtDefaultLanding(chapterId, normalizedStartStep)) {
      void (async () => {
        await goToLandingView();
        if (!state.active) return;
        if (state.chapterId !== chapterId) return;
        if (state.stepIndex !== normalizedStartStep) return;
        void renderCurrentStep();
      })();
      return true;
    }

    void renderCurrentStep();
    return true;
  }

  function closePicker() {
    state.pickerOpen = false;
    const uiApi = ui();
    if (uiApi && typeof uiApi.hideAll === "function") uiApi.hideAll();
  }

  function resetProgressAndStartQuick() {
    const store = storage();
    if (!store) return null;
    closeActiveTour();
    const nextState = store.reset();
    startChapter("quick_calculator", { force: true, replay: false, startStep: 0 });
    return nextState;
  }

  function chapterPickerItems() {
    const api = chaptersApi();
    const guideApi = guides();
    const store = storage();
    if (!api || !guideApi || !store) return [];
    const st = store.read();
    return api.order.map((id) => {
      const chapter = api.get(id);
      const guide = guideApi.get(chapter?.guideId || "novice");
      return {
        id,
        title: chapter?.title || id,
        guideName: guide?.name || "Guide",
        guideAssetPath: guide?.assetPath || "",
        guideAccent: guide?.accent || "",
        status: st?.chapters?.[id] || null,
      };
    });
  }

  function openPicker() {
    if (state.active) return;
    if (state.completionOpen) closeCompletionPrompt();
    const uiApi = ui();
    const store = storage();
    if (!uiApi || !store) return;

    state.pickerOpen = true;
    uiApi.showPicker({
      chapters: chapterPickerItems(),
      handlers: {
        onStartChapter: (chapterId) => {
          state.pickerOpen = false;
          startChapter(chapterId, { force: true, replay: false, startStep: 0 });
        },
        onClosePicker: closePicker,
        onResetProgress: () => {
          closePicker();
          resetProgressAndStartQuick();
        },
      },
    });
  }

  function startFromLauncher() {
    const store = storage();
    if (!store) return;
    const st = store.read();
    const activeChapterId = st?.activeChapter || "";
    const activeStep = Math.max(0, Number(st?.activeStep) || 0);
    const activeState = activeChapterId ? st?.chapters?.[activeChapterId] : null;
    if (
      activeChapterId &&
      !st?.skipAll &&
      activeState &&
      !activeState.completed &&
      !activeState.skipped
    ) {
      startChapter(activeChapterId, { force: true, replay: false, startStep: activeStep });
      return;
    }

    if (!st?.skipAll && store.shouldAutoStartChapter("quick_calculator")) {
      startChapter("quick_calculator");
      return;
    }

    openPicker();
  }

  function bindKeyboard() {
    document.addEventListener("keydown", (evt) => {
      const uiApi = ui();
      if (!uiApi || !uiApi.isVisible()) return;

      if (evt.key === "Escape") {
        evt.preventDefault();
        if (state.active) {
          skipChapter();
          return;
        }
        if (state.pickerOpen) {
          closePicker();
          return;
        }
        if (state.completionOpen) {
          closeCompletionPrompt();
        }
        return;
      }

      if (state.completionOpen) {
        if (evt.key === "Enter" || evt.key === "ArrowRight") {
          evt.preventDefault();
          if (state.completionTerminal) exploreFromCompletion();
          else continueFromCompletion();
        }
        return;
      }
      if (!state.active) return;
      if (evt.key === "Enter" || evt.key === "ArrowRight") {
        evt.preventDefault();
        nextStep();
        return;
      }
      if (evt.key === "ArrowLeft") {
        evt.preventDefault();
        prevStep();
      }
    });
  }

  function handleLanguageChanged() {
    if (state.active) {
      void renderCurrentStep();
      return;
    }
    if (state.pickerOpen) {
      openPicker();
      return;
    }
    if (state.completionOpen) {
      openCompletionPrompt(state.completionCompletedChapterId, state.completionNextChapterId);
    }
  }

  function init() {
    if (!storage() || !chaptersApi() || !guides() || !ui()) return false;
    bindKeyboard();
    document.addEventListener("site:lang-changed", handleLanguageChanged);
    return true;
  }

  window.DungeonTutorial = {
    init,
    startChapter,
    startFromLauncher,
    openPicker,
    skipAll,
    resetProgress: resetProgressAndStartQuick,
    getState: () => (storage() ? storage().read() : null),
  };
})();
