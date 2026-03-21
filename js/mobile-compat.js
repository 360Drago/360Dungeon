// js/mobile-compat.js
(() => {
  "use strict";

  const ROOT = document.documentElement;
  const MQ_NARROW = window.matchMedia("(max-width: 1024px)");
  const MQ_COARSE = window.matchMedia("(pointer: coarse)");
  const VISUAL_VIEWPORT = window.visualViewport || null;
  let rafId = 0;
  let controlsObserver = null;
  const observedControlNodes = new WeakSet();

  function setRootVar(name, value) {
    if (value == null || value === "") {
      ROOT.style.removeProperty(name);
      return;
    }
    ROOT.style.setProperty(name, value);
  }

  function readViewportWidth() {
    const cw = ROOT.clientWidth;
    const iw = window.innerWidth;
    const vv = VISUAL_VIEWPORT?.width;
    return Math.max(280, Math.floor(cw || iw || vv || 360));
  }

  function edgePadForWidth(viewportWidth) {
    if (viewportWidth <= 360) return 14;
    if (viewportWidth <= 430) return 16;
    if (viewportWidth <= 540) return 18;
    if (viewportWidth <= 900) return 20;
    return 22;
  }

  function visibleElementHeight(el) {
    if (!el || el.hidden) return 0;
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return 0;
    return Math.ceil(rect.height);
  }

  function visibleElementWidth(el) {
    if (!el || el.hidden) return 0;
    const rect = el.getBoundingClientRect();
    if (!rect || rect.width < 1 || rect.height < 1) return 0;
    return Math.ceil(rect.width);
  }

  function visibleTopRowWidth(el, rowTolerancePx = 6) {
    if (!el || el.hidden) return 0;
    const children = Array.from(el.children || []);
    if (!children.length) return visibleElementWidth(el);

    const rects = children
      .map((child) => child?.getBoundingClientRect?.())
      .filter((r) => !!r && r.width > 1 && r.height > 1);
    if (!rects.length) return visibleElementWidth(el);

    const minTop = Math.min(...rects.map((r) => r.top));
    const topRow = rects.filter((r) => Math.abs(r.top - minTop) <= rowTolerancePx);
    if (!topRow.length) return visibleElementWidth(el);

    const left = Math.min(...topRow.map((r) => r.left));
    const right = Math.max(...topRow.map((r) => r.right));
    return Math.ceil(Math.max(0, right - left));
  }

  function readRootVarPx(name) {
    const raw = window.getComputedStyle(ROOT).getPropertyValue(name);
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function attachControlsObserver() {
    if (typeof ResizeObserver !== "function") return;
    if (!controlsObserver) {
      controlsObserver = new ResizeObserver(() => {
        scheduleMobileLayoutMetrics();
      });
    }
    const controls = document.getElementById("siteControls");
    const launcher = document.getElementById("tutorialLauncherRow");
    [controls, launcher].forEach((node) => {
      if (!node || observedControlNodes.has(node)) return;
      controlsObserver.observe(node);
      observedControlNodes.add(node);
    });
  }

  function applyMobileLayoutMetrics() {
    if (!ROOT.classList.contains("mobile-compat")) {
      ROOT.classList.remove("mobile-compat-tight");
      ROOT.classList.remove("mobile-compat-xs");
      setRootVar("--mobile-site-controls-h", "");
      setRootVar("--mobile-top-overlay-h", "");
      setRootVar("--mobile-launcher-offset-y", "");
      setRootVar("--mobile-launcher-top-max-w", "");
      setRootVar("--mobile-viewport-w", "");
      setRootVar("--mobile-edge-pad", "");
      return;
    }

    const viewportWidth = readViewportWidth();
    const edgePad = edgePadForWidth(viewportWidth);
    setRootVar("--mobile-viewport-w", `${viewportWidth}px`);
    setRootVar("--mobile-edge-pad", `${edgePad}px`);

    const controls = document.getElementById("siteControls");
    const launcher = document.getElementById("tutorialLauncherRow");
    const guideBtn = document.getElementById("tutorialOpenBtn");
    const controlsHeight = visibleElementHeight(controls);
    const launcherHeight = visibleElementHeight(launcher);
    const controlsTopRowWidth = visibleTopRowWidth(controls);
    const controlsWidth = controlsTopRowWidth || visibleElementWidth(controls);
    const guideWidth = visibleElementWidth(guideBtn);
    const safeLeft = readRootVarPx("--mobile-safe-left");
    const safeRight = readRootVarPx("--mobile-safe-right");
    const topBarUsableWidth = Math.max(220, viewportWidth - (edgePad * 2) - safeLeft - safeRight);
    const inlineTopBarGap = 10;
    const topLineBudget = Math.max(
      84,
      topBarUsableWidth - (controlsWidth > 0 ? controlsWidth + inlineTopBarGap : 0)
    );
    const guideFitsTop = guideWidth <= 0 || (guideWidth + 2 <= topLineBudget);
    const shouldStackLauncher = !guideFitsTop;
    const launcherTopMaxWidth = Math.max(
      84,
      Math.floor(shouldStackLauncher ? topBarUsableWidth : topLineBudget)
    );
    setRootVar("--mobile-launcher-top-max-w", `${launcherTopMaxWidth}px`);
    const controlsOverlay = (controlsHeight > 0 ? controlsHeight : 36) + 8;
    let totalOverlay = controlsOverlay;
    if (launcherHeight > 0) {
      if (shouldStackLauncher) totalOverlay += launcherHeight + 6;
      else totalOverlay = Math.max(totalOverlay, launcherHeight + 8);
    }
    setRootVar("--mobile-launcher-offset-y", shouldStackLauncher ? `${controlsOverlay + 4}px` : "0px");
    setRootVar("--mobile-site-controls-h", `${controlsOverlay}px`);
    setRootVar("--mobile-top-overlay-h", `${totalOverlay}px`);

    ROOT.classList.toggle("mobile-compat-tight", viewportWidth <= 520);
    ROOT.classList.toggle("mobile-compat-xs", viewportWidth <= 390);
  }

  function scheduleMobileLayoutMetrics() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      applyMobileLayoutMetrics();
    });
  }

  function applyMobileCompatClass() {
    const viewportWidth = readViewportWidth();
    const enabled = MQ_NARROW.matches || (MQ_COARSE.matches && viewportWidth <= 1366);
    ROOT.classList.toggle("mobile-compat", enabled);
    attachControlsObserver();
    scheduleMobileLayoutMetrics();
  }

  function bindMediaQuery(mq) {
    if (!mq) return;
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", applyMobileCompatClass);
      return;
    }
    if (typeof mq.addListener === "function") {
      mq.addListener(applyMobileCompatClass);
    }
  }

  bindMediaQuery(MQ_NARROW);
  bindMediaQuery(MQ_COARSE);

  const onReady = () => {
    applyMobileCompatClass();
    attachControlsObserver();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }

  window.addEventListener("resize", applyMobileCompatClass, { passive: true });
  window.addEventListener("orientationchange", applyMobileCompatClass, {
    passive: true,
  });
  window.addEventListener("load", scheduleMobileLayoutMetrics, { passive: true });
  document.addEventListener("site:lang-changed", scheduleMobileLayoutMetrics);
  document.addEventListener("tutorial:launcher-layout-changed", () => {
    attachControlsObserver();
    scheduleMobileLayoutMetrics();
  });
  if (VISUAL_VIEWPORT) {
    VISUAL_VIEWPORT.addEventListener("resize", applyMobileCompatClass, {
      passive: true,
    });
  }
  if (document.fonts?.ready) {
    document.fonts.ready.then(scheduleMobileLayoutMetrics).catch(() => {});
  }

  window.setTimeout(scheduleMobileLayoutMetrics, 180);
  window.setTimeout(scheduleMobileLayoutMetrics, 520);
})();
