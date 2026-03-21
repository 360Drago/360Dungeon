// js/tutorial/tutorial-ui.js
(() => {
  "use strict";

  let refs = null;
  let handlers = {};
  let mode = "none"; // none | tour | picker | complete

  function tt(key, fallback = "") {
    return window.DungeonTutorialI18n?.t?.(key, fallback) || fallback;
  }

  function text(el, value) {
    if (!el) return;
    el.textContent = value == null ? "" : String(value);
  }

  function textMultiline(el, value) {
    if (!el) return;
    const str = value == null ? "" : String(value);
    const lines = str.split("\n");
    while (el.firstChild) el.removeChild(el.firstChild);
    lines.forEach((line, idx) => {
      if (idx > 0) el.appendChild(document.createElement("br"));
      el.appendChild(document.createTextNode(line));
    });
  }

  function setImage(el, src, alt) {
    if (!el) return;
    const value = src == null ? "" : String(src).trim();
    if (value) el.src = value;
    else el.removeAttribute("src");
    el.alt = alt == null ? "" : String(alt);
  }

  function clearChildren(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function ensureRefs() {
    if (refs) return refs;

    const layer = document.createElement("div");
    layer.className = "tutorialLayer";
    layer.id = "tutorialLayer";
    layer.hidden = true;

    layer.innerHTML = `
      <div class="tutorialBackdropSlice" data-role="backdrop-top"></div>
      <div class="tutorialBackdropSlice" data-role="backdrop-left"></div>
      <div class="tutorialBackdropSlice" data-role="backdrop-right"></div>
      <div class="tutorialBackdropSlice" data-role="backdrop-bottom"></div>
      <div class="tutorialHighlight" data-role="highlight" hidden></div>
      <section class="tutorialPopup" data-role="popup" role="dialog" aria-modal="true" aria-label="Tutorial guide">
        <div class="tutorialTopRow">
          <div class="tutorialProgress" data-role="progress"></div>
          <button type="button" class="tutorialLinkBtn" data-role="skip-all">Skip all</button>
        </div>
        <div class="tutorialGuideRow">
          <div class="tutorialGuideArtWrap">
            <img class="tutorialGuideArt" data-role="guide-img" alt="" />
          </div>
          <div class="tutorialGuideMeta">
            <p class="tutorialGuideName" data-role="guide-name"></p>
            <h3 class="tutorialTitle" data-role="title"></h3>
          </div>
        </div>
        <p class="tutorialBody" data-role="body"></p>
        <div class="tutorialActions">
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnGhost" data-role="back">Back</button>
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnGhost" data-role="skip">Skip chapter</button>
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnPrimary" data-role="next">Next</button>
        </div>
      </section>
      <section class="tutorialPicker" data-role="picker" role="dialog" aria-modal="true" aria-label="Tutorial chapters" hidden>
        <div class="tutorialPickerTop">
          <h3 class="tutorialPickerTitle" data-role="picker-title">Tutorial Chapters</h3>
          <button type="button" class="tutorialLinkBtn" data-role="picker-close">Close</button>
        </div>
        <p class="tutorialPickerBody" data-role="picker-body">Pick a chapter to start or replay.</p>
        <div class="tutorialPickerList" data-role="picker-list"></div>
        <div class="tutorialPickerActions">
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnGhost" data-role="picker-reset">Reset tutorial progress</button>
        </div>
      </section>
      <section class="tutorialComplete" data-role="complete" role="dialog" aria-modal="true" aria-label="Tutorial chapter complete" hidden>
        <h3 class="tutorialCompleteTitle" data-role="complete-title">Chapter Complete</h3>
        <div class="tutorialCompleteGuideStrip" data-role="complete-strip" hidden></div>
        <p class="tutorialCompleteStripLine" data-role="complete-strip-line" hidden></p>
        <p class="tutorialCompleteBody" data-role="complete-body">Continue to the next chapter now, or explore on your own.</p>
        <div class="tutorialCompleteDialog" data-role="complete-dialog" hidden>
          <article class="tutorialCompleteSpeaker tutorialCompleteSpeakerFrom" data-role="complete-from" hidden>
            <div class="tutorialCompleteGuideArtWrap">
              <img class="tutorialCompleteGuideArt" data-role="complete-from-img" alt="" />
            </div>
            <div class="tutorialCompleteBubble tutorialCompleteBubbleFrom">
              <p class="tutorialCompleteGuideName" data-role="complete-from-name"></p>
              <p class="tutorialCompleteGuideLine" data-role="complete-from-line"></p>
            </div>
          </article>
          <article class="tutorialCompleteSpeaker tutorialCompleteSpeakerTo" data-role="complete-to" hidden>
            <div class="tutorialCompleteBubble tutorialCompleteBubbleTo">
              <p class="tutorialCompleteGuideName" data-role="complete-to-name"></p>
              <p class="tutorialCompleteGuideLine" data-role="complete-to-line"></p>
            </div>
            <div class="tutorialCompleteGuideArtWrap">
              <img class="tutorialCompleteGuideArt" data-role="complete-to-img" alt="" />
            </div>
          </article>
        </div>
        <div class="tutorialCompleteActions">
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnGhost" data-role="complete-chapters">Open chapters</button>
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnGhost" data-role="complete-explore">Explore</button>
          <button type="button" class="ctrlBtn tutorialBtn tutorialBtnPrimary" data-role="complete-continue">Continue to next chapter</button>
        </div>
      </section>
    `;

    document.body.appendChild(layer);

    refs = {
      layer,
      backdropTop: layer.querySelector('[data-role="backdrop-top"]'),
      backdropLeft: layer.querySelector('[data-role="backdrop-left"]'),
      backdropRight: layer.querySelector('[data-role="backdrop-right"]'),
      backdropBottom: layer.querySelector('[data-role="backdrop-bottom"]'),
      highlight: layer.querySelector('[data-role="highlight"]'),
      popup: layer.querySelector('[data-role="popup"]'),
      progress: layer.querySelector('[data-role="progress"]'),
      skipAll: layer.querySelector('[data-role="skip-all"]'),
      guideImg: layer.querySelector('[data-role="guide-img"]'),
      guideName: layer.querySelector('[data-role="guide-name"]'),
      title: layer.querySelector('[data-role="title"]'),
      body: layer.querySelector('[data-role="body"]'),
      backBtn: layer.querySelector('[data-role="back"]'),
      skipBtn: layer.querySelector('[data-role="skip"]'),
      nextBtn: layer.querySelector('[data-role="next"]'),
      picker: layer.querySelector('[data-role="picker"]'),
      pickerTitle: layer.querySelector('[data-role="picker-title"]'),
      pickerBody: layer.querySelector('[data-role="picker-body"]'),
      pickerClose: layer.querySelector('[data-role="picker-close"]'),
      pickerReset: layer.querySelector('[data-role="picker-reset"]'),
      pickerList: layer.querySelector('[data-role="picker-list"]'),
      complete: layer.querySelector('[data-role="complete"]'),
      completeTitle: layer.querySelector('[data-role="complete-title"]'),
      completeStrip: layer.querySelector('[data-role="complete-strip"]'),
      completeStripLine: layer.querySelector('[data-role="complete-strip-line"]'),
      completeBody: layer.querySelector('[data-role="complete-body"]'),
      completeDialog: layer.querySelector('[data-role="complete-dialog"]'),
      completeFrom: layer.querySelector('[data-role="complete-from"]'),
      completeFromImg: layer.querySelector('[data-role="complete-from-img"]'),
      completeFromName: layer.querySelector('[data-role="complete-from-name"]'),
      completeFromLine: layer.querySelector('[data-role="complete-from-line"]'),
      completeTo: layer.querySelector('[data-role="complete-to"]'),
      completeToImg: layer.querySelector('[data-role="complete-to-img"]'),
      completeToName: layer.querySelector('[data-role="complete-to-name"]'),
      completeToLine: layer.querySelector('[data-role="complete-to-line"]'),
      completeContinue: layer.querySelector('[data-role="complete-continue"]'),
      completeExplore: layer.querySelector('[data-role="complete-explore"]'),
      completeChapters: layer.querySelector('[data-role="complete-chapters"]'),
    };

    const onBackdropClick = () => {
      if (mode === "tour" && typeof handlers.onSkip === "function") handlers.onSkip();
      if (mode === "picker" && typeof handlers.onClosePicker === "function") handlers.onClosePicker();
      if (mode === "complete" && typeof handlers.onExplore === "function") handlers.onExplore();
    };
    refs.backdropTop.addEventListener("click", onBackdropClick);
    refs.backdropLeft.addEventListener("click", onBackdropClick);
    refs.backdropRight.addEventListener("click", onBackdropClick);
    refs.backdropBottom.addEventListener("click", onBackdropClick);
    refs.backBtn.addEventListener("click", () => {
      if (typeof handlers.onBack === "function") handlers.onBack();
    });
    refs.skipBtn.addEventListener("click", () => {
      if (typeof handlers.onSkip === "function") handlers.onSkip();
    });
    refs.nextBtn.addEventListener("click", () => {
      if (typeof handlers.onNext === "function") handlers.onNext();
    });
    refs.skipAll.addEventListener("click", () => {
      if (typeof handlers.onSkipAll === "function") handlers.onSkipAll();
    });
    refs.pickerClose.addEventListener("click", () => {
      if (typeof handlers.onClosePicker === "function") handlers.onClosePicker();
    });
    refs.pickerReset.addEventListener("click", () => {
      if (typeof handlers.onResetProgress === "function") handlers.onResetProgress();
    });
    refs.completeContinue.addEventListener("click", () => {
      if (typeof handlers.onContinue === "function") handlers.onContinue();
    });
    refs.completeExplore.addEventListener("click", () => {
      if (typeof handlers.onExplore === "function") handlers.onExplore();
    });
    refs.completeChapters.addEventListener("click", () => {
      if (typeof handlers.onOpenChapters === "function") handlers.onOpenChapters();
    });

    setBackdropFull();
    return refs;
  }

  function setGuide(guide) {
    const r = ensureRefs();
    if (!guide) {
      r.guideImg.removeAttribute("src");
      text(r.guideName, "");
      return;
    }
    r.guideImg.src = guide.assetPath || "";
    r.guideImg.alt = guide.name || "Guide";
    r.popup.style.setProperty("--tutorial-guide-accent", guide.accent || "#60a5fa");
    r.popup.dataset.portraitSide = guide.portraitSideDefault || "left";
    text(r.guideName, guide.name || "Guide");
  }

  function setBackdropFull() {
    const r = ensureRefs();
    const vw = Math.max(0, window.innerWidth || document.documentElement.clientWidth || 0);
    const vh = Math.max(0, window.innerHeight || document.documentElement.clientHeight || 0);

    r.backdropTop.style.left = "0px";
    r.backdropTop.style.top = "0px";
    r.backdropTop.style.width = `${vw}px`;
    r.backdropTop.style.height = `${vh}px`;

    r.backdropLeft.style.width = "0px";
    r.backdropLeft.style.height = "0px";
    r.backdropRight.style.width = "0px";
    r.backdropRight.style.height = "0px";
    r.backdropBottom.style.width = "0px";
    r.backdropBottom.style.height = "0px";
  }

  function setBackdropAroundRect(left, top, width, height) {
    const r = ensureRefs();
    const vw = Math.max(0, window.innerWidth || document.documentElement.clientWidth || 0);
    const vh = Math.max(0, window.innerHeight || document.documentElement.clientHeight || 0);

    const rectLeft = Math.max(0, Math.min(vw, left));
    const rectTop = Math.max(0, Math.min(vh, top));
    const rectRight = Math.max(rectLeft, Math.min(vw, left + width));
    const rectBottom = Math.max(rectTop, Math.min(vh, top + height));
    const rectHeight = Math.max(0, rectBottom - rectTop);

    r.backdropTop.style.left = "0px";
    r.backdropTop.style.top = "0px";
    r.backdropTop.style.width = `${vw}px`;
    r.backdropTop.style.height = `${Math.max(0, rectTop)}px`;

    r.backdropLeft.style.left = "0px";
    r.backdropLeft.style.top = `${rectTop}px`;
    r.backdropLeft.style.width = `${Math.max(0, rectLeft)}px`;
    r.backdropLeft.style.height = `${rectHeight}px`;

    r.backdropRight.style.left = `${rectRight}px`;
    r.backdropRight.style.top = `${rectTop}px`;
    r.backdropRight.style.width = `${Math.max(0, vw - rectRight)}px`;
    r.backdropRight.style.height = `${rectHeight}px`;

    r.backdropBottom.style.left = "0px";
    r.backdropBottom.style.top = `${rectBottom}px`;
    r.backdropBottom.style.width = `${vw}px`;
    r.backdropBottom.style.height = `${Math.max(0, vh - rectBottom)}px`;
  }

  function applyHighlight(targetRect, padding) {
    const r = ensureRefs();
    const pad = Math.max(0, Number(padding) || 10);
    if (!targetRect) {
      r.highlight.hidden = true;
      setBackdropFull();
      return;
    }
    const left = Math.max(2, targetRect.left - pad);
    const top = Math.max(2, targetRect.top - pad);
    const width = Math.max(0, targetRect.width + pad * 2);
    const height = Math.max(0, targetRect.height + pad * 2);

    r.highlight.hidden = false;
    r.highlight.style.left = `${Math.round(left)}px`;
    r.highlight.style.top = `${Math.round(top)}px`;
    r.highlight.style.width = `${Math.round(width)}px`;
    r.highlight.style.height = `${Math.round(height)}px`;
    setBackdropAroundRect(left, top, width, height);
  }

  function placePopup(targetRect, placement) {
    const r = ensureRefs();
    const posApi = window.DungeonTutorialPosition;
    if (!posApi || typeof posApi.compute !== "function") return;

    const popupRect = r.popup.getBoundingClientRect();
    const pos = posApi.compute({
      targetRect,
      popupRect,
      placement: placement || "auto",
      viewportPad: 12,
      gap: 14,
    });
    r.popup.style.left = `${Math.round(pos.left)}px`;
    r.popup.style.top = `${Math.round(pos.top)}px`;
    r.popup.dataset.placement = pos.placement || "center";
  }

  function showTour(payload) {
    const r = ensureRefs();
    handlers = payload?.handlers || {};
    mode = "tour";

    r.layer.hidden = false;
    r.layer.classList.add("is-active");
    r.layer.classList.toggle("allow-target-interaction", !!payload?.allowTargetInteraction);
    r.picker.hidden = true;
    r.complete.hidden = true;
    r.popup.hidden = false;

    setGuide(payload?.guide || null);
    text(r.title, payload?.title || "Tutorial");
    text(r.body, payload?.body || "");
    text(r.progress, payload?.progressText || "");
    text(r.backBtn, payload?.backLabel || "Back");
    text(r.skipBtn, payload?.skipLabel || "Skip chapter");
    text(r.nextBtn, payload?.nextLabel || "Next");
    text(r.skipAll, tt("ui.skipAll", "Skip all"));
    r.backBtn.disabled = !payload?.canBack;

    r.popup.style.visibility = "hidden";
    r.popup.style.left = "-9999px";
    r.popup.style.top = "-9999px";

    window.requestAnimationFrame(() => {
      applyHighlight(payload?.targetRect || null, payload?.highlightPadding);
      placePopup(payload?.targetRect || null, payload?.placement || "auto");
      r.popup.style.visibility = "";
    });
  }

  function updateTourPosition(payload) {
    if (mode !== "tour") return;
    const r = ensureRefs();
    applyHighlight(payload?.targetRect || null, payload?.highlightPadding);
    placePopup(payload?.targetRect || null, payload?.placement || "auto");
  }

  function clearPickerList() {
    const r = ensureRefs();
    while (r.pickerList.firstChild) r.pickerList.removeChild(r.pickerList.firstChild);
  }

  function statusText(status) {
    if (status?.completed) return tt("ui.statusCompleted", "Completed");
    if (status?.skipped) return tt("ui.statusSkipped", "Skipped");
    if (status?.started) return tt("ui.statusInProgress", "In progress");
    return tt("ui.statusNotStarted", "Not started");
  }

  function showPicker(payload) {
    const r = ensureRefs();
    handlers = payload?.handlers || {};
    mode = "picker";

    r.layer.hidden = false;
    r.layer.classList.add("is-active");
    r.layer.classList.remove("allow-target-interaction");
    r.popup.hidden = true;
    r.highlight.hidden = true;
    setBackdropFull();
    r.picker.hidden = false;
    r.complete.hidden = true;
    text(r.pickerTitle, tt("ui.pickerTitle", "Tutorial Chapters"));
    text(r.pickerBody, tt("ui.pickerBody", "Pick a chapter to start or replay."));
    text(r.pickerClose, tt("ui.close", "Close"));
    text(r.pickerReset, tt("ui.resetProgress", "Reset tutorial progress"));

    clearPickerList();
    const list = Array.isArray(payload?.chapters) ? payload.chapters : [];
    for (const item of list) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tutorialChapterBtn";
      const hasGuideArt = !!String(item?.guideAssetPath || "").trim();
      if (!hasGuideArt) btn.classList.add("no-art");
      if (item?.guideAccent) btn.style.setProperty("--tutorial-chapter-accent", item.guideAccent);

      const artWrap = document.createElement("div");
      artWrap.className = "tutorialChapterGuideArtWrap";
      const art = document.createElement("img");
      art.className = "tutorialChapterGuideArt";
      setImage(art, item?.guideAssetPath || "", item?.guideName || "Guide");
      artWrap.hidden = !hasGuideArt;
      artWrap.appendChild(art);

      const content = document.createElement("div");
      content.className = "tutorialChapterContent";
      const title = document.createElement("span");
      title.className = "tutorialChapterTitle";
      title.textContent = item.title || item.id || "Chapter";
      const sub = document.createElement("span");
      sub.className = "tutorialChapterMeta";
      sub.textContent = `${item.guideName || ""} - ${statusText(item.status)}`;
      content.appendChild(title);
      content.appendChild(sub);
      btn.appendChild(artWrap);
      btn.appendChild(content);
      btn.addEventListener("click", () => {
        if (typeof handlers.onStartChapter === "function") handlers.onStartChapter(item.id);
      });
      r.pickerList.appendChild(btn);
    }
  }

  function showCompletion(payload) {
    const r = ensureRefs();
    handlers = payload?.handlers || {};
    mode = "complete";

    r.layer.hidden = false;
    r.layer.classList.add("is-active");
    r.layer.classList.remove("allow-target-interaction");
    r.popup.hidden = true;
    r.picker.hidden = true;
    r.complete.hidden = false;
    r.highlight.hidden = true;
    setBackdropFull();
    const titleText = payload?.title || "Chapter Complete";
    const scene = payload?.scene == null ? "" : String(payload.scene).trim();
    const isFinalScene = scene === "final-team" || /tutorial complete/i.test(String(titleText));
    if (isFinalScene) r.complete.dataset.scene = "final-team";
    else if (scene) r.complete.dataset.scene = scene;
    else delete r.complete.dataset.scene;

    text(r.completeTitle, titleText);
    const stripGuides = Array.isArray(payload?.guideStrip) ? payload.guideStrip.filter(Boolean) : [];
    const fromGuide = payload?.fromGuide || stripGuides[0] || null;
    const toGuide = payload?.toGuide || null;
    const fromLine = payload?.fromLine || "";
    const toLine = payload?.toLine || "";
    const hasStrip = stripGuides.length > 0;
    clearChildren(r.completeStrip);
    r.completeStrip.hidden = !hasStrip;
    if (hasStrip) {
      stripGuides.forEach((guide) => {
        const item = document.createElement("div");
        item.className = "tutorialCompleteStripGuide";
        if (fromGuide?.id && guide?.id && String(fromGuide.id) === String(guide.id)) item.classList.add("is-speaker");
        if (guide?.accent) item.style.setProperty("--tutorial-complete-accent", guide.accent);

        const artWrap = document.createElement("div");
        artWrap.className = "tutorialCompleteStripArtWrap";
        const art = document.createElement("img");
        art.className = "tutorialCompleteStripArt";
        setImage(art, guide?.assetPath || "", guide?.name || "Guide");
        artWrap.appendChild(art);

        const name = document.createElement("p");
        name.className = "tutorialCompleteStripName";
        text(name, guide?.name || "Guide");

        item.appendChild(artWrap);
        item.appendChild(name);
        r.completeStrip.appendChild(item);
      });
    }
    const stripLine = payload?.stripLine || "";
    textMultiline(r.completeStripLine, stripLine);
    const hasStripLine = hasStrip && String(stripLine).trim().length > 0;
    r.completeStripLine.hidden = !hasStripLine || isFinalScene;

    textMultiline(r.completeBody, payload?.body || "Continue to the next chapter now, or explore on your own.");
    r.completeBody.hidden = String(payload?.body || "").trim().length < 1;
    const hasFrom = !!fromGuide && String(fromLine).trim().length > 0;
    const hasTo = !isFinalScene && !!toGuide && String(toLine).trim().length > 0;
    r.completeDialog.hidden = !(hasFrom || hasTo);

    r.completeFrom.hidden = !hasFrom;
    if (hasFrom) {
      r.completeFrom.style.setProperty("--tutorial-complete-accent", fromGuide.accent || "#60a5fa");
      setImage(r.completeFromImg, fromGuide.assetPath || "", fromGuide.name || "Guide");
      text(r.completeFromName, fromGuide.name || "Guide");
      textMultiline(r.completeFromLine, fromLine);
    } else {
      r.completeFrom.style.removeProperty("--tutorial-complete-accent");
      setImage(r.completeFromImg, "", "");
      text(r.completeFromName, "");
      text(r.completeFromLine, "");
    }

    r.completeTo.hidden = !hasTo;
    if (hasTo) {
      r.completeTo.style.setProperty("--tutorial-complete-accent", toGuide.accent || "#60a5fa");
      setImage(r.completeToImg, toGuide.assetPath || "", toGuide.name || "Guide");
      text(r.completeToName, toGuide.name || "Guide");
      textMultiline(r.completeToLine, toLine);
    } else {
      r.completeTo.style.removeProperty("--tutorial-complete-accent");
      setImage(r.completeToImg, "", "");
      text(r.completeToName, "");
      text(r.completeToLine, "");
    }

    text(r.completeContinue, payload?.continueLabel || tt("ui.continueNextChapter", "Continue to next chapter"));
    text(r.completeExplore, tt("ui.explore", "Explore"));
    text(r.completeChapters, tt("ui.openChapters", "Open chapters"));
    const showContinue = isFinalScene ? false : !!payload?.showContinue;
    const showExplore = isFinalScene ? true : payload?.showExplore !== false;
    const showChapters = isFinalScene ? false : payload?.showChapters !== false;
    r.completeContinue.hidden = !showContinue;
    r.completeExplore.hidden = !showExplore;
    r.completeChapters.hidden = !showChapters;
  }

  function hideAll() {
    const r = ensureRefs();
    mode = "none";
    handlers = {};
    r.layer.classList.remove("is-active");
    r.layer.classList.remove("allow-target-interaction");
    r.layer.hidden = true;
    r.popup.hidden = false;
    r.picker.hidden = true;
    r.complete.hidden = true;
    delete r.complete.dataset.scene;
    r.highlight.hidden = true;
    setBackdropFull();
  }

  function isVisible() {
    const r = ensureRefs();
    return !r.layer.hidden;
  }

  function currentMode() {
    return mode;
  }

  window.DungeonTutorialUI = {
    showTour,
    updateTourPosition,
    showPicker,
    showCompletion,
    hideAll,
    isVisible,
    currentMode,
  };
})();
