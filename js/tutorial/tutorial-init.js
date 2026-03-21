// js/tutorial/tutorial-init.js
(() => {
  "use strict";

  function tt(key, fallback = "") {
    return window.DungeonTutorialI18n?.t?.(key, fallback) || fallback;
  }

  function notifyLauncherLayoutChanged() {
    try {
      document.dispatchEvent(new CustomEvent("tutorial:launcher-layout-changed"));
    } catch (_) {}
  }

  function getAckMessage() {
    return tt(
      "ack.body",
      [
        "360Dungeon is dedicated to MilkMaxxing, yapmaxxing, and yappers.",
        "I hope this project and its tools help make your MilkyWayIdle experience even better. I would like to thank my guild members as well as those in the community who helped with the beta test and offered improvements. Special mentions to Edible Tools and Physon's Calculator and all the other extensions this amazing community have created that inspired this project.",
        "If you have any comments or suggestions, feel free to message me in game or on discord. Thanks again!",
        "-360Drago",
      ].join("\n\n")
    );
  }

  function applyLauncherI18n() {
    const openBtn = document.getElementById("tutorialOpenBtn");
    if (openBtn) {
      const text = tt("ui.guideButton", "Guide");
      openBtn.setAttribute("aria-label", text);
      openBtn.setAttribute("title", text);
      const textEl = openBtn.querySelector(".ctrlText");
      if (textEl) textEl.textContent = text;
    }

    const ackBtn = document.getElementById("tutorialAckBtn");
    if (ackBtn) {
      const text = tt("ui.acknowledgementsButton", "Acknowledgements");
      ackBtn.textContent = text;
      ackBtn.setAttribute("aria-label", text);
      ackBtn.setAttribute("title", text);
    }

    const panel = document.getElementById("tutorialAckPanel");
    if (panel) {
      panel.setAttribute("aria-label", tt("ui.acknowledgementsTitle", "Acknowledgements"));
      const titleEl = panel.querySelector(".tutorialAckTitle");
      if (titleEl) titleEl.textContent = tt("ui.acknowledgementsTitle", "Acknowledgements");
      const bodyEl = panel.querySelector(".tutorialAckBody");
      if (bodyEl) bodyEl.textContent = getAckMessage();
    }
    notifyLauncherLayoutChanged();
  }

  function ensureLauncherRow(host) {
    if (!host) return null;
    let row = document.getElementById("tutorialLauncherRow");
    if (row) return row;
    row = document.createElement("div");
    row.className = "tutorialLauncherRow";
    row.id = "tutorialLauncherRow";
    host.appendChild(row);
    notifyLauncherLayoutChanged();
    return row;
  }

  function positionAckPanel(panel, anchorBtn) {
    if (!panel || !anchorBtn) return;
    const pad = 12;
    const viewportW = Math.max(280, window.innerWidth || document.documentElement.clientWidth || 0);
    const viewportH = Math.max(220, window.innerHeight || document.documentElement.clientHeight || 0);
    const rect = anchorBtn.getBoundingClientRect();
    const panelWidth = Math.min(500, Math.max(280, viewportW - pad * 2));
    panel.style.width = `${Math.round(panelWidth)}px`;
    let left = rect.left + rect.width - panelWidth;
    left = Math.max(pad, Math.min(viewportW - panelWidth - pad, left));
    const measuredHeight = Math.max(120, Math.ceil(panel.getBoundingClientRect().height || panel.scrollHeight || 260));
    let top = rect.bottom + 10;
    if (top + measuredHeight > viewportH - pad) top = rect.top - measuredHeight - 10;
    top = Math.max(pad, Math.min(viewportH - measuredHeight - pad, top));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function bindAcknowledgements(triggerBtn, panel) {
    if (!triggerBtn || !panel || triggerBtn.dataset.ackBound === "1") return;
    triggerBtn.dataset.ackBound = "1";

    const close = () => {
      panel.hidden = true;
      triggerBtn.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      panel.hidden = false;
      positionAckPanel(panel, triggerBtn);
      triggerBtn.setAttribute("aria-expanded", "true");
    };
    const toggle = () => {
      if (panel.hidden) open();
      else close();
    };

    triggerBtn.addEventListener("click", (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      toggle();
    });

    document.addEventListener(
      "pointerdown",
      (evt) => {
        if (panel.hidden) return;
        const target = evt.target;
        if (panel.contains(target) || triggerBtn.contains(target)) return;
        close();
      },
      true
    );

    document.addEventListener("keydown", (evt) => {
      if (evt.key !== "Escape" || panel.hidden) return;
      close();
    });

    window.addEventListener("resize", () => {
      if (!panel.hidden) positionAckPanel(panel, triggerBtn);
    });
    window.addEventListener(
      "scroll",
      () => {
        if (!panel.hidden) positionAckPanel(panel, triggerBtn);
      },
      { passive: true, capture: true }
    );
  }

  function ensureAcknowledgements(row) {
    if (!row) return;
    let btn = document.getElementById("tutorialAckBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tutorialAckBtn";
      btn.id = "tutorialAckBtn";
      btn.setAttribute("aria-label", tt("ui.acknowledgementsButton", "Acknowledgements"));
      btn.setAttribute("title", tt("ui.acknowledgementsButton", "Acknowledgements"));
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "tutorialAckPanel");
      btn.textContent = tt("ui.acknowledgementsButton", "Acknowledgements");
      row.appendChild(btn);
    } else if (btn.parentElement !== row) {
      row.appendChild(btn);
    }

    let panel = document.getElementById("tutorialAckPanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "tutorialAckPanel";
      panel.id = "tutorialAckPanel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", tt("ui.acknowledgementsTitle", "Acknowledgements"));
      panel.hidden = true;
      panel.innerHTML = `
        <h3 class="tutorialAckTitle">${tt("ui.acknowledgementsTitle", "Acknowledgements")}</h3>
        <p class="tutorialAckBody"></p>
      `;
      document.body.appendChild(panel);
    }
    const body = panel.querySelector(".tutorialAckBody");
    if (body) body.textContent = getAckMessage();
    bindAcknowledgements(btn, panel);
  }

  function addLauncherButton() {
    const host = document.body;
    if (!host) return false;
    const row = ensureLauncherRow(host);
    if (!row) return false;

    let btn = document.getElementById("tutorialOpenBtn");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ctrlBtn tutorialOpenBtn";
      btn.id = "tutorialOpenBtn";
      btn.setAttribute("aria-label", tt("ui.guideButton", "Guide"));
      btn.setAttribute("title", tt("ui.guideButton", "Guide"));
      btn.innerHTML = `
      <svg class="ctrlIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M5 4.5h10.2a2.8 2.8 0 0 1 2.8 2.8v11.9a1.3 1.3 0 0 1-1.9 1.2L11 18l-5.1 2.4A1.3 1.3 0 0 1 4 19.2V5.5A1 1 0 0 1 5 4.5Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M8 9h6M8 12.5h5" stroke="currentColor" stroke-width="1.8" opacity="0.8"/>
      </svg>
      <span class="ctrlText">${tt("ui.guideButton", "Guide")}</span>
    `;
      btn.addEventListener("click", () => {
        window.DungeonTutorial?.openPicker?.();
      });
    }
    if (btn.parentElement !== row) row.appendChild(btn);
    ensureAcknowledgements(row);
    return true;
  }

  function ensureLauncherButton() {
    if (addLauncherButton()) return;
    if (typeof MutationObserver !== "function") return;
    const obs = new MutationObserver(() => {
      if (addLauncherButton()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => obs.disconnect(), 12000);
  }

  function init() {
    ensureLauncherButton();
    applyLauncherI18n();
    document.addEventListener("site:lang-changed", applyLauncherI18n);
    window.DungeonTutorial?.init?.();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
