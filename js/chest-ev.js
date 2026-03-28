/* js/chest-ev.js
   Refactored EV engine:
   - All openable drop math is sourced from OpenableLootRaw (openable-loot-raw.js)
   - No hardcoded CHEST_DROPS/LARGE_CHEST_DROPS used for EV
   - Still supports: market bid/ask, manual overrides, special-item policy, token value inference, devtools breakdown.

   Exports:
     window.DungeonChestEV = {
       computeDungeonChestEV,
       getDungeonChestItems,
       getEvRelevantHrids,
       getShopConversions
     };
*/
(() => {
  "use strict";

  // ----------------------------
  // Keys / constants
  // ----------------------------
  const UI_KEY_MAP = {
    chimerical_den: "chimerical",
    sinister_circus: "sinister",
    enchanted_fortress: "enchanted",
    pirate_cove: "pirate",
  };

  const DUNGEON_TO_CHEST_ITEM_HRID = {
    chimerical: { chest: "/items/chimerical_chest", refined: "/items/chimerical_refinement_chest" },
    sinister: { chest: "/items/sinister_chest", refined: "/items/sinister_refinement_chest" },
    enchanted: { chest: "/items/enchanted_chest", refined: "/items/enchanted_refinement_chest" },
    pirate: { chest: "/items/pirate_chest", refined: "/items/pirate_refinement_chest" },
  };

  const LARGE_TREASURE_CHEST_HRID = "/items/large_treasure_chest";
  const COIN_HRID = "/items/coin";
  const COWBELL_HRID = "/items/cowbell";

  // Special items (policy-controlled)
  const MIRROR_OF_PROTECTION_HRID = "/items/mirror_of_protection";
  const SPECIAL_ITEM_HRIDS = new Set([
    "/items/sinister_cape",
    "/items/enchanted_cloak",
    "/items/chimerical_quiver",
  ]);

  const ESSENCE_BY_SPECIAL_HRID = {
    "/items/sinister_cape": "/items/sinister_essence",
    "/items/enchanted_cloak": "/items/enchanted_essence",
    "/items/chimerical_quiver": "/items/chimerical_essence",
  };

  const SPECIAL_ESSENCE_QTY = 2000;

  // ----------------------------
  // Small utils
  // ----------------------------
  function getShared(name) {
    return window[name] || null;
  }

  function uiToShortDungeonKey(dungeonKey) {
    const shared = getShared("DungeonMetaShared");
    if (shared && typeof shared.shortForUiOrSelf === "function") {
      return shared.shortForUiOrSelf(dungeonKey);
    }
    return UI_KEY_MAP[dungeonKey] || dungeonKey;
  }

  function safeNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function getStorageShared() {
    return getShared("DungeonStorageShared");
  }

  function storageCall(methodName, ...args) {
    const method = getStorageShared()?.[methodName];
    if (typeof method === "function") return method(...args);
    return localStorage[methodName](...args);
  }

  function storageGetItem(key) {
    return storageCall("getItem", key);
  }

  function pickSide(priceObj, side) {
    if (!priceObj) return null;
    const v = (side === "ask") ? priceObj.ask : priceObj.bid;
    return (typeof v === "number" && Number.isFinite(v)) ? v : null;
  }

  function getSpecialPolicyMode() {
    try {
      const cfg = window.DungeonConfig?.specialItemPolicyMode;
      if (cfg) return String(cfg);
      const legacyConfigName = String.fromCharCode(68, 117, 110, 103, 101, 110, 67, 111, 110, 102, 105, 103);
      const legacyCfg = window[legacyConfigName]?.specialItemPolicyMode;
      if (legacyCfg) return String(legacyCfg);
    } catch (_) { }
    try {
      return storageGetItem("dungeon.specialPolicyMode") || "essence2000";
    } catch (_) {
      return "essence2000";
    }
  }

  function getInitDataShared() {
    return getShared("DungeonInitDataShared");
  }

  function getItemHridShared() {
    return getShared("DungeonItemHridShared");
  }

  // ----------------------------
  // Init + OpenableLootRaw
  // ----------------------------
  async function ensureInit() {
    const shared = getInitDataShared();
    if (shared && typeof shared.getInitData === "function") {
      const data = await shared.getInitData();
      if (data) return data;
    }
    if (window.InitCharacterData) return window.InitCharacterData;
    if (window.InitLoader?.loadInitData) return await window.InitLoader.loadInitData();
    return null;
  }

  async function ensureOpenableLootRaw() {
    if (!window.OpenableLootRaw?.ready) {
      throw new Error("OpenableLootRaw not loaded. Add <script src='./js/openable-loot-raw.js' defer></script> before chest-ev.js");
    }
    await window.OpenableLootRaw.ready();
    return window.OpenableLootRaw;
  }

  function nameForHrid(hrid, init) {
    try {
      const it =
        init?.itemDetailMap?.[hrid] ||
        init?.itemMap?.[hrid] ||
        init?.items?.[hrid];
      return it?.name || it?.displayName || it?.localizedName || null;
    } catch (_) {
      return null;
    }
  }

  // ----------------------------
  // Market price + overrides
  // ----------------------------
  function getMarketPrice(marketData, hrid, enhancementLevel = 0, priceOverrides = null) {
    if (!hrid) return null;

    // Manual override first
    if (priceOverrides && Object.prototype.hasOwnProperty.call(priceOverrides, hrid)) {
      const ov = priceOverrides[hrid];

      if (typeof ov === "number" && Number.isFinite(ov)) {
        return { ask: ov, bid: ov, overridden: true };
      }

      if (ov && typeof ov === "object") {
        const mode = String(ov.mode || "").toLowerCase();
        const p = safeNum(ov.price);

        if (mode === "custom" && Number.isFinite(p)) {
          return { ask: p, bid: p, overridden: true };
        }

        // "bid"/"ask" modes: still come from market, but treat as overridden choice
        const base = getMarketPrice(marketData, hrid, enhancementLevel, null);
        if (!base) return { ask: 0, bid: 0, overridden: true };

        if (mode === "bid") {
          const b = pickSide(base, "bid");
          return { ask: b, bid: b, overridden: true };
        }
        if (mode === "ask") {
          const a = pickSide(base, "ask");
          return { ask: a, bid: a, overridden: true };
        }

        return { ask: 0, bid: 0, overridden: true };
      }

      // explicit "off"/null -> 0 override
      return { ask: 0, bid: 0, overridden: true };
    }

    const entry = marketData?.[hrid];
    if (!entry) return null;

    // Common shape: {a,b}
    if (typeof entry.a === "number" || typeof entry.b === "number") {
      return {
        ask: (typeof entry.a === "number") ? entry.a : null,
        bid: (typeof entry.b === "number") ? entry.b : null,
        overridden: false,
      };
    }

    // Enhancement map shape: {"0":{a,b}, ...}
    if (typeof entry === "object") {
      const lvl = entry[String(enhancementLevel)] || entry["0"] || Object.values(entry)[0];
      if (!lvl) return null;
      return {
        ask: (typeof lvl.a === "number") ? lvl.a : null,
        bid: (typeof lvl.b === "number") ? lvl.b : null,
        overridden: false,
      };
    }

    return null;
  }

  // ----------------------------
  // Token-shop offers extraction (init-driven)
  // ----------------------------
  const SHOP_OFFERS_CACHE = new Map(); // dk -> Array<{itemHrid, tokenCost}>

  function readTokenCostFromOfferObj(obj, tokenHrid) {
    if (!obj || typeof obj !== "object") return null;

    const itemHrid =
      (typeof obj.itemHrid === "string" && obj.itemHrid.startsWith("/items/")) ? obj.itemHrid :
        (typeof obj.rewardItemHrid === "string" && obj.rewardItemHrid.startsWith("/items/")) ? obj.rewardItemHrid :
          null;

    if (!itemHrid) return null;

    // Pattern A: currencyHrid + cost
    const currencyHrid = obj.currencyHrid || obj.currencyItemHrid || obj.costHrid || obj.costItemHrid;
    const costA = safeNum(obj.cost ?? obj.price ?? obj.tokenCost ?? obj.amount);
    if (currencyHrid === tokenHrid && Number.isFinite(costA) && costA > 0) {
      return { itemHrid, tokenCost: costA };
    }

    // Pattern B: costItems array
    const costItems = obj.costItems || obj.costItemList || obj.costs || null;
    if (Array.isArray(costItems)) {
      for (const c of costItems) {
        if (!c || typeof c !== "object") continue;
        const h = c.itemHrid || c.hrid || c.currencyHrid;
        const cnt = safeNum(c.count ?? c.qty ?? c.amount ?? c.cost);
        if (h === tokenHrid && Number.isFinite(cnt) && cnt > 0) {
          return { itemHrid, tokenCost: cnt };
        }
      }
    }

    // Pattern C: costItem object
    const costItem = obj.costItem || obj.cost || null;
    if (costItem && typeof costItem === "object") {
      const h = costItem.itemHrid || costItem.hrid || costItem.currencyHrid;
      const cnt = safeNum(costItem.count ?? costItem.qty ?? costItem.amount ?? costItem.cost);
      if (h === tokenHrid && Number.isFinite(cnt) && cnt > 0) {
        return { itemHrid, tokenCost: cnt };
      }
    }

    return null;
  }

  function collectOffersFromShopishSections(init, tokenHrid) {
    const out = new Map(); // itemHrid -> min tokenCost

    const shopKeys = Object.keys(init || {}).filter(k => /shop|vendor|store|merchant/i.test(k));
    const stack = [];

    for (const k of shopKeys) stack.push(init[k]);

    let steps = 0;
    const MAX_STEPS = 2000000;

    while (stack.length && steps < MAX_STEPS) {
      const cur = stack.pop();
      steps++;

      if (!cur) continue;

      if (Array.isArray(cur)) {
        for (let i = 0; i < cur.length; i++) stack.push(cur[i]);
        continue;
      }

      if (typeof cur === "object") {
        const offer = readTokenCostFromOfferObj(cur, tokenHrid);
        if (offer) {
          const prev = out.get(offer.itemHrid);
          if (prev == null || offer.tokenCost < prev) out.set(offer.itemHrid, offer.tokenCost);
        }

        for (const v of Object.values(cur)) stack.push(v);
      }
    }

    return Array.from(out.entries()).map(([itemHrid, tokenCost]) => ({ itemHrid, tokenCost }));
  }

  function collectOffersFromShopItemDetailMap(init, tokenHrid) {
    const out = new Map(); // itemHrid -> min tokenCost
    const map = init?.shopItemDetailMap || {};
    for (const entry of Object.values(map)) {
      const offer = readTokenCostFromOfferObj(entry, tokenHrid);
      if (!offer) continue;
      const prev = out.get(offer.itemHrid);
      if (prev == null || offer.tokenCost < prev) out.set(offer.itemHrid, offer.tokenCost);
    }
    return Array.from(out.entries()).map(([itemHrid, tokenCost]) => ({ itemHrid, tokenCost }));
  }

  async function getDungeonTokenShopOffers(dk) {
    if (SHOP_OFFERS_CACHE.has(dk)) return SHOP_OFFERS_CACHE.get(dk);

    const init = await ensureInit();
    const tokenHrid = `/items/${dk}_token`;
    let offers = [];
    if (init) {
      offers = collectOffersFromShopItemDetailMap(init, tokenHrid);
      if (!offers.length) offers = collectOffersFromShopishSections(init, tokenHrid);
    }
    SHOP_OFFERS_CACHE.set(dk, offers);
    return offers;
  }

  async function computeTokenValue(dk, marketData, side, priceOverrides) {
    const tokenHrid = `/items/${dk}_token`;
    const offers = await getDungeonTokenShopOffers(dk);

    let tokenValue = 0;
    let bestConversion = null;
    const missingConversions = [];

    for (const offer of offers) {
      const p = getMarketPrice(marketData, offer.itemHrid, 0, priceOverrides);
      const price = pickSide(p, side);

      if (typeof price !== "number" || price <= 0) continue;
      if (!(offer.tokenCost > 0)) continue;

      const cpt = price / offer.tokenCost; // coins per token
      if (cpt > tokenValue) {
        tokenValue = cpt;
        bestConversion = {
          itemHrid: offer.itemHrid,
          tokenCost: offer.tokenCost,
          price,
          coinsPerToken: cpt,
        };
      }
    }

    // Fallback: use essence as 1-token anchor if offers didn’t price
    if (!tokenValue) {
      const essenceHrid = `/items/${dk}_essence`;
      const p = getMarketPrice(marketData, essenceHrid, 0, priceOverrides);
      const price = pickSide(p, side);
      if (typeof price === "number" && price > 0) {
        tokenValue = price;
        bestConversion = { itemHrid: essenceHrid, tokenCost: 1, price, coinsPerToken: price };
      } else {
        missingConversions.push(`(no price) ${essenceHrid}`);
      }
    }

    // If still 0, note for debugging
    if (!tokenValue) missingConversions.push(`(no priced shop conversions) /items/${dk}_token`);

    return { tokenHrid, tokenValue, bestConversion, missingConversions, offers };
  }

  function buildTokenShopValueByHrid(offers, tokenValue) {
    const m = Object.create(null);
    if (!offers || !offers.length || !(tokenValue > 0)) return m;
    for (const o of offers) {
      if (o?.itemHrid && o?.tokenCost > 0) m[o.itemHrid] = o.tokenCost * tokenValue;
    }
    return m;
  }

  // ----------------------------
  // Cowbell each value (bag-of-10 if discoverable, else cowbell)
  // ----------------------------
  let COWBELL_BAG_HRID_CACHE = null;

  async function findCowbellBagHrid() {
    if (COWBELL_BAG_HRID_CACHE) return COWBELL_BAG_HRID_CACHE;
    const init = await ensureInit();

    // Common guesses first
    const guesses = [
      "/items/bag_of_10_cowbells",
      "/items/cowbell_bag",
      "/items/bag_of_cowbells",
    ];

    for (const g of guesses) {
      const nm = nameForHrid(g, init);
      if (nm && /cowbell/i.test(nm) && /10/.test(nm)) {
        COWBELL_BAG_HRID_CACHE = g;
        return g;
      }
    }

    // Scan itemDetailMap for a name that looks like “Bag of 10 Cowbells”
    const map = init?.itemDetailMap || {};
    for (const [hrid, it] of Object.entries(map)) {
      const name = String(it?.name || "");
      const n = name.toLowerCase();
      if (n.includes("cowbell") && n.includes("bag") && n.includes("10")) {
        COWBELL_BAG_HRID_CACHE = hrid;
        return hrid;
      }
    }

    return null;
  }

  async function computeCowbellEachValue(marketData, side, priceOverrides) {
    const bagHrid = await findCowbellBagHrid();
    const altSide = (side === "ask") ? "bid" : "ask";

    if (bagHrid) {
      const p = getMarketPrice(marketData, bagHrid, 0, priceOverrides);
      const price = pickSide(p, side);
      if (typeof price === "number" && price > 0) {
        return { each: price / 10, source: "bag10", missing: [] };
      }
      const altPrice = pickSide(p, altSide);
      if (typeof altPrice === "number" && altPrice > 0) {
        return { each: altPrice / 10, source: "bag10-alt", missing: [] };
      }
    }

    const p2 = getMarketPrice(marketData, COWBELL_HRID, 0, priceOverrides);
    const price2 = pickSide(p2, side);
    if (typeof price2 === "number" && price2 > 0) {
      return { each: price2, source: "cowbell", missing: [] };
    }
    const altPrice2 = pickSide(p2, altSide);
    if (typeof altPrice2 === "number" && altPrice2 > 0) {
      return { each: altPrice2, source: "cowbell-alt", missing: [] };
    }

    return {
      each: 0,
      source: "missing",
      missing: ["(no price) Cowbell (or bag-of-10)"],
    };
  }

  // ----------------------------
  // EV for openables (uses OpenableLootRaw rows)
  // ----------------------------
  async function computeOpenableEV(openableHrid, marketData, side, ctx, memo, priceOverrides) {
    const init = await ensureInit();
    const raw = await ensureOpenableLootRaw();

    memo = memo || new Map();
    const memoKey = `${openableHrid}|${side}`;
    if (memo.has(memoKey)) return memo.get(memoKey);

    const rows = raw.getDirectDetailRows(openableHrid) || [];
    if (!rows.length) return null;

    const breakdown = [];
    const missingSet = ctx?.missingSet || new Set();

    for (const r of rows) {
      const itemHrid = r.itemHrid;
      const p = Number.isFinite(r.chance) ? r.chance : 0;
      const meanQty = Number.isFinite(r.meanCount) ? r.meanCount : 0;

      // unit value resolution (override -> special -> token-like/cowbell/coin -> market -> openableEV -> tokenShop fallback -> 0)
      let unitValue = null;
      let valuedVia = "unpriced";

      const mp = getMarketPrice(marketData, itemHrid, 0, priceOverrides);
      const overridden = !!mp?.overridden;
      const marketSidePrice = pickSide(mp, side);

      // 1) override (explicit)
      if (overridden) {
        unitValue = (typeof marketSidePrice === "number" && Number.isFinite(marketSidePrice)) ? marketSidePrice : 0;
        valuedVia = "override";
      }

      // 2) special item policy (only if not overridden)
      if (!overridden && SPECIAL_ITEM_HRIDS.has(itemHrid)) {
        const mode = getSpecialPolicyMode();
        if (mode === "exclude") {
          unitValue = 0;
          valuedVia = "special:excluded";
        } else if (mode === "mirror") {
          const mp2 = getMarketPrice(marketData, MIRROR_OF_PROTECTION_HRID, 0, priceOverrides);
          const mv = pickSide(mp2, side);
          unitValue = (typeof mv === "number" && Number.isFinite(mv)) ? mv : 0;
          valuedVia = (unitValue > 0) ? "special:mirror" : "special:mirror-unpriced";
          if (!unitValue) missingSet.add("(no price) Mirror of Protection");
        } else {
          const essHrid = ESSENCE_BY_SPECIAL_HRID[itemHrid];
          const mp3 = essHrid ? getMarketPrice(marketData, essHrid, 0, priceOverrides) : null;
          const ev = pickSide(mp3, side);
          unitValue = (typeof ev === "number" && Number.isFinite(ev) && ev > 0) ? (ev * SPECIAL_ESSENCE_QTY) : 0;
          valuedVia = (unitValue > 0) ? "special:essence*2000" : "special:essence-unpriced";
          if (!unitValue) missingSet.add(`(no price) ${essHrid || "essence"}`);
        }
      }

      // 3) coin / cowbell / token-like (only if not overridden and not special)
      if (unitValue == null && !SPECIAL_ITEM_HRIDS.has(itemHrid)) {
        if (itemHrid === COIN_HRID) {
          unitValue = 1;
          valuedVia = "coin";
        } else if (itemHrid === COWBELL_HRID && ctx?.cowbellEach > 0) {
          unitValue = ctx.cowbellEach;
          valuedVia = `cowbell:${ctx.cowbellSource || "each"}`;
        } else if (ctx?.tokenLikeHrids?.has(itemHrid) && ctx?.tokenValue > 0) {
          unitValue = ctx.tokenValue;
          valuedVia = "tokenValue";
        }
      }

      // 4) market
      if (unitValue == null && typeof marketSidePrice === "number" && Number.isFinite(marketSidePrice) && marketSidePrice > 0) {
        unitValue = marketSidePrice;
        valuedVia = "market";
      }

      // 5) nested openable -> EV of that openable
      if (unitValue == null && !SPECIAL_ITEM_HRIDS.has(itemHrid)) {
        // Only treat as openable if it has rows
        const subRows = raw.getDirectDetailRows(itemHrid);
        if (subRows && subRows.length) {
          const sub = await computeOpenableEV(itemHrid, marketData, side, ctx, memo, priceOverrides);
          if (sub && typeof sub.ev === "number") {
            unitValue = sub.ev;
            valuedVia = "openableEV";
          }
        }
      }

      // 6) token-shop implied fallback (only if not overridden and not special)
      if (unitValue == null && !SPECIAL_ITEM_HRIDS.has(itemHrid)) {
        const implied = ctx?.tokenShopValueByHrid?.[itemHrid];
        if (typeof implied === "number" && Number.isFinite(implied) && implied > 0) {
          unitValue = implied;
          valuedVia = "tokenShop";
        }
      }

      // default 0
      if (unitValue == null) unitValue = 0;

      const contrib = unitValue * meanQty * p;

      if (!overridden && unitValue === 0 && meanQty * p > 0) {
        const nm = nameForHrid(itemHrid, init) || itemHrid;
        if (itemHrid !== COIN_HRID && !ctx?.tokenLikeHrids?.has(itemHrid)) {
          missingSet.add(`(no price) ${nm}`);
        }
      }

      breakdown.push({
        item: nameForHrid(itemHrid, init) || itemHrid,
        hrid: itemHrid,
        chance: p,
        meanQty,
        unitValue,
        contrib,
        valuedVia,
      });
    }

    const ev = breakdown.reduce((s, x) => s + (Number(x.contrib) || 0), 0);
    breakdown.sort((a, b) => (b.contrib - a.contrib) || String(a.item).localeCompare(String(b.item)));

    const result = { ev, breakdown };
    memo.set(memoKey, result);
    return result;
  }

  // ----------------------------
  // Core compute: dungeon chest EV
  // ----------------------------
  async function computeDungeonChestEV({ dungeonKey, marketData, side = "bid", priceOverrides = null }) {
    const dk = uiToShortDungeonKey(dungeonKey);

    if (!marketData) {
      return {
        chestEv: null,
        refinedChestEv: null,
        largeChestOpenEv: null,
        cowbellEachValue: null,
        cowbellEachSource: null,
        refinedShardName: null,
        refinedShardUnitValue: null,
        refinedExpectedShards: null,
        refinedValuedVia: null,
        tokenValue: null,
        bestConversion: null,
        missingItems: ["(no marketData)"],
        breakdown: [],
        missingConversions: ["(no marketData)"],
      };
    }

    await ensureOpenableLootRaw();
    const init = await ensureInit();

    const chestHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.chest;
    const refinedHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.refined;

    if (!chestHrid || !refinedHrid) {
      throw new Error(`Unknown dungeonKey: ${dungeonKey}`);
    }

    // Token value + implied values
    const tokenInfo = await computeTokenValue(dk, marketData, side, priceOverrides);
    const tokenValue = tokenInfo.tokenValue;
    const bestConversion = tokenInfo.bestConversion;
    const tokenShopValueByHrid = buildTokenShopValueByHrid(tokenInfo.offers, tokenValue);

    // Cowbell
    const cowbellEachInfo = await computeCowbellEachValue(marketData, side, priceOverrides);

    // Context shared for openable valuation
    const missingSet = new Set();

    const tokenLikeHrids = new Set([`/items/${dk}_token`]);

    const ctx = {
      tokenValue,
      tokenLikeHrids,
      cowbellEach: cowbellEachInfo.each,
      cowbellSource: cowbellEachInfo.source,
      tokenShopValueByHrid,
      missingSet,
    };

    const memo = new Map();

    // Large Treasure Chest open EV (used for display + nested rows)
    const largeRes = await computeOpenableEV(LARGE_TREASURE_CHEST_HRID, marketData, side, ctx, memo, priceOverrides);
    const largeChestOpenEv = largeRes?.ev ?? 0;

    // Refined chest EV + expected shards
    const raw = window.OpenableLootRaw;
    const refinedExpectedMap = raw.getExpectedMap(refinedHrid, { resolveNested: false });
    let refinedExpectedShards = 0;
    let refinedShardHrid = null;
    for (const [h, q] of Object.entries(refinedExpectedMap || {})) {
      const qq = Number(q);
      if (Number.isFinite(qq) && qq > 0) {
        refinedExpectedShards += qq;
        refinedShardHrid = refinedShardHrid || h;
      }
    }

    const refinedShardName = refinedShardHrid ? (nameForHrid(refinedShardHrid, init) || refinedShardHrid) : null;

    // Unit value for shard: market or token-shop implied
    let refinedShardUnitValue = 0;
    let refinedValuedVia = "unpriced";

    if (refinedShardHrid) {
      const mp = getMarketPrice(marketData, refinedShardHrid, 0, priceOverrides);
      const px = pickSide(mp, side);
      if (typeof px === "number" && px > 0) {
        refinedShardUnitValue = px;
        refinedValuedVia = mp?.overridden ? "override" : "market";
      } else {
        const implied = tokenShopValueByHrid[refinedShardHrid];
        if (typeof implied === "number" && implied > 0) {
          refinedShardUnitValue = implied;
          refinedValuedVia = "tokenShop";
        } else if (tokenValue > 0) {
          // Common known shard cost fallback (if shop parsing didn’t find it)
          refinedShardUnitValue = 2000 * tokenValue;
          refinedValuedVia = "tokenShop:fallback2000";
        } else {
          missingSet.add(`(no token value) ${refinedShardName || refinedShardHrid}`);
        }
      }
    }

    const refinedChestEv = refinedShardUnitValue * refinedExpectedShards;

    // Main chest EV (this uses OpenableLootRaw rows + nested openables)
    const chestRes = await computeOpenableEV(chestHrid, marketData, side, ctx, memo, priceOverrides);
    const chestEv = chestRes?.ev ?? 0;
    const breakdown = chestRes?.breakdown || [];

    return {
      chestEv,
      refinedChestEv,
      largeChestOpenEv,
      cowbellEachValue: cowbellEachInfo.each,
      cowbellEachSource: cowbellEachInfo.source,
      refinedShardName,
      refinedShardUnitValue,
      refinedExpectedShards,
      refinedValuedVia,
      tokenValue,
      bestConversion,
      missingItems: Array.from(missingSet),
      breakdown,
      missingConversions: tokenInfo.missingConversions || [],
    };
  }

  // ----------------------------
  // UI helpers used by landing.js
  // ----------------------------
  function hridToSvgFilename(hrid) {
    const shared = getItemHridShared();
    if (shared && typeof shared.filenameFromItemHrid === "function") {
      return shared.filenameFromItemHrid(hrid);
    }
    if (!hrid || typeof hrid !== "string") return null;
    const m = hrid.match(/^\/items\/([^/]+)$/);
    if (!m) return null;
    const id = m[1];
    return id.length ? `${id[0].toUpperCase()}${id.slice(1)}.svg` : null;
  }

  function buildDropIconPath(hrid) {
    const shared = getItemHridShared();
    if (shared && typeof shared.iconPathFromHrid === "function") {
      return shared.iconPathFromHrid(hrid, "./assets/Svg/");
    }
    const file = hridToSvgFilename(hrid);
    if (!file) return null;
    return `./assets/Svg/${encodeURIComponent(file).replace(/%2F/g, "/")}`;
  }

  function resolveManualLootDefaultPrice(hrid, marketData, side, ctx = {}) {
    if (!hrid) return null;

    if (hrid === LARGE_TREASURE_CHEST_HRID) {
      const openableEv = safeNum(ctx.evInfo?.largeChestOpenEv);
      if (Number.isFinite(openableEv) && openableEv > 0) return openableEv;
    }

    if (hrid === COWBELL_HRID) {
      const cowbellEach = safeNum(ctx.evInfo?.cowbellEachValue);
      if (Number.isFinite(cowbellEach) && cowbellEach > 0) return cowbellEach;
    }

    if (hrid === ctx.tokenHrid) {
      const tokenValue = safeNum(ctx.evInfo?.tokenValue);
      if (Number.isFinite(tokenValue) && tokenValue > 0) return tokenValue;
    }

    const marketPrice = getMarketPrice(marketData || {}, hrid, 0, null);
    const primary = pickSide(marketPrice, side);
    if (typeof primary === "number" && Number.isFinite(primary) && primary > 0) return primary;

    const altSide = side === "ask" ? "bid" : "ask";
    const alt = pickSide(marketPrice, altSide);
    if (typeof alt === "number" && Number.isFinite(alt) && alt > 0) return alt;

    return null;
  }

  async function getDungeonChestItems(dungeonKey, marketData = null, side = "bid") {
    const dk = uiToShortDungeonKey(dungeonKey);
    const init = await ensureInit();
    const raw = await ensureOpenableLootRaw();

    const chestHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.chest;
    const refinedHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.refined;
    if (!chestHrid) return [];

    const chestDirect = raw.getExpectedRows(chestHrid, { resolveNested: false }) || [];
    const refinedDirect = refinedHrid ? (raw.getExpectedRows(refinedHrid, { resolveNested: false }) || []) : [];
    const wantLarge = chestDirect.some((r) => r.itemHrid === LARGE_TREASURE_CHEST_HRID);

    const rows = [];
    const seen = new Set();

    function addHrid(hrid, large = false) {
      if (!hrid || hrid === COIN_HRID) return;
      if (seen.has(hrid)) return;
      seen.add(hrid);

      rows.push({
        name: nameForHrid(hrid, init) || hrid,
        hrid,
        iconPath: buildDropIconPath(hrid),
        large: !!large,
        defaultPrice: null,
        askPrice: null,
      });
    }

    for (const r of chestDirect) addHrid(r.itemHrid, false);
    for (const r of refinedDirect) addHrid(r.itemHrid, false);

    if (wantLarge) {
      addHrid(LARGE_TREASURE_CHEST_HRID, true);
      const largeRows = raw.getExpectedRows(LARGE_TREASURE_CHEST_HRID, { resolveNested: false }) || [];
      for (const r of largeRows) addHrid(r.itemHrid, true);
    }

    const resolvedOpenables = [chestHrid, refinedHrid];
    if (wantLarge) resolvedOpenables.push(LARGE_TREASURE_CHEST_HRID);
    for (const openableHrid of resolvedOpenables) {
      if (!openableHrid) continue;
      const expectedMap = raw.getExpectedMap(openableHrid, { resolveNested: true }) || {};
      for (const itemHrid of Object.keys(expectedMap)) addHrid(itemHrid, openableHrid === LARGE_TREASURE_CHEST_HRID);
    }

    let evInfo = null;
    let askEvInfo = null;
    try {
      if (marketData) {
        evInfo = await computeDungeonChestEV({
          dungeonKey,
          marketData,
          side,
          priceOverrides: null,
        });
        if (side === "ask") askEvInfo = evInfo;
        else {
          askEvInfo = await computeDungeonChestEV({
            dungeonKey,
            marketData,
            side: "ask",
            priceOverrides: null,
          });
        }
      }
    } catch (_) { }

    const tokenHrid = `/items/${dk}_token`;
    for (const row of rows) {
      row.defaultPrice = resolveManualLootDefaultPrice(row.hrid, marketData, side, { evInfo, tokenHrid });
      row.askPrice = resolveManualLootDefaultPrice(row.hrid, marketData, "ask", {
        evInfo: askEvInfo || evInfo,
        tokenHrid,
      });
    }

    rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return rows;
  }

  async function getEvRelevantHrids(dungeonKey, _marketData = null) {
    const dk = uiToShortDungeonKey(dungeonKey);
    const raw = await ensureOpenableLootRaw();

    const chestHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.chest;
    const refinedHrid = DUNGEON_TO_CHEST_ITEM_HRID[dk]?.refined;

    const hrids = new Set();

    // Chest leaf items (flatten nested openables)
    for (const h of [chestHrid, refinedHrid, LARGE_TREASURE_CHEST_HRID]) {
      if (!h) continue;
      const m = raw.getExpectedMap(h, { resolveNested: true });
      for (const itemHrid of Object.keys(m || {})) hrids.add(itemHrid);
    }

    // Also include token-shop offer items so tokenValue can be computed from marketSlim
    const init = await ensureInit();
    if (init) {
      const offers = await getDungeonTokenShopOffers(dk);
      for (const o of offers) if (o?.itemHrid) hrids.add(o.itemHrid);
    }

    // Special policy dependencies
    hrids.add(MIRROR_OF_PROTECTION_HRID);
    for (const h of Object.values(ESSENCE_BY_SPECIAL_HRID)) hrids.add(h);
    hrids.add(COWBELL_HRID);
    const cowbellBagHrid = await findCowbellBagHrid();
    if (cowbellBagHrid) hrids.add(cowbellBagHrid);

    // Coin may appear in nested drops; keep it in the query set.

    return Array.from(hrids);
  }

  async function getShopConversions(dungeonKey, marketData = null, side = "bid", priceOverrides = null) {
    const dk = uiToShortDungeonKey(dungeonKey);
    const init = await ensureInit();

    const tokenInfo = await computeTokenValue(dk, marketData || {}, side, priceOverrides);
    const tokenValue = tokenInfo.tokenValue || 0;

    const rows = [];
    for (const o of tokenInfo.offers || []) {
      const mp = marketData ? getMarketPrice(marketData, o.itemHrid, 0, priceOverrides) : null;
      const bid = mp ? pickSide(mp, "bid") : null;
      const ask = mp ? pickSide(mp, "ask") : null;

      const cptBid = (typeof bid === "number" && bid > 0 && o.tokenCost > 0) ? (bid / o.tokenCost) : null;
      const cptAsk = (typeof ask === "number" && ask > 0 && o.tokenCost > 0) ? (ask / o.tokenCost) : null;

      rows.push({
        item: nameForHrid(o.itemHrid, init) || o.itemHrid,
        hrid: o.itemHrid,
        tokenCost: o.tokenCost,
        cptBid,
        cptAsk,
      });
    }

    rows.sort((a, b) => {
      const av = (side === "ask" ? a.cptAsk : a.cptBid) ?? -1;
      const bv = (side === "ask" ? b.cptAsk : b.cptBid) ?? -1;
      return (bv - av) || String(a.item).localeCompare(String(b.item));
    });

    return {
      tokenHrid: tokenInfo.tokenHrid,
      tokenValue,
      bestConversion: tokenInfo.bestConversion || null,
      rows,
      missingConversions: tokenInfo.missingConversions || [],
    };
  }

  window.DungeonChestEV = {
    computeDungeonChestEV,
    getDungeonChestItems,
    getEvRelevantHrids,
    getShopConversions,
  };
})();


