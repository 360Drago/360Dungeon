// js/tutorial/tutorial-guides.js
(() => {
  "use strict";

  function tt(key, fallback = "") {
    return window.DungeonTutorialI18n?.t?.(key, fallback) || fallback;
  }

  const guides = {
    novice: {
      id: "novice",
      name: "Noland the Novice",
      assetPath: "./assets/Svg/Novice_sorcerer.svg",
      accent: "#f59e0b",
      facing: "right",
      portraitSideDefault: "left",
      intro: "Hi there, I am Noland the Novice.",
      handoff: {
        advanced: "You did great. I don't know much more but I would like to introduce you to one of my professors, Icera the Cold. She is strict but does keep everything in order.",
      },
      outro: "Bye",
    },
    ice: {
      id: "ice",
      name: "Icera the Cold",
      assetPath: "./assets/Svg/Ice_sorcerer.svg",
      accent: "#38bdf8",
      facing: "left",
      portraitSideDefault: "right",
      intro: "Hello there, I am Icera the Cold. I would be happy to teach you a bit about my advanced tools.",
      handoff: {
        compare: "If you need a bit more control my tools might be your best bet, but Fenric does have some wisdom in his old age let me pass you over to him.",
      },
      outro: "Bye",
    },
    flame: {
      id: "flame",
      name: "Fenric the Flame",
      assetPath: "./assets/Svg/Flame_sorcerer.svg",
      accent: "#f97316",
      facing: "left",
      portraitSideDefault: "right",
      intro: "Nice to meet you! I am Fenric the Flame. I may look old but I still have that fire in me. Let me show you what I have been working on.",
      handoff: {
        keys_tokens: "Time for me to take a nap but before you go out on your own, Enora might have some tips for you too.",
      },
      outro: "Bye",
    },
    elementalist: {
      id: "elementalist",
      name: "Enora the Elementalist",
      assetPath: "./assets/Svg/Elementalist.svg",
      accent: "#a78bfa",
      facing: "right",
      portraitSideDefault: "left",
      intro: "I am Enora the Elementalist. I have been doing some reading and I have some other ideas that might help you on your journey.",
      handoff: {},
      outro: "Bye",
    },
  };

  function getGuide(id) {
    const base = guides[id] || guides.novice;
    const handoff = { ...(base.handoff || {}) };
    Object.keys(handoff).forEach((nextChapterId) => {
      handoff[nextChapterId] = tt(`guide.${base.id}.handoff.${nextChapterId}`, handoff[nextChapterId]);
    });
    return {
      ...base,
      name: tt(`guide.${base.id}.name`, base.name || "Guide"),
      intro: tt(`guide.${base.id}.intro`, base.intro || ""),
      outro: tt(`guide.${base.id}.outro`, base.outro || ""),
      handoff,
    };
  }

  window.DungeonTutorialGuides = {
    all: { ...guides },
    get: getGuide,
  };
})();
