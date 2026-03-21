// js/tutorial/tutorial-position.js
(() => {
  "use strict";

  const DEFAULT_PAD = 12;
  const DEFAULT_GAP = 14;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function overflowScore(box, viewportW, viewportH, pad) {
    const leftOverflow = Math.max(0, pad - box.left);
    const rightOverflow = Math.max(0, box.left + box.width - (viewportW - pad));
    const topOverflow = Math.max(0, pad - box.top);
    const bottomOverflow = Math.max(0, box.top + box.height - (viewportH - pad));
    return leftOverflow + rightOverflow + topOverflow + bottomOverflow;
  }

  function rawPosition(targetRect, popupRect, placement, gap) {
    const centerX = targetRect.left + targetRect.width / 2;
    const centerY = targetRect.top + targetRect.height / 2;
    const popupW = popupRect.width;
    const popupH = popupRect.height;

    if (placement === "top") {
      return {
        left: centerX - popupW / 2,
        top: targetRect.top - popupH - gap,
      };
    }
    if (placement === "right") {
      return {
        left: targetRect.right + gap,
        top: centerY - popupH / 2,
      };
    }
    if (placement === "left") {
      return {
        left: targetRect.left - popupW - gap,
        top: centerY - popupH / 2,
      };
    }
    return {
      left: centerX - popupW / 2,
      top: targetRect.bottom + gap,
    };
  }

  function orderForPlacement(preferred) {
    const p = String(preferred || "auto").toLowerCase();
    if (p === "top") return ["top", "bottom", "right", "left"];
    if (p === "right") return ["right", "left", "bottom", "top"];
    if (p === "left") return ["left", "right", "bottom", "top"];
    if (p === "bottom") return ["bottom", "top", "right", "left"];
    return ["bottom", "right", "left", "top"];
  }

  function computeCentered(popupRect, viewportW, viewportH, pad) {
    const left = clamp((viewportW - popupRect.width) / 2, pad, viewportW - popupRect.width - pad);
    const top = clamp((viewportH - popupRect.height) / 2, pad, viewportH - popupRect.height - pad);
    return { left, top, placement: "center" };
  }

  function compute(params) {
    const targetRect = params?.targetRect || null;
    const popupRect = params?.popupRect || null;
    const preferred = params?.placement || "auto";
    const viewportPad = Number(params?.viewportPad) || DEFAULT_PAD;
    const gap = Number(params?.gap) || DEFAULT_GAP;
    const viewportW = Math.max(280, window.innerWidth || document.documentElement.clientWidth || 0);
    const viewportH = Math.max(280, window.innerHeight || document.documentElement.clientHeight || 0);

    if (!popupRect || !popupRect.width || !popupRect.height) {
      return { left: viewportPad, top: viewportPad, placement: "center" };
    }
    if (String(preferred || "").toLowerCase() === "center") {
      return computeCentered(popupRect, viewportW, viewportH, viewportPad);
    }
    if (!targetRect) return computeCentered(popupRect, viewportW, viewportH, viewportPad);

    const candidates = orderForPlacement(preferred);
    let best = null;

    for (const placement of candidates) {
      const raw = rawPosition(targetRect, popupRect, placement, gap);
      const score = overflowScore(
        {
          left: raw.left,
          top: raw.top,
          width: popupRect.width,
          height: popupRect.height,
        },
        viewportW,
        viewportH,
        viewportPad
      );
      if (!best || score < best.score) {
        best = { placement, raw, score };
      }
      if (score <= 0) break;
    }

    if (!best) return computeCentered(popupRect, viewportW, viewportH, viewportPad);

    const clampedLeft = clamp(best.raw.left, viewportPad, viewportW - popupRect.width - viewportPad);
    const clampedTop = clamp(best.raw.top, viewportPad, viewportH - popupRect.height - viewportPad);
    return {
      left: clampedLeft,
      top: clampedTop,
      placement: best.placement,
    };
  }

  window.DungeonTutorialPosition = {
    compute,
  };
})();
