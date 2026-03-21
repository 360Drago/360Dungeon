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
      description: "Noland walks new players through the fastest way to get a clean dungeon profit estimate.",
      steps: [
        {
          id: "language-theme-check",
          title: "Language & Theme",
          body:
            "ᚲᚨᚾ ᛁᛟᚢ ᚢᚾᛞᛖᚱᛊᛏᚨᚾᛞ ᛗᛖ ...hmmm, how about {currentLanguage}? Before we start, make sure the language and theme look right to you. You can always change it in the top right!",
          target: "#siteAppearanceControls",
          placement: "center",
          highlightPadding: 8,
          allowTargetInteraction: true,
        },
        {
          id: "welcome",
          title: "Noland's Quick Start",
          body:
            "Welcome to 360Dungeon! My name is Noland. It looks like you're new here. My friends and I are happy to show you around so you can get a feel for the place. I am still learning too, so I will guide you through the easy path first!",
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
            "Now pick your tier: T0, T1, or T2. Just like in game, tiers can change your rewards a lot, so make sure this matches what your group is running if you want honest numbers.",
          target: ".tierInner",
          placement: "bottom",
          highlightPadding: 10,
          ensure: [{ type: "selectDungeon", selector: '.card[data-dungeon="chimerical_den"]' }, { type: "wait", ms: 140 }],
        },
        {
          id: "quick-inputs",
          title: "Quick Inputs",
          body:
            "Now add your run details here! I set the combat buff to 20 by default, but if yours is different, update it here. Consumables per day and clear time are both super important, so make sure you fill them in. No pressure, you can always adjust these later.",
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
            "This is your result board. You'll see daily profit, hourly profit, runs per day, and how many keys the setup needs.",
          target: '[aria-label="Quick results"]',
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "profiles",
          title: "Profiles",
          body:
            "Profiles are useful when you want to save different builds, compare setups, or help a friend. The active one stays highlighted, and you can lock a slot if you want to protect it from accidental clears.",
          target: "#profileSlots",
          placement: "top",
        },
        {
          id: "profile-share",
          title: "Share Current Profile",
          body:
            "If you click Share, it copies a magical *incantation* link with all information from your current profile. It's the easiest way to send someone your exact setup or save it for later.",
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
            "If you want more control, this is where things get better. Instead of relying only on default assumptions and market data, Advanced mode lets you tune the details yourself.",
          placement: "center",
          ensure: [{ type: "toggle", selector: "#advMode", checked: true }, { type: "wait", ms: 140 }],
        },
        {
          id: "advanced-toggle",
          title: "Advanced Toggle",
          body:
            "Use this toggle to switch between Quick and Advanced mode.",
          target: '.subtitleRow label[for="advMode"]',
          placement: "bottom",
        },
        {
          id: "pricing-panel",
          title: "Pricing Sources",
          body:
            "If you craft your own keys or prefer another *API* for prices, this is where you change that.",
          target: '.panel.accordion[data-panel="pricing"]',
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "run-panel",
          title: "Run Inputs",
          body:
            "Like Noland mentioned before, double-check your player info here before you calculate. Small mistakes in clear time or buff can change the result more than people expect.",
          target: "#panelRunBody",
          placement: "left",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "manual-loot-prices",
          title: "Manual Loot Prices",
          body:
            "This is where you can override loot values one by one. It's useful if you have your own values for what your loot is worth or if none happen to be for sale on the market. Just be careful, because bad values can make the profit look better than it really is.",
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
            "When your settings look good, hit Calculate here. You can also press Enter if you want to move a little faster.",
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
            "I hope this gives you a bit more control and a clearer picture of your setup. There are still a few more tools that I think you might like if this kind of detail suits you.",
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
      description: "Fenric's fast path for comparing zones side by side and finding the best runs quickly.",
      steps: [
        {
          id: "compare-intro",
          title: "Zone Compare",
          body:
            "I do not have time for all that clicking! When I want answers fast, I compare everything at once instead of checking one zone at a time. That's what this view is for.",
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
            "Turn on Zone Compare to put the zones side by side. It's the fastest way to spot which runs are worth your time.",
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
            "This is your compare board. Fill in the times you care about, then let the table show you the best options.",
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
            "Start with one row. Enter your clear time for that zone and tier, then keep going across the board for anything else you want to compare. A quick tip, you can even use your arrow keys to navigate the entry boxes!",
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
            "Use this toggle to remove 1% drops from the calculation. It's a good way to see a safer baseline without relying on LUCK.",
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
            "Once your rows are filled in, press Calculate. Just make sure your other settings and manual prices are where you want them first.",
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
            "All that's left is to pick where your party is headed. Keep your eyes out for negative expected values, because sometimes it is not best to open every type of chest you come across.",
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
            "You can also hover over this and click it to copy that row's daily key needs straight into the Keys section. Let me go get Enora so she can show you how that works.",
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
      description: "Enora walks through token value, key costs, and refresh tools for deeper planning.",
      steps: [
        {
          id: "keys-tokens-intro",
          title: "Keys And Token Shop",
          body:
            "I have two more tools for you to explore that I learned about from all my reading.",
          placement: "center",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "token-toggle",
          title: "Token Shop Toggle",
          body:
            "First, turn on Token Shop. That opens the token value view for any dungeon you are studying.",
          target: '.subtitleRow label[for="tokenShopToggle"]',
          placement: "bottom",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "token-select-dungeon",
          title: "Select Dungeon",
          body:
            "Use these dungeon cards to choose which zone you want to inspect. The token details below will update to match your selection.",
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
            "After you choose a zone above, this detail panel shows the full Token Shop table and the market value of each item. It helps you spot the best value per token.",
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
            "When you need to check that you are using the newest pricing snapshot, use Refresh prices here before making decisions.",
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
            "Now turn on Keys. This section helps you compare crafting costs against market prices.",
          target: '.subtitleRow label[for="keysToggle"]',
          placement: "bottom",
          ensure: defaultSelectionEnsure,
        },
        {
          id: "keys-headers",
          title: "Keys Overview",
          body:
            "This overview gives you a quick read on every dungeon's key situation. Pick a zone here, then use the planner below if you want to go deeper.",
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
            "Open the planner when you want to map out crafting in detail. Set how many keys you need, check your options, and override prices if you're using your own numbers.",
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
            "You can switch this view to entry keys too, so you're not limited to chest keys!",
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
            "And just like the other tools, you can refresh prices here whenever you want the latest snapshot.",
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
