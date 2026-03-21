// js/tutorial/tutorial-chapters.js
(() => {
  "use strict";

  function tt(key, fallback = "") {
    return window.DungeonTutorialI18n?.t?.(key, fallback) || fallback;
  }

  function resolveCurrentLanguageName() {
    const lang = window.DungeonTutorialI18n?.getLang?.() || window.SiteI18n?.getLang?.() || "en";
    if (lang === "zh-Hans") return "简体中文";
    if (lang === "zh-Hant") return "繁體中文";
    return "English";
  }

  function interpolateTutorialBody(body) {
    const str = body == null ? "" : String(body);
    const lang = window.DungeonTutorialI18n?.getLang?.() || window.SiteI18n?.getLang?.() || "en";
    const readableName =
      lang === "zh-Hans"
        ? "\u7b80\u4f53\u4e2d\u6587"
        : lang === "zh-Hant"
          ? "\u7e41\u9ad4\u4e2d\u6587"
          : "English";
    return str.replace(/\{currentLanguage\}/g, readableName);
  }

  const defaultSelectionEnsure = [
    { type: "selectDungeon", selector: '.card[data-dungeon="chimerical_den"]' },
    { type: "selectTier", selector: '.tierBtn[data-tier="T1"]' },
    { type: "wait", ms: 120 },
  ];

  const chapters = {
    quick_calculator: {
      id: "quick_calculator",
      title: "Quick Calculator Tutorial",
      guideId: "novice",
      description: "Noland's beginner path: pick a dungeon, choose a tier, run quick math, and read your results.",
      steps: [
        {
          id: "language-theme-check",
          title: "Language & Theme",
          body:
            "ᚲᚨᚾ ᛁᛟᚢ ᚢᚾᛞᛖᚱᛊᛏᚨᚾᛞ ᛗᛖ ...... ummmm... how about {currentLanguage}? Can you understand and see me, or do you need to look up here? I guess if you can you don't need to adjust Language and Light or Dark mode up at the top there...",
          target: "#siteAppearanceControls",
          placement: "center",
          highlightPadding: 8,
          allowTargetInteraction: true,
        },
        {
          id: "welcome",
          title: "Noland's Quick Start",
          body:
            "Welcome to 360Dungeon! My name is Noland. It looks like you're new here. My friends and I are happy to show you around so you can get a feel for the place. I am still learning too, so I will guide you through the easy path: Quick Calculator mode.",
          placement: "center",
        },
        {
          id: "dungeon-cards",
          title: "Choose A Dungeon",
          body:
            "Let's start simple. Pick the dungeon you want to run, and we will base everything on that choice.",
          target: "#cardGrid",
          placement: "bottom",
          highlightPadding: 10,
        },
        {
          id: "tier-row",
          title: "Pick A Tier",
          body:
            "Now pick your tier: T0, T1, or T2. Tiers change costs and rewards, so make sure this matches what your group is running so we keep your numbers honest.",
          target: ".tierInner",
          placement: "bottom",
          highlightPadding: 10,
          ensure: [{ type: "selectDungeon", selector: '.card[data-dungeon="chimerical_den"]' }, { type: "wait", ms: 140 }],
        },
        {
          id: "quick-inputs",
          title: "Quick Inputs",
          body:
            "Now add your run details here! I set the combat buff to 20 but if it's currently something else you should let us know. Consumables per day and clear time are super important so make sure you fill them. No pressure, you can always adjust these later.",
          target: '[aria-label="Quick inputs"]',
          placement: "right",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "quick-run",
          title: "Run Calculator",
          body:
            "When you are all set, press Calculate. Hopefully we will see some magic and your quick calculation will be ready to go!",
          target: () => {
            const host = document.querySelector('[aria-label="Quick calculator"]');
            if (!host) return null;
            return Array.from(host.querySelectorAll('button[type="button"]')).find(
              (btn) => String(btn.textContent || "").trim().toLowerCase() === "calculate"
            ) || null;
          },
          placement: "top",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "quick-results",
          title: "Read Results",
          body:
            "Nice work. Your result board will show you: daily profit, hourly profit, runs per day, and key usage.",
          target: '[aria-label="Quick results"]',
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "profiles",
          title: "Profiles",
          body:
            "A useful tip is to use profiles to save different builds. Your active profile stays highlighted, and you can lock them too if you're worried about clearing any of your information.",
          target: "#profileSlots",
          placement: "top",
        },
        {
          id: "profile-share",
          title: "Share Current Profile",
          body:
            "If you click Share, it copies a magical *incantation* link with all information from your current active profile. That makes it easy to send your exact setup to a friend or save it for later.",
          target: "#shareStateBtn",
          placement: "top",
        },
      ],
    },
    advanced: {
      id: "advanced",
      title: "Advanced Tutorial",
      guideId: "ice",
      description: "Deeper controls for advanced setup and calculation tuning.",
      steps: [
        {
          id: "advanced-intro",
          title: "Advanced Mode",
          body:
            "I specialize in advanced controls. Rather than having assumptions and using market information, I like to have a bit more control.",
          placement: "center",
          ensure: [{ type: "toggle", selector: "#advMode", checked: true }, { type: "wait", ms: 140 }],
        },
        {
          id: "advanced-toggle",
          title: "Advanced Toggle",
          body:
            "Use this toggle to switch between Quick and Advanced workflows.",
          target: '.subtitleRow label[for="advMode"]',
          placement: "bottom",
        },
        {
          id: "pricing-panel",
          title: "Pricing Sources",
          body:
            "If you happen to be crafting your own keys or prefer to use another *API* to get your prices this is where we can change that!",
          target: '.panel.accordion[data-panel="pricing"]',
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "run-panel",
          title: "Run Inputs",
          body:
            "Just like Noland mentioned before, we have to check and make sure this information is correct so always check your player information.",
          target: "#panelRunBody",
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "manual-loot-prices",
          title: "Manual Loot Prices",
          body:
            "If you have your own values for what your loot is worth or if none happen to be for sale on the market you can control that from here. Careful with this much power you can fall victim to hallucinations of profits that might not be real!",
          target: "#lootOverrideSection",
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#advMode", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "advanced-run",
          title: "Calculate Advanced Result",
          body:
            "Once again, click here to generate your results. Another tip is you can hit your *ENTER KEY* if you don't want to have to use your wand.",
          target: () => {
            const host = document.querySelector("#panelRunBody");
            if (!host) return null;
            return Array.from(host.querySelectorAll('button[type="button"]')).find(
              (btn) => String(btn.textContent || "").trim().toLowerCase() === "calculate"
            ) || null;
          },
          placement: "top",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "advanced-results",
          title: "Advanced Results",
          body:
            "I hope this helps give you a bit more control and information if you desire. There are still a few more tools that I think you might like if this type of knowledge suits you.",
          target: "#advResultsCard",
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
      ],
    },
    compare: {
      id: "compare",
      title: "Zone Compare Tutorial",
      guideId: "flame",
      description: "Fenric's fast compare path: set minutes, tune drop filters, calculate, and pick winners quickly.",
      steps: [
        {
          id: "compare-intro",
          title: "Zone Compare",
          body:
            "I do not have time for all that clicking, I prefer to see all my data at once. Here take a look!",
          placement: "center",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-toggle",
          title: "Enable Compare",
          body:
            "Start over here. Turn on Zone Compare and we will place every zone side by side.",
          target: '.subtitleRow label[for="zoneCompareToggle"]',
          placement: "bottom",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-panel",
          title: "Compare Panel",
          body:
            "This is your compare board. We can get quick answers across all zones and tiers.",
          target: "#zoneCompareInline",
          placement: "bottom",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-min-row",
          title: "Set One Min Row",
          body:
            "Start with one line like this. Enter your clear time, then repeat the same process for every zone and tier you're interested in or even complete the whole board. A quick tip, you can even use your arrow keys to navigate the entry boxes!",
          target: () => {
            const preferred = document.querySelector("#zcMin-chimerical_den-T0");
            const input = preferred || document.querySelector("#zoneCompareInline .zcTierInput");
            if (!input) return null;
            return input.closest(".zcTierRow") || input;
          },
          placement: "top",
          highlightPadding: 6,
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-low-drop-toggle",
          title: "Remove 1% Drops",
          body:
            "If you're worried about your LUCK you can use this toggle to Remove 1% drops when you want a stricter baseline or to see what might happen if your unlucky",
          target: '#zoneCompareInline label[for="zcLowDrop"]',
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-calculate",
          title: "Calculate Compare",
          body:
            "When your rows are filled, press Calculate. That's it! Do not forget (Like me) to set your other information and manual prices if you need to.",
          target: "#zcCalc",
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-read-board",
          title: "Read The Winners",
          body:
            "All that's left is to pick where your party is headed, keep your eyes out for negative expected values sometimes it's not always best to open every type of chest you come across.",
          target: "#zoneCompareInline .zcGrid",
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "compare-copy-keys",
          title: "Copy Key Needs",
          body:
            "You can also hover over this and click it to copy the number of keys needed for this run per day and use it in the Keys section. Let me go get Enora to have her show you how that works.",
          target: () =>
            document.querySelector("#zcTip-chimerical_den-T0") ||
            document.querySelector('#zoneCompareInline .zcInfo[data-copy-planner="1"]') ||
            document.querySelector("#zoneCompareInline .zcProfitWrap .zcInfo"),
          placement: "left",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#zoneCompareToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
      ],
    },
    keys_tokens: {
      id: "keys_tokens",
      title: "Keys & Token Shop Tutorial",
      guideId: "elementalist",
      description: "Enora's value-workshop: choose context, check token value, verify key economics, and refresh data cleanly.",
      steps: [
        {
          id: "keys-tokens-intro",
          title: "Keys And Token Shop",
          body:
            "I have two more tools for you to explore that I learned about from all this reading.",
          placement: "center",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "token-toggle",
          title: "Token Shop Toggle",
          body:
            "First, enable Token Shop. This opens the token-value panel for the dungeon we are studying.",
          target: '.subtitleRow label[for="tokenShopToggle"]',
          placement: "bottom",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "token-select-dungeon",
          title: "Select Dungeon",
          body:
            "Use these zone cards to switch which dungeon you are studying. The Token Shop detail panel below follows this selection, so pick your zone here first.",
          target: "#tokenShopInline .tsGrid",
          placement: "bottom",
          highlightPadding: 10,
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#tokenShopToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "token-panel",
          title: "Token Shop Panel",
          body:
            "After you choose a zone above, this detail panel shows the full Token Shop table with all their market values. Helping get you the best price per token out there!",
          target: "#tokenShopInline .tsDetailShell",
          placement: "bottom",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#tokenShopToggle", checked: true },
            { type: "wait", ms: 140 },
          ],
        },
        {
          id: "token-refresh",
          title: "Refresh Token Prices",
          body:
            "When you need the newest pricing snapshot, use Refresh prices here before making decisions.",
          target: () => document.querySelector("#tokenShopRefreshBtn") || document.querySelector("#tokenShopInline"),
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#tokenShopToggle", checked: true },
            { type: "wait", ms: 160 },
          ],
        },
        {
          id: "keys-toggle",
          title: "Keys Toggle",
          body:
            "Next, enable Keys. This compares crafting costs and market prices if you decide you want to craft for a bit.",
          target: '.subtitleRow label[for="keysToggle"]',
          placement: "bottom",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "keys-headers",
          title: "Keys Overview",
          body:
            "This overview lets you compare every dungeon's key summary at a glance. Use these cards to swap zones, then look below when you want the full crafting planner.",
          target: "#keysInline .keysGrid",
          placement: "top",
          highlightPadding: 10,
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#keysToggle", checked: true },
            { type: "wait", ms: 180 },
          ],
        },
        {
          id: "keys-planner",
          title: "Key Cost Planner",
          body:
            "If you want to plan out your crafting you can expand this menu too. Just set how many keys you want for your selected dungeon, and check all your toggles, you can also manualy put in prices if you want too.",
          target: "#keysPlannerPanel",
          placement: "bottom",
          highlightPadding: 10,
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#keysToggle", checked: true },
            { type: "wait", ms: 180 },
            { type: "expand", selector: "#keysCalcToggleBtn" },
          ],
        },
        {
          id: "keys-entry-toggle",
          title: "Entry Keys",
          body:
            "You can even swap to view entry keys as well.",
          target: () => document.querySelector("#keysTypeBtn") || document.querySelector("#keysInline"),
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#keysToggle", checked: true },
            { type: "wait", ms: 180 },
            { type: "expand", selector: "#keysCalcToggleBtn" },
          ],
        },
        {
          id: "keys-refresh",
          title: "Refresh Key Prices",
          body:
            "As always, make sure to check the refresh timer or go ahead and press it again for good measure!",
          target: () => document.querySelector("#keysRefreshBtn") || document.querySelector("#keysInline"),
          placement: "top",
          ensure: [
            ...defaultSelectionEnsure,
            { type: "toggle", selector: "#keysToggle", checked: true },
            { type: "wait", ms: 180 },
          ],
        },
      ],
    },
  };

  const chapterOrder = ["quick_calculator", "advanced", "compare", "keys_tokens"];

  function getChapter(id) {
    const chapter = chapters[id] || null;
    if (!chapter) return null;
    const localizedSteps = Array.isArray(chapter.steps)
      ? chapter.steps.map((step) => ({
        ...step,
        title: tt(`chapter.${id}.step.${step.id}.title`, step.title || ""),
        body: interpolateTutorialBody(tt(`chapter.${id}.step.${step.id}.body`, step.body || "")),
      }))
      : [];
    return {
      ...chapter,
      title: tt(`chapter.${id}.title`, chapter.title || id),
      description: tt(`chapter.${id}.description`, chapter.description || ""),
      steps: localizedSteps,
    };
  }

  window.DungeonTutorialChapters = {
    order: [...chapterOrder],
    byId: { ...chapters },
    get: getChapter,
  };
})();
