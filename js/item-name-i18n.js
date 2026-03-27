// js/item-name-i18n.js
(() => {
  "use strict";

  // Ownership: site-wide item-name overrides for languages not shipped inside init data.
  // Invariant: keep English as the canonical fallback so cached translated init data can still
  // be restored back to English when the user changes language.
  const ITEM_NAME_TRANSLATIONS = Object.freeze({
    en: Object.freeze({
      "/items/coin": "Coin",
      "/items/cowbell": "Cowbell",
      "/items/bag_of_10_cowbells": "Bag Of 10 Cowbells",
      "/items/pearl": "Pearl",
      "/items/amber": "Amber",
      "/items/garnet": "Garnet",
      "/items/jade": "Jade",
      "/items/amethyst": "Amethyst",
      "/items/moonstone": "Moonstone",
      "/items/sunstone": "Sunstone",
      "/items/small_treasure_chest": "Small Treasure Chest",
      "/items/medium_treasure_chest": "Medium Treasure Chest",
      "/items/large_treasure_chest": "Large Treasure Chest",
      "/items/chimerical_chest": "Chimerical Chest",
      "/items/chimerical_essence": "Chimerical Essence",
      "/items/chimerical_token": "Chimerical Token",
      "/items/chimerical_chest_key": "Chimerical Chest Key",
      "/items/chimerical_refinement_shard": "Chimerical Refinement Shard",
      "/items/shield_bash": "Shield Bash",
      "/items/crippling_slash": "Crippling Slash",
      "/items/pestilent_shot": "Pestilent Shot",
      "/items/griffin_leather": "Griffin Leather",
      "/items/manticore_sting": "Manticore Sting",
      "/items/jackalope_antler": "Jackalope Antler",
      "/items/dodocamel_plume": "Dodocamel Plume",
      "/items/griffin_talon": "Griffin Talon",
      "/items/chimerical_quiver": "Chimerical Quiver",
      "/items/griffin_tunic": "Griffin Tunic",
      "/items/griffin_chaps": "Griffin Chaps",
      "/items/manticore_shield": "Manticore Shield",
      "/items/jackalope_staff": "Jackalope Staff",
      "/items/dodocamel_gauntlets": "Dodocamel Gauntlets",
      "/items/griffin_bulwark": "Griffin Bulwark",
      "/items/sinister_chest": "Sinister Chest",
      "/items/sinister_essence": "Sinister Essence",
      "/items/sinister_token": "Sinister Token",
      "/items/sinister_refinement_shard": "Sinister Refinement Shard",
      "/items/penetrating_strike": "Penetrating Strike",
      "/items/smoke_burst": "Smoke Burst",
      "/items/acrobats_ribbon": "Acrobat's Ribbon",
      "/items/magicians_cloth": "Magician's Cloth",
      "/items/chaotic_chain": "Chaotic Chain",
      "/items/cursed_ball": "Cursed Ball",
      "/items/sinister_chest_key": "Sinister Chest Key",
      "/items/sinister_cape": "Sinister Cape",
      "/items/acrobatic_hood": "Acrobatic Hood",
      "/items/magicians_hat": "Magician's Hat",
      "/items/chaotic_flail": "Chaotic Flail",
      "/items/cursed_bow": "Cursed Bow",
      "/items/enchanted_chest": "Enchanted Chest",
      "/items/enchanted_essence": "Enchanted Essence",
      "/items/enchanted_token": "Enchanted Token",
      "/items/enchanted_refinement_shard": "Enchanted Refinement Shard",
      "/items/penetrating_shot": "Penetrating Shot",
      "/items/retribution": "Retribution",
      "/items/mana_spring": "Mana Spring",
      "/items/knights_ingot": "Knight's Ingot",
      "/items/bishops_scroll": "Bishop's Scroll",
      "/items/royal_cloth": "Royal Cloth",
      "/items/regal_jewel": "Regal Jewel",
      "/items/sundering_jewel": "Sundering Jewel",
      "/items/enchanted_chest_key": "Enchanted Chest Key",
      "/items/enchanted_cloak": "Enchanted Cloak",
      "/items/knights_aegis": "Knight's Aegis",
      "/items/bishops_codex": "Bishop's Codex",
      "/items/royal_water_robe_top": "Royal Water Robe Top",
      "/items/royal_water_robe_bottoms": "Royal Water Robe Bottoms",
      "/items/royal_nature_robe_top": "Royal Nature Robe Top",
      "/items/royal_nature_robe_bottoms": "Royal Nature Robe Bottoms",
      "/items/royal_fire_robe_top": "Royal Fire Robe Top",
      "/items/royal_fire_robe_bottoms": "Royal Fire Robe Bottoms",
      "/items/furious_spear": "Furious Spear",
      "/items/regal_sword": "Regal Sword",
      "/items/sundering_crossbow": "Sundering Crossbow",
      "/items/pirate_chest": "Pirate Chest",
      "/items/pirate_essence": "Pirate Essence",
      "/items/pirate_token": "Pirate Token",
      "/items/pirate_refinement_shard": "Pirate Refinement Shard",
      "/items/fracturing_impact": "Fracturing Impact",
      "/items/life_drain": "Life Drain",
      "/items/marksman_brooch": "Marksman Brooch",
      "/items/corsair_crest": "Corsair Crest",
      "/items/damaged_anchor": "Damaged Anchor",
      "/items/maelstrom_plating": "Maelstrom Plating",
      "/items/kraken_leather": "Kraken Leather",
      "/items/kraken_fang": "Kraken Fang",
      "/items/pirate_chest_key": "Pirate Chest Key",
      "/items/marksman_bracers": "Marksman Bracers",
      "/items/corsair_helmet": "Corsair Helmet",
      "/items/anchorbound_plate_body": "Anchorbound Plate Body",
      "/items/anchorbound_plate_legs": "Anchorbound Plate Legs",
      "/items/maelstrom_plate_body": "Maelstrom Plate Body",
      "/items/maelstrom_plate_legs": "Maelstrom Plate Legs",
      "/items/kraken_tunic": "Kraken Tunic",
      "/items/kraken_chaps": "Kraken Chaps",
      "/items/rippling_trident": "Rippling Trident",
      "/items/blooming_trident": "Blooming Trident",
      "/items/blazing_trident": "Blazing Trident",
      "/items/mirror_of_protection": "Mirror Of Protection",
      "/items/artisan_tea": "Artisan Tea",
      "/items/umbral_leather": "Umbral Leather",
      "/items/beast_leather": "Beast Leather",
      "/items/holy_cheese": "Holy Cheese",
      "/items/rainbow_cheese": "Rainbow Cheese",
      "/items/radiant_fabric": "Radiant Fabric",
      "/items/silk_fabric": "Silk Fabric",
      "/items/arcane_lumber": "Arcane Lumber",
      "/items/redwood_lumber": "Redwood Lumber",
    }),
    "zh-Hans": Object.freeze({
      "/items/coin": "金币",
      "/items/cowbell": "牛铃",
      "/items/bag_of_10_cowbells": "牛铃袋 (10个)",
      "/items/pearl": "珍珠",
      "/items/amber": "琥珀",
      "/items/garnet": "石榴石",
      "/items/jade": "翡翠",
      "/items/amethyst": "紫水晶",
      "/items/moonstone": "月亮石",
      "/items/sunstone": "太阳石",
      "/items/blue_key_fragment": "\u84dd\u8272\u94a5\u5319\u788e\u7247",
      "/items/green_key_fragment": "\u7eff\u8272\u94a5\u5319\u788e\u7247",
      "/items/purple_key_fragment": "\u7d2b\u8272\u94a5\u5319\u788e\u7247",
      "/items/white_key_fragment": "\u767d\u8272\u94a5\u5319\u788e\u7247",
      "/items/orange_key_fragment": "\u6a59\u8272\u94a5\u5319\u788e\u7247",
      "/items/brown_key_fragment": "\u68d5\u8272\u94a5\u5319\u788e\u7247",
      "/items/stone_key_fragment": "\u77f3\u8d28\u94a5\u5319\u788e\u7247",
      "/items/dark_key_fragment": "\u6697\u8272\u94a5\u5319\u788e\u7247",
      "/items/burning_key_fragment": "\u71c3\u70e7\u94a5\u5319\u788e\u7247",
      "/items/small_treasure_chest": "小宝箱",
      "/items/medium_treasure_chest": "中宝箱",
      "/items/large_treasure_chest": "大宝箱",
      "/items/chimerical_chest": "奇幻宝箱",
      "/items/chimerical_essence": "奇幻精华",
      "/items/chimerical_token": "奇幻代币",
      "/items/chimerical_chest_key": "奇幻宝箱钥匙",
      "/items/chimerical_refinement_shard": "奇幻精炼碎片",
      "/items/shield_bash": "盾击",
      "/items/crippling_slash": "致残斩",
      "/items/pestilent_shot": "疫病射击",
      "/items/griffin_leather": "狮鹫之皮",
      "/items/manticore_sting": "蝎狮之刺",
      "/items/jackalope_antler": "鹿角兔之角",
      "/items/dodocamel_plume": "渡渡驼之翎",
      "/items/griffin_talon": "狮鹫之爪",
      "/items/chimerical_quiver": "奇幻箭袋",
      "/items/griffin_tunic": "狮鹫皮衣",
      "/items/griffin_chaps": "狮鹫皮裤",
      "/items/manticore_shield": "蝎狮盾",
      "/items/jackalope_staff": "鹿角兔之杖",
      "/items/dodocamel_gauntlets": "渡渡驼护手",
      "/items/griffin_bulwark": "狮鹫重盾",
      "/items/sinister_chest": "阴森宝箱",
      "/items/sinister_essence": "阴森精华",
      "/items/sinister_token": "阴森代币",
      "/items/sinister_refinement_shard": "阴森精炼碎片",
      "/items/penetrating_strike": "贯心之刺",
      "/items/smoke_burst": "烟爆灭影",
      "/items/acrobats_ribbon": "杂技师彩带",
      "/items/magicians_cloth": "魔术师织物",
      "/items/chaotic_chain": "混沌锁链",
      "/items/cursed_ball": "诅咒之球",
      "/items/sinister_chest_key": "阴森宝箱钥匙",
      "/items/sinister_cape": "阴森披风",
      "/items/acrobatic_hood": "杂技师兜帽",
      "/items/magicians_hat": "魔术师帽",
      "/items/chaotic_flail": "混沌连枷",
      "/items/cursed_bow": "咒怨之弓",
      "/items/enchanted_chest": "秘法宝箱",
      "/items/enchanted_essence": "秘法精华",
      "/items/enchanted_token": "秘法代币",
      "/items/enchanted_refinement_shard": "秘法精炼碎片",
      "/items/penetrating_shot": "贯穿射击",
      "/items/retribution": "惩戒",
      "/items/mana_spring": "法力喷泉",
      "/items/knights_ingot": "骑士之锭",
      "/items/bishops_scroll": "主教卷轴",
      "/items/royal_cloth": "皇家织物",
      "/items/regal_jewel": "君王宝石",
      "/items/sundering_jewel": "裂空宝石",
      "/items/enchanted_chest_key": "秘法宝箱钥匙",
      "/items/enchanted_cloak": "秘法披风",
      "/items/knights_aegis": "骑士盾",
      "/items/bishops_codex": "主教法典",
      "/items/royal_water_robe_top": "皇家水系袍服",
      "/items/royal_water_robe_bottoms": "皇家水系袍裙",
      "/items/royal_nature_robe_top": "皇家自然系袍服",
      "/items/royal_nature_robe_bottoms": "皇家自然系袍裙",
      "/items/royal_fire_robe_top": "皇家火系袍服",
      "/items/royal_fire_robe_bottoms": "皇家火系袍裙",
      "/items/furious_spear": "狂怒长枪",
      "/items/regal_sword": "君王之剑",
      "/items/sundering_crossbow": "裂空之弩",
      "/items/pirate_chest": "海盗宝箱",
      "/items/pirate_essence": "海盗精华",
      "/items/pirate_token": "海盗代币",
      "/items/pirate_refinement_shard": "海盗精炼碎片",
      "/items/fracturing_impact": "碎裂冲击",
      "/items/life_drain": "生命吸取",
      "/items/marksman_brooch": "神射胸针",
      "/items/corsair_crest": "掠夺者徽章",
      "/items/damaged_anchor": "破损船锚",
      "/items/maelstrom_plating": "怒涛甲片",
      "/items/kraken_leather": "克拉肯皮革",
      "/items/kraken_fang": "克拉肯之牙",
      "/items/pirate_chest_key": "海盗宝箱钥匙",
      "/items/marksman_bracers": "神射护腕",
      "/items/corsair_helmet": "掠夺者头盔",
      "/items/anchorbound_plate_body": "锚定胸甲",
      "/items/anchorbound_plate_legs": "锚定腿甲",
      "/items/maelstrom_plate_body": "怒涛胸甲",
      "/items/maelstrom_plate_legs": "怒涛腿甲",
      "/items/kraken_tunic": "克拉肯皮衣",
      "/items/kraken_chaps": "克拉肯皮裤",
      "/items/rippling_trident": "涟漪三叉戟",
      "/items/blooming_trident": "绽放三叉戟",
      "/items/blazing_trident": "炽焰三叉戟",
      "/items/mirror_of_protection": "保护之镜",
      "/items/artisan_tea": "工匠茶",
      "/items/umbral_leather": "暗影皮革",
      "/items/beast_leather": "野兽皮革",
      "/items/holy_cheese": "神圣奶酪",
      "/items/rainbow_cheese": "彩虹奶酪",
      "/items/radiant_fabric": "光辉布料",
      "/items/silk_fabric": "丝绸",
      "/items/arcane_lumber": "神秘木板",
      "/items/redwood_lumber": "红杉木板",
    }),
    "zh-Hant": Object.freeze({
      "/items/coin": "金幣",
      "/items/cowbell": "牛鈴",
      "/items/bag_of_10_cowbells": "牛鈴袋 (10個)",
      "/items/pearl": "珍珠",
      "/items/amber": "琥珀",
      "/items/garnet": "石榴石",
      "/items/jade": "翡翠",
      "/items/amethyst": "紫水晶",
      "/items/moonstone": "月亮石",
      "/items/sunstone": "太陽石",
      "/items/blue_key_fragment": "\u85cd\u8272\u9470\u5319\u788e\u7247",
      "/items/green_key_fragment": "\u7da0\u8272\u9470\u5319\u788e\u7247",
      "/items/purple_key_fragment": "\u7d2b\u8272\u9470\u5319\u788e\u7247",
      "/items/white_key_fragment": "\u767d\u8272\u9470\u5319\u788e\u7247",
      "/items/orange_key_fragment": "\u6a59\u8272\u9470\u5319\u788e\u7247",
      "/items/brown_key_fragment": "\u68d5\u8272\u9470\u5319\u788e\u7247",
      "/items/stone_key_fragment": "\u77f3\u8cea\u9470\u5319\u788e\u7247",
      "/items/dark_key_fragment": "\u6697\u8272\u9470\u5319\u788e\u7247",
      "/items/burning_key_fragment": "\u71c3\u71d2\u9470\u5319\u788e\u7247",
      "/items/small_treasure_chest": "小寶箱",
      "/items/medium_treasure_chest": "中寶箱",
      "/items/large_treasure_chest": "大寶箱",
      "/items/chimerical_chest": "奇幻寶箱",
      "/items/chimerical_essence": "奇幻精華",
      "/items/chimerical_token": "奇幻代幣",
      "/items/chimerical_chest_key": "奇幻寶箱鑰匙",
      "/items/chimerical_refinement_shard": "奇幻精煉碎片",
      "/items/shield_bash": "盾擊",
      "/items/crippling_slash": "致殘斬",
      "/items/pestilent_shot": "疫病射擊",
      "/items/griffin_leather": "獅鷲之皮",
      "/items/manticore_sting": "蠍獅之刺",
      "/items/jackalope_antler": "鹿角兔之角",
      "/items/dodocamel_plume": "渡渡駝之翎",
      "/items/griffin_talon": "獅鷲之爪",
      "/items/chimerical_quiver": "奇幻箭袋",
      "/items/griffin_tunic": "獅鷲皮衣",
      "/items/griffin_chaps": "獅鷲皮褲",
      "/items/manticore_shield": "蠍獅盾",
      "/items/jackalope_staff": "鹿角兔之杖",
      "/items/dodocamel_gauntlets": "渡渡駝護手",
      "/items/griffin_bulwark": "獅鷲重盾",
      "/items/sinister_chest": "陰森寶箱",
      "/items/sinister_essence": "陰森精華",
      "/items/sinister_token": "陰森代幣",
      "/items/sinister_refinement_shard": "陰森精煉碎片",
      "/items/penetrating_strike": "貫心之刺",
      "/items/smoke_burst": "煙爆滅影",
      "/items/acrobats_ribbon": "雜技師彩帶",
      "/items/magicians_cloth": "魔術師織物",
      "/items/chaotic_chain": "混沌鎖鏈",
      "/items/cursed_ball": "詛咒之球",
      "/items/sinister_chest_key": "陰森寶箱鑰匙",
      "/items/sinister_cape": "陰森披風",
      "/items/acrobatic_hood": "雜技師兜帽",
      "/items/magicians_hat": "魔術師帽",
      "/items/chaotic_flail": "混沌連枷",
      "/items/cursed_bow": "咒怨之弓",
      "/items/enchanted_chest": "秘法寶箱",
      "/items/enchanted_essence": "秘法精華",
      "/items/enchanted_token": "秘法代幣",
      "/items/enchanted_refinement_shard": "秘法精煉碎片",
      "/items/penetrating_shot": "貫穿射擊",
      "/items/retribution": "懲戒",
      "/items/mana_spring": "法力噴泉",
      "/items/knights_ingot": "騎士之錠",
      "/items/bishops_scroll": "主教卷軸",
      "/items/royal_cloth": "皇家織物",
      "/items/regal_jewel": "君王寶石",
      "/items/sundering_jewel": "裂空寶石",
      "/items/enchanted_chest_key": "秘法寶箱鑰匙",
      "/items/enchanted_cloak": "秘法披風",
      "/items/knights_aegis": "騎士盾",
      "/items/bishops_codex": "主教法典",
      "/items/royal_water_robe_top": "皇家水系袍服",
      "/items/royal_water_robe_bottoms": "皇家水系袍裙",
      "/items/royal_nature_robe_top": "皇家自然系袍服",
      "/items/royal_nature_robe_bottoms": "皇家自然系袍裙",
      "/items/royal_fire_robe_top": "皇家火系袍服",
      "/items/royal_fire_robe_bottoms": "皇家火系袍裙",
      "/items/furious_spear": "狂怒長槍",
      "/items/regal_sword": "君王之劍",
      "/items/sundering_crossbow": "裂空之弩",
      "/items/pirate_chest": "海盜寶箱",
      "/items/pirate_essence": "海盜精華",
      "/items/pirate_token": "海盜代幣",
      "/items/pirate_refinement_shard": "海盜精煉碎片",
      "/items/fracturing_impact": "碎裂衝擊",
      "/items/life_drain": "生命吸取",
      "/items/marksman_brooch": "神射胸針",
      "/items/corsair_crest": "掠奪者徽章",
      "/items/damaged_anchor": "破損船錨",
      "/items/maelstrom_plating": "怒濤甲片",
      "/items/kraken_leather": "克拉肯皮革",
      "/items/kraken_fang": "克拉肯之牙",
      "/items/pirate_chest_key": "海盜寶箱鑰匙",
      "/items/marksman_bracers": "神射護腕",
      "/items/corsair_helmet": "掠奪者頭盔",
      "/items/anchorbound_plate_body": "錨定胸甲",
      "/items/anchorbound_plate_legs": "錨定腿甲",
      "/items/maelstrom_plate_body": "怒濤胸甲",
      "/items/maelstrom_plate_legs": "怒濤腿甲",
      "/items/kraken_tunic": "克拉肯皮衣",
      "/items/kraken_chaps": "克拉肯皮褲",
      "/items/rippling_trident": "漣漪三叉戟",
      "/items/blooming_trident": "綻放三叉戟",
      "/items/blazing_trident": "熾焰三叉戟",
      "/items/mirror_of_protection": "保護之鏡",
      "/items/artisan_tea": "工匠茶",
      "/items/umbral_leather": "暗影皮革",
      "/items/beast_leather": "野獸皮革",
      "/items/holy_cheese": "神聖奶酪",
      "/items/rainbow_cheese": "彩虹奶酪",
      "/items/radiant_fabric": "光輝布料",
      "/items/silk_fabric": "絲綢",
      "/items/arcane_lumber": "神秘木板",
      "/items/redwood_lumber": "紅杉木板",
    }),
  });

  function getLang() {
    return window.SiteI18n?.getLang?.() || document.documentElement?.dataset?.lang || "en";
  }

  function getTranslationMap(lang = getLang()) {
    return ITEM_NAME_TRANSLATIONS[lang] || ITEM_NAME_TRANSLATIONS.en || Object.freeze({});
  }

  const ITEM_PATCH_FLAG = "__dungeonItemNameI18nPatched";
  const ITEM_BASE_NAME = "__dungeonItemNameBase";

  function getItemMaps(initData) {
    const itemMaps = [];
    if (initData?.itemDetailMap && typeof initData.itemDetailMap === "object") itemMaps.push(initData.itemDetailMap);
    if (initData?.itemMap && typeof initData.itemMap === "object" && initData.itemMap !== initData.itemDetailMap) itemMaps.push(initData.itemMap);
    if (initData?.items && typeof initData.items === "object" && initData.items !== initData.itemDetailMap && initData.items !== initData.itemMap) itemMaps.push(initData.items);
    return itemMaps;
  }

  function patchTranslatedNameGetter(item, hrid, fieldName, fallbackName) {
    const desc = Object.getOwnPropertyDescriptor(item, fieldName);
    const enumerable = desc ? !!desc.enumerable : true;
    Object.defineProperty(item, fieldName, {
      configurable: true,
      enumerable,
      get() {
        return getTranslatedItemName(hrid, item[ITEM_BASE_NAME] || fallbackName || hrid);
      },
    });
  }

  function patchItemRecord(item, hrid) {
    if (!item || typeof item !== "object") return;
    if (item[ITEM_PATCH_FLAG]) return;
    if (Object.isFrozen(item)) return;

    const fallbackName =
      ITEM_NAME_TRANSLATIONS.en?.[hrid] ||
      (typeof item.name === "string" && item.name) ||
      (typeof item.displayName === "string" && item.displayName) ||
      (typeof item.localizedName === "string" && item.localizedName) ||
      hrid;

    try {
      Object.defineProperty(item, ITEM_BASE_NAME, {
        value: String(fallbackName || hrid),
        configurable: true,
        enumerable: false,
        writable: false,
      });

      patchTranslatedNameGetter(item, hrid, "name", fallbackName);
      if (Object.prototype.hasOwnProperty.call(item, "displayName")) {
        patchTranslatedNameGetter(item, hrid, "displayName", fallbackName);
      }
      if (Object.prototype.hasOwnProperty.call(item, "localizedName")) {
        patchTranslatedNameGetter(item, hrid, "localizedName", fallbackName);
      }

      Object.defineProperty(item, ITEM_PATCH_FLAG, {
        value: true,
        configurable: false,
        enumerable: false,
        writable: false,
      });
    } catch (_) { }
  }

  function applyItemNameTranslations(initData, lang = getLang()) {
    if (!initData || typeof initData !== "object") return initData;
    const itemMaps = getItemMaps(initData);
    if (!itemMaps.length) return initData;
    const hrids = Array.from(new Set(
      Object.values(ITEM_NAME_TRANSLATIONS || {}).flatMap(map => Object.keys(map || {}))
    ));
    hrids.forEach((hrid) => {
      itemMaps.forEach((itemMap) => {
        patchItemRecord(itemMap?.[hrid], hrid);
      });
    });
    return initData;
  }

  function getTranslatedItemName(hrid, fallback = "", lang = getLang()) {
    return getTranslationMap(lang)?.[hrid] || ITEM_NAME_TRANSLATIONS.en?.[hrid] || fallback || hrid;
  }

  document.addEventListener("site:lang-changed", () => {
    try {
      applyItemNameTranslations(window.InitCharacterData, getLang());
    } catch (_) { }
  });

  try {
    if (window.InitCharacterData) applyItemNameTranslations(window.InitCharacterData);
  } catch (_) { }

  window.DungeonItemNameI18n = {
    applyItemNameTranslations,
    getTranslatedItemName,
    getTranslationMap,
  };
})();
