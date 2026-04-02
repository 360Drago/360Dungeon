(() => {
    const LS_LANG = "site.lang";   // "en" | "zh-Hans" | "zh-Hant"
    const LS_THEME = "site.theme"; // "light" | "dark" | ""/"auto" (system)
    const LS_THEME_DISCO = "site.theme.disco"; // "1" when the hidden disco mode is enabled
    const DISCO_TOGGLE_WINDOW_MS = 4000;
    const DISCO_TOGGLE_COUNT = 4;

    function getStorageShared() {
        return window.DungeonStorageShared || null;
    }

    function storageCall(methodName, ...args) {
        const method = getStorageShared()?.[methodName];
        if (typeof method === "function") return method(...args);
        return localStorage[methodName](...args);
    }

    function storageGetItem(key) {
        return storageCall("getItem", key);
    }

    function storageSetItem(key, value) {
        storageCall("setItem", key, value);
    }

    function storageRemoveItem(key) {
        storageCall("removeItem", key);
    }

    const LANG_ORDER = ["en", "zh-Hans", "zh-Hant"];
    const LANG_LABEL = { en: "EN", "zh-Hans": "简体", "zh-Hant": "繁體" };
    const WHITELIST_URL = "./assets/WhiteList.txt";
    const PROFILE_SNAPSHOT_VERSION = 2;
    const SHARE_PAYLOAD_VERSION = 9;
    const SHARE_CRITICAL_VERSION = 2;
    const SHARE_SEGMENT_DELIMITER = "-";
    const PROFILE_SLOT_COUNT = 4;
    const LS_PROFILE_ACTIVE = "site.profile.active";
    const LS_PROFILE_PREFIX = "site.profile.slot.";
    const LS_PROFILE_LOCKS = "site.profile.locks.v1";
    const SHARED_LOOT_OVERRIDE_ENABLED_KEY = "dungeon.lootOverrideEnabled";
    const SHARED_LOOT_PRICE_OVERRIDES_KEY = "dungeon.lootPriceOverrides";
    const LEGACY_ZONE_MANUAL_LOOT_KEY = "dungeon.zoneCompare.manualLoot.v1";
    const LEGACY_ZONE_MANUAL_OVERRIDES_KEY = "dungeon.zoneCompare.manualOverrides.v1";
    const LOCK_RESTRICTED_SELECTOR = [
        "#manualEntry",
        "#manualEntrySlider",
        "#manualChest",
        "#manualChestSlider",
        "#foodPerDay",
        "#advFoodPerDay",
        "#simpleClearTime",
        "#clearTime",
        "#lootOverrideSection input",
        "#lootOverrideSection button",
        "#zoneCompareInline #zcBuff",
        "#zoneCompareInline #zcFood",
        "#zoneCompareInline input[id^=\"zcMin-\"]",
        "#zoneCompareInline #zcLowDrop",
        "#zoneCompareInline #zcMirrorBackslot",
        "#zoneCompareInline #zcKeyPlannerImport",
        "#zoneCompareInline #zcManualLootToggle",
        "#zoneCompareInline #zcManualLootFilter",
        "#zoneCompareInline #zcReset",
        "#zcLootOverrideSection input",
        "#zcLootOverrideSection button",
    ].join(", ");
    const STATE_KEYS = [
        "dungeon.simCounts",
        "dungeon.lootCounts",
        "dungeon.viewMode.v1",
        "dungeon.selectedDungeon",
        "dungeon.selectedTier",
        "dungeon.pricingModel",
        "dungeon.advancedMode",
        "dungeon.lootOverrideEnabled",
        "dungeon.lootPriceOverrides",
        "dungeon.foodPerDay",
        "dungeon.zoneCompare.food.v3",
        "dungeon.zoneCompare.minutes.v3",
        "dungeon.zoneCompare.buff.v3",
        "dungeon.zoneCompare.removeLowDrops.v3",
        "dungeon.zoneCompare.manualLoot.v1",
        "dungeon.zoneCompare.manualOverrides.v1",
        "dungeon.zoneCompare.mirrorBackslot.v1",
        "dungeon.zoneCompare.keyPlannerImport.v1",
        "dungeon.foodPerDayByContext.v1",
        "dungeon.rangeEnabled",
        "dungeon.manualInputs",
        "dungeon.runInputs",
        "dungeon.runInputsByContext.v1",
        "dungeon.panelOpen",
    ];
    const STATE_KEYS_SET = new Set(STATE_KEYS);
    const SHARE_STATE_KEY_INDEX = new Map(STATE_KEYS.map((key, idx) => [key, idx]));
    const SHARE_JSON_STATE_KEYS = new Set([
        "dungeon.simCounts",
        "dungeon.lootCounts",
        "dungeon.lootPriceOverrides",
        "dungeon.zoneCompare.minutes.v3",
        "dungeon.zoneCompare.manualOverrides.v1",
        "dungeon.foodPerDayByContext.v1",
        "dungeon.manualInputs",
        "dungeon.runInputs",
        "dungeon.runInputsByContext.v1",
        "dungeon.panelOpen",
    ]);
    const SHARE_DEFAULT_FOOD = "10m";
    const SHARE_DUNGEON_KEYS = ["chimerical_den", "sinister_circus", "enchanted_fortress", "pirate_cove"];
    const SHARE_DUNGEON_INDEX = new Map(SHARE_DUNGEON_KEYS.map((key, index) => [key, index]));
    // Append new pricing modes to preserve existing packed codes for older shares.
    const SHARE_PRICING_MODES = ["official", "manual", "other", "api", "keyplanner"];
    const SHARE_PRICING_MODE_INDEX = new Map(SHARE_PRICING_MODES.map((key, index) => [key, index]));
    const SHARE_VIEW_MODES = ["quick", "advanced", "tokenShop", "keys", "zoneCompare"];
    const SHARE_VIEW_MODE_INDEX = new Map(SHARE_VIEW_MODES.map((key, index) => [key, index]));
    const SHARE_CONTEXT_TIER_FACTOR = 128;
    const SHARE_CONTEXT_TIERS = ["T0", "T1", "T2"];
    const SHARE_CONTEXT_KEYS = [];
    SHARE_DUNGEON_KEYS.forEach((dungeonKey) => {
        SHARE_CONTEXT_TIERS.forEach((tierKey) => {
            SHARE_CONTEXT_KEYS.push(`${dungeonKey}::${tierKey}`);
        });
    });
    const SHARE_CONTEXT_INDEX = new Map(SHARE_CONTEXT_KEYS.map((key, index) => [key, index]));
    const SHARE_PAYLOAD_INDEX_V7 = Object.freeze({
        v: 0,
        d: 1,
        t: 2,
        m: 3,
        g: 4,
        f: 5,
        zf: 6,
        b: 7,
        c: 8,
        x: 9,
        l: 10,
        z: 11,
        o: 12,
        fc: 13,
        u: 14,
        r: 15,
        rc: 16,
        po: 17,
    });
    const SHARE_PAYLOAD_INDEX_V8 = Object.freeze({
        v: 0,
        vm: 1,
        d: 2,
        t: 3,
        m: 4,
        g: 5,
        f: 6,
        zf: 7,
        b: 8,
        c: 9,
        x: 10,
        l: 11,
        z: 12,
        o: 13,
        fc: 14,
        u: 15,
        r: 16,
        rc: 17,
        po: 18,
    });
    const SHARE_PAYLOAD_INDEX_V9 = Object.freeze({
        v: 0,
        vm: 1,
        d: 2,
        t: 3,
        m: 4,
        g: 5,
        f: 6,
        zf: 7,
        b: 8,
        c: 9,
        x: 10,
        l: 11,
        z: 12,
        fc: 13,
        u: 14,
        r: 15,
        rc: 16,
        po: 17,
    });
    const SHARE_FLAG_ADVANCED = 1;
    const SHARE_FLAG_LOOT_OVERRIDE = 2;
    const SHARE_FLAG_LOW_DROP = 4;
    const SHARE_FLAG_ZONE_MANUAL_LOOT = 8;
    const SHARE_FLAG_MIRROR_BACKSLOT = 16;
    const SHARE_FLAG_RANGE_ENABLED = 32;
    const SHARE_FLAG_ZONE_KEY_IMPORT = 64;
    const SHARE_LOOT_OVERRIDE_ASK = -1;
    const SHARE_LOOT_OVERRIDE_BID = -2;
    const SHARE_LOOT_OVERRIDE_CUSTOM = -3;
    const SHARE_DUNGEON_KEY_RE = /^[a-z0-9_]{1,64}$/;
    const SHARE_TIER_KEY_RE = /^T\d{1,2}$/;
    const SHARE_PRICING_MODE_SET = new Set(["official", "manual", "other", "api", "keyplanner"]);
    const DEFAULT_WHITELIST_TERMS = [
        "360Dungeon",
        "360Drago",
        "ᚲᚨᚾ ᛁᛟᚢ ᚢᚾᛞᛖᚱᛊᛏᚨᚾᛞ ᛗᛖ",
        "Noland",
        "Icera",
        "Fenric",
        "Enora",
        "YAPMAXXING",
        "Mooket",
        "API",
        "EV",
        "HRID",
        "T0",
        "T1",
        "T2",
        "Chimerical Den",
        "Sinister Circus",
        "Enchanted Fortress",
        "Pirate Cove",
    ];
    let whitelistTerms = new Set(DEFAULT_WHITELIST_TERMS);
    let tempSharedMode = false;
    let tempSharedPartial = false;

    const I18N = {
        en: {
            // common
            "ui.simulate": "Calculate",
            "ui.reset": "Reset",
            "ui.continue": "Continue",
            "ui.simulations": "Calculations",
            "ui.entryKey": "Entry Key",
            "ui.chestKey": "Chest Key",
            "ui.chest": "Chest",
            "ui.refinedChest": "Refined Chest",
            "ui.drop33": "~33% drop rate",

            // dungeons
            "d.chimerical_den": "Chimerical Den",
            "d.sinister_circus": "Sinister Circus",
            "d.enchanted_fortress": "Enchanted Fortress",
            "d.pirate_cove": "Pirate Cove",

            // Section labels
            "ui.simOverview": "Calculator Overview",
            "ui.playerInfo": "Player Information",
            "ui.pricingModel": "Key price override",
            "ui.officialApi": "Official API",
            "ui.manualInput": "Manual input",
            "ui.otherApi": "Mooket API",
            "ui.tokenShop": "Token Shop",
            "ui.refreshPrices": "Refresh prices",
            "ui.items": "Item",
            "ui.tokens": "Tokens",
            "ui.ask": "Ask",
            "ui.lockAskPrice": "Lock to Ask price",
            "ui.lockAskPriceTip": "Lock to\nAsk price",
            "ui.bid": "Bid",
            "ui.topCoinsPerToken": "Top coins/token",
            "ui.calculate": "Calculate",
            "ui.calculationsLabel": "Calculations:",
            "ui.advanced": "Advanced",
            "ui.keys": "Keys",
            "ui.zoneCompare": "Zone Compare",
            "ui.quickCalculator": "Quick Calculator",
            "ui.quickStartHintDefault": "Pick a dungeon for quick start",
            "ui.quickStartHintAdvanced": "Pick a dungeon for Advanced",
            "ui.quickStartHintTokenShop": "Pick a dungeon for Token Shop",
            "ui.tierHintDefault": "Choose a tier to unlock options.",
            "ui.tierSelected": "Tier selected: {tier}",
            "ui.refreshOfficialApiPrices": "Refresh current API prices",
            "ui.combatBuff": "Combat buff",
            "ui.combatBuffHelp": "Current Combat Drop Quantity (Found in Game)",
            "ui.enterNumber0to20": "Enter a number from 0 to 20.",
            "ui.consumablesPerDay": "Consumables Per Day",
            "ui.consumablesHelp": "Default 10m per day",
            "ui.clearTimeMinutes": "Clear time (minutes)",
            "ui.clearTimePlaceholder": "e.g. 22",
            "ui.enterValidMinutes": "Enter a valid number of minutes.",
            "ui.showRange": "Show Low-High range",
            "ui.results": "Results",
            "ui.runsPerDay": "Runs / day",
            "ui.entryKeys": "Entry keys",
            "ui.chestKeys": "Chest keys",
            "ui.profit": "Profit",
            "ui.selectDungeonTier": "Select a dungeon and tier.",
            "ui.each": "Each",
            "ui.total": "Total",
            "ui.evPerChest": "EV/chest",
            "ui.tokenValue": "Token value",
            "ui.resetSelection": "Reset selection",
            "ui.dungeon": "Dungeon",
            "ui.tier": "Tier",
            "ui.pricing": "Pricing",
            "ui.clear": "Clear",
            "ui.buff": "Buff",
            "ui.override": "Override",
            "ui.planner": "Planner",
            "ui.acceptsFormats": "Accepts: 600,000 • 600000 • 600k • 6m",
            "ui.entryKeyPrice": "Entry Key Price",
            "ui.chestKeyPrice": "Chest Key Price",
            "ui.entryPricePlaceholder": "e.g. 600k",
            "ui.chestPricePlaceholder": "e.g. 6m",
            "ui.enterValueLike": "Enter a value like 600k or 6m.",
            "ui.lastRefresh": "Last checked",
            "ui.usesOfficialEndpoint": "Uses the official pricing endpoint.",
            "ui.currentApiPrices": "Current API prices",
            "ui.usesSelectedApiKeyPrices": "Uses instant-buy key prices from the API selected in the footer.",
            "ui.refreshNow": "Refresh now",
            "ui.instant": "Instant",
            "ui.order": "Order",
            "ui.alt": "Alt",
            "ui.secondaryEndpoint": "Secondary endpoint for comparisons.",
            "ui.refresh": "Refresh",
            "ui.notRefreshedYet": "Not refreshed yet.",
            "ui.needed": "Needed",
            "ui.requiredToCalculate": "Required to calculate.",
            "ui.manualLootPrices": "Manual loot prices",
            "ui.overrideDropValues": "Override specific drop values used for EV calculations.",
            "ui.filterItems": "Filter items",
            "ui.typeToSearch": "Type to search...",
            "ui.officialApiPrices": "Current API Prices",
            "ui.resetLootPrices": "Reset Loot Prices",
            "ui.lootHintDefault": "Prices shown are current market values (placeholder). Enter a value to override. Leave blank to use the market.",
            "ui.createdBy": "Created by",
            "ui.onShort": "On",
            "ui.offShort": "Off",
            "ui.toggleOn": "Toggle on",
            "ui.toggleOff": "Toggle off",
            "ui.pickDungeonFirst": "Pick a dungeon first.",
            "ui.pickTierFirst": "Pick a tier first.",
            "ui.nextSetClearBuff": "Next: set clear time + combat buff.",
            "ui.overridesClearedDungeon": "Overrides cleared for this dungeon.",
            "ui.noDungeonSelected": "No dungeon selected.",
            "ui.noHridMapping": "No HRID mapping for selected dungeon.",
            "ui.apiRefreshFailed": "Couldn't refresh prices right now.",
            "ui.officialApiRefreshed": "Official API checked for new data{proxy}.",
            "ui.proxyViaSuffix": " (via proxy)",
            "ui.proxySuffix": " (proxy)",
            "ui.officialApiRefreshFailedToast": "Couldn't refresh Official prices right now.",
            "ui.officialApiRefreshUsingSaved": "Couldn't refresh Official prices right now. Using your last saved prices.",
            "ui.officialApiRefreshRetry": "Couldn't refresh Official prices right now. Please try again in a moment.",
            "ui.mooketApiRefreshed": "Mooket API checked for new data.",
            "ui.mooketApiRefreshFailedToast": "Couldn't refresh Mooket prices right now.",
            "ui.mooketApiRefreshUsingSaved": "Couldn't refresh Mooket prices right now. Using your last saved prices.",
            "ui.mooketApiRefreshRetry": "Couldn't refresh Mooket prices right now. Please try again in a moment.",
            "ui.refreshFailed": "Refresh failed. Please try again.",
            "ui.unknownRefreshState": "Unknown refresh state.",
            "ui.nowChoosePricing": "Now choose a pricing model.",
            "ui.selectApiForDefaults": "Select an API in the footer to view market defaults.",
            "ui.enableManualLootEdit": "Enable Manual loot prices to edit item values.",
            "ui.refreshPricingDefaults": "Refresh pricing to load market defaults for these items.",
            "ui.pricesShownMarket": "Prices shown are current market values (placeholder). Enter a value to override. Leave blank to use the market.",
            "ui.official": "Official",
            "ui.manualPlusOfficial": "Manual + Official",
            "ui.keysPlannerPlusOfficial": "Keys Planner + Official",
            "ui.mooket": "Mooket",
            "ui.keysPlannerPlusMooket": "Keys Planner + Mooket",
            "ui.market": "market",
            "ui.mixed": "mixed",
            "ui.refinedShards": "Refined Shards",
            "ui.officialApiLastRefresh": "Official API • Data updated: {age}",
            "ui.officialApiLastRefreshDash": "Official API - Data updated: {age}",
            "ui.mooketUpdated": "Mooket data updated: {time}{proxy}",
            "ui.apiDataUpdatedLine": "{source} API • Data updated: {age}",
            "ui.apiDataUpdatedTitle": "{source} API • Data updated: {age}",
            "ui.apiLoadErrorShort": "Load failed",
            "ui.apiLoadErrorTitle": "{source} API failed to load.",
            "ui.apiLoadErrorPicker": "Active API: {source}. Load failed. Click to change.",
            "ui.apiTestFailure": "API disabled for testing.",
            "ui.activeApiPicker": "Active API: {source}. Click to change.",
            "ui.activeApiSelectedToast": "{source} API selected.",
            "ui.refreshApiPricesTip": "Check {source} API for new data",
            "ui.changeApiSource": "Change API source",
            "ui.checkedStamp": "Last checked: {time}",
            "ui.runSummary": "Clear time: {clear} - Buff: {buff}",
            "ui.runClearFmt": "{value} min",
            "ui.runBuffFmt": "{value}/20",
            "ui.statusClearFmt": "{value}m",
            "ui.selectionSummary": "Dungeon: {dungeon} - Tier: {tier} - Pricing: {pricing}",
            "ui.rangeSub": "Range: low uses loot @ bid + keys @ ask; high uses loot @ ask + keys @ bid.",
            "ui.standardSub": "Standard: instant sell @ bid - 2% tax; keys @ bid.",
            "ui.keysProfitPrediction": "Keys + profit prediction.",
            "ui.profitDash": "Profit: -",
            "ui.rangePerDay": "{low} - {high} / day",
            "ui.rangePerHour": "{low} - {high} / hour",
            "ui.valuePerDay": "{value} / day",
            "ui.valuePerHour": "{value} / hour",
            "ui.rangeMathTitle": "{label} range math (after tax)",
            "ui.standardMathTitle": "{label} standard math (after tax)",
            "ui.rangeMathTitleNoLabel": "Range math (after tax)",
            "ui.standardMathTitleNoLabel": "Standard math (after tax)",
            "ui.lowDay": "Low/day",
            "ui.highDay": "High/day",
            "ui.lowHour": "Low/hour",
            "ui.highHour": "High/hour",
            "ui.netDay": "Net/day",
            "ui.netHour": "Net/hour",
            "ui.clearTimeRequired": "Clear time is required.",
            "ui.buffMustRange": "Combat buff must be 0-20.",
            "ui.playerInfoRequired": "Player Information is required (buff 0-20, clear time).",
            "ui.calculationFailedPrefix": "Calculation failed: {error}",
            "ui.calculationFailedConsole": "Calculation failed (see console).",
            "ui.clearedInputsResetManualOfficial": "Cleared inputs and reset manual key prices to the current API.",
            "ui.scrollUpAgainReturn": "Scroll up again to return to landing.",
            "ui.bestValue": "Best value",
            "ui.best": "best",
            "ui.coinsPerToken": "Coins per token",
            "ui.keysTable": "Keys table",
            "ui.keysChestCalc": "Key cost planner",
            "ui.keysChestTarget": "# of Keys",
            "ui.keysTargetForType": "# of {type}",
            "ui.keysInputPricing": "Input pricing",
            "ui.keysFragmentPricing": "Fragment pricing",
            "ui.keysFragmentsNeeded": "Fragments needed",
            "ui.keysMaterialsNeeded": "Materials needed",
            "ui.keysTotalCost": "Total cost",
            "ui.keysTotalForBudget": "Total Keys for your budget",
            "ui.keysKeysProduced": "Chest keys",
            "ui.keysCraftRuns": "Crafts",
            "ui.reset": "Reset",
            "ui.keysSelectDungeonPrompt": "Select a dungeon to calculate fragment totals.",
            "ui.keysShowPlanner": "Show planner",
            "ui.keysHidePlanner": "Hide planner",
            "ui.keysAutoPrice": "Auto",
            "ui.keysManualPrice": "Manual Price Input",
            "ui.keysEachPrice": "@ {price} ea",
            "ui.keysBank": "Bank",
            "ui.keysBankHelp": "Set a coin budget and the planner will reverse-calculate the maximum fragments you can afford with the current prices.",
            "ui.keysBankPlaceholder": "Current Coins",
            "ui.keysEstimatePrefix": "~",
            "ui.keysEstimateArtisanHelp": "Estimated when artisan is enabled",
            "ui.artisan": "Artisan",
            "ui.craft": "Craft",
            "ui.cost": "Cost",
            "ui.guzzlingPouchLevel": "Guzzling Pouch lv.",
            "ui.discoModeOn": "Disco mode unlocked. Toggle the theme a bunch again to escape.",
            "ui.discoModeOff": "Disco mode disabled. Sanity restored.",
            "ui.artisanCost": "Artisan Cost",
            "ui.craftCost": "Craft Cost",
            "ui.instantArtisan": "Instant Artisan",
            "ui.instantCraft": "Instant Craft",
            "ui.orderCraft": "Order Craft",
            "ui.refreshOfficialApi": "Refresh official API",
            "ui.key": "Key",
            "ui.justNow": "just now",
            "ui.secondsAgo": "{count}s ago",
            "ui.minutesAgo": "{count}m ago",
            "ui.hoursAgo": "{count}h ago",
            "ui.daysAgo": "{count}d ago",
            "ui.secondsShort": "{count}s",
            "ui.minutesShort": "{count}m {rem}s",
            "ui.hoursShort": "{count}h {rem}m",
            "ui.refreshedStamp": "Refreshed: {time}",
            "ui.afterKeyPrices": "Chest Profit",
            "ui.afterKeyPricesAria": "Chest profit explanation",
            "ui.afterKeyPricesTip": "Estimated chest value after key costs.\nNormal subtracts entry and chest key costs.\nRefined subtracts chest key cost only.\nRange: Low = Instant sell, High = List sell",
            "ui.normal": "Normal",
            "ui.refined": "Refined",
            "ui.dailyProfit": "Daily Profit",
            "ui.combatBuffTitle": "Combat Buff",
            "ui.consumablesDay": "Consumables / day",
            "ui.putNumberHere": "Put your number in here",
            "ui.removeOnePercentDrops": "Remove 1% drops",
            "ui.backEqualsMirror": "Back = Mirror",
            "ui.backSlotEqualsMirror": "Back Slot = Mirror",
            "ui.backSlotDropsEqualMirrorPrice": "Back Slot Drops = Mirror Price",
            "ui.zoneCompareKeyPlannerValues": "Key Planner Crafting Values",
            "ui.enterTierClearThenCalc": "Enter any tier clear times, then Calculate.",
            "ui.apiWarnings": "API warnings",
            "ui.noItemsMatchFilter": "No items match your filter.",
            "ui.manualPriceAria": "{item} manual price",
            "ui.calculationDependenciesMissing": "Calculation dependencies are not loaded.",
            "ui.calculating": "Calculating...",
            "ui.refreshingPricesAllZones": "Refreshing prices for all zones...",
            "ui.calculatingTierComparisons": "Calculating 12 tier comparisons...",
            "ui.apiRefreshUnavailable": "API refresh unavailable.",
            "ui.apiRefreshFailedShort": "API refresh failed.",
            "ui.zone": "Zone",
            "ui.apiPriceWarningPrefix": "API price warning: {warning}",
            "ui.addTierMinutesThenCalc": "Add one or more tier minutes, then Calculate.",
            "ui.noValidClearTimes": "No valid clear times entered. Add one or more tier minutes, then Calculate.",
            "ui.zoneMissingDataCount": " {count} zone(s) had missing data.",
            "ui.lowChanceItemsZeroedCount": " {count} low-chance items were zeroed.",
            "ui.apiWarningsCount": " {count} API warning(s).",
            "ui.calculationComplete": "Calculation complete: {count} tier result(s) updated.{warn}{low}{warnNote}",
            "ui.zoneComparisonFailed": "Zone comparison calculation failed.",
            "ui.clearedZoneCompareInputs": "Cleared zone compare inputs.",
            "ui.manualLootOverridesReset": "Manual loot overrides reset to market prices.",
            "ui.defaultsRestoredClickAgain": "Defaults restored. Click Reset Times again to clear tier minutes.",
            "ui.resetTimes": "Reset Times",
            "ui.manualLootEnabled": "Manual loot prices enabled.",
            "ui.enableManualLoot": "Enable manual loot prices.",
            "ui.keyPricesMissing": "key prices are missing or -1.",
            "ui.marketSnapshotMissing": "market snapshot is missing.",
            "ui.mirrorPriceMissing": "mirror API price missing; back-slot mirror override skipped.",
            "ui.evInvalidValues": "EV response had invalid values.",
            "ui.unableComputeEv": "Unable to compute EV.",
            "ui.evCalculationFailed": "EV calculation failed.",
            "ui.evCalculationFailedZone": "EV calculation failed for this zone.",
            "ui.apiPriceMissingList": "API price missing/-1 for {items}{extra}.",
            "ui.moreCount": " +{count} more",
            "ui.tipRunsEntryChestKeys": "Runs/day: {runs} | Entry: {entry} | Chest keys: {chestKeys}",
            "ui.tipChestsRefined": "Chests: {chests} | Refined: {refined}",
            "ui.tipDailyRegularTotal": "Normal total/day: {range}",
            "ui.tipDailyRefinedTotal": "Refined total/day: {range}",
            "ui.tipDailyChestTotal": "Chest total/day: {range}",
            "ui.tipAfterKeyNormal": "Chest profit normal: {range}",
            "ui.tipAfterKeyRefined": "Chest profit refined: {range}",
            "ui.tipProfitRange": "Profit range: {range}",
            "ui.tipProfitLow": "Daily Profit Low (Instant sell): {value}",
            "ui.tipProfitHigh": "Daily Profit High (List sell): {value}",
            "ui.tipStandardExplained": "Standard view: {value} | instant sell @ bid, keys @ bid",
            "ui.tipStandard": "Standard: {value}",
            "ui.developerPanel": "Developer Panel",
            "ui.zoneView": "Zone view:",
            "ui.zoneSelector": "Zone selector",
            "ui.activeApi": "Active API",
            "ui.apiCompareFilter": "API compare filter",
            "ui.differentOnly": "Different only",
            "ui.allItems": "All items",
            "ui.apiPriceCompare": "API price compare",
            "ui.apiCompareShowing": "Showing {shown} of {total} {label}",
            "ui.apiCompareFormula": "Delta = {left} - {right}",
            "ui.apiComparePositiveMeans": "positive means {left} is higher",
            "ui.apiCompareCellTitle": "{left} {side}: {leftValue} | {right} {side}: {rightValue} | Delta: {delta}",
            "ui.apiCompareMissingSource": "Missing one saved API snapshot",
            "ui.bidDelta": "Bid Δ",
            "ui.askDelta": "Ask Δ",
            "ui.relevantItems": "relevant items",
            "ui.keysPricingItems": "key pricing items",
            "ui.tokenShopPricingItems": "token shop pricing items",
            "ui.zoneComparePricingItems": "zone compare chest items",
            "ui.buffTier": "Buff tier:",
            "ui.taxPercent": "Tax %:",
            "ui.entryKeyAskBid": "Entry key (ask/bid):",
            "ui.chestKeyAskBid": "Chest key (ask/bid):",
            "ui.chestEvBreakdown": "Chest EV breakdown ({side})",
            "ui.chestEvBreakdownTitle": "Chest EV breakdown",
            "ui.refinedChestEvBreakdown": "Refined Chest EV breakdown ({side})",
            "ui.refinedChestEvBreakdownTitle": "Refined Chest EV breakdown",
            "ui.trace": "Trace",
            "ui.sumContrib": "Σ contrib:",
            "ui.chestEv": "Chest EV:",
            "ui.deltaSumEv": "Δ (sum - EV):",
            "ui.ok": "OK",
            "ui.mismatchSumVsEv": "Mismatch (sum vs EV)",
            "ui.noRelevantItems": "No relevant items found.",
            "ui.noApiDiffs": "No informative API price differences found for this dungeon.",
            "ui.toggleSection": "Toggle section",
            "ui.noData": "No data",
            "ui.quantity": "Quantity",
            "ui.value": "Value",
            "ui.price": "Price",
            "ui.contribution": "Contribution",
            "ui.coreModulesNotLoaded": "Core modules not loaded",
            "ui.anErrorOccurredCalculation": "An error occurred in calculation",
            "ui.and": "and",
            "ui.calcModulesNotReady": "Calculation modules are not ready.",
            "ui.clearTime": "Clear Time",
            "ui.item": "Item",
            "ui.manualKeys": "Manual keys",
            "ui.manualKeysLine": "Manual keys + Official API • Entry/Chest accepted (k,m)",
            "ui.manualKeysWithSource": "Manual + {source}",
            "ui.manualKeysLineWithSource": "Manual keys + {source} API • Entry/Chest accepted (k,m)",
            "ui.keysPlannerLineWithSource": "Keys planner + {source} API • Craft cost imported from Keys tab",
            "ui.keysTabImport": "Keys tab import",
            "ui.openKeysTab": "Open Keys tab",
            "ui.keysImportDesc": "Uses your Keys tab crafting settings for per-dungeon entry and chest key costs.",
            "ui.keysImportPreviewEmpty": "Uses Keys tab settings.",
            "ui.keysImportPreviewWithPrices": "{source} • Entry {entry} • Chest {chest}",
            "ui.keysImportTooltipTitle": "Keys planner import",
            "ui.keysImportTooltipSource": "Source: {source}",
            "ui.keysImportTooltipBuyMode": "Buy mode: {mode}",
            "ui.keysImportTooltipArtisan": "Artisan tea: {state}",
            "ui.keysImportTooltipPouch": "Guzzling pouch: {state}",
            "ui.keysImportTooltipPouchOn": "On (+{level})",
            "ui.keysImportTooltipEntry": "Entry key: {price}",
            "ui.keysImportTooltipChest": "Chest key: {price}",
            "ui.keysImportTooltipOverrides": "Manual fragment overrides: {count}",
            "ui.keysImportUnavailable": "Keys planner pricing is not ready yet.",
            "ui.keysImportRecipeMissing": "Missing key recipe data for the selected dungeon.",
            "ui.keysImportMissingPrices": "Some key planner ingredients are missing prices.",
            "ui.keysImportMissingMessage": "Keys planner pricing is unavailable. Check Keys tab settings and prices.",
            "ui.minutesWord": "Minutes",
            "ui.min": "Min",
            "ui.missingKeyPriceData": "Missing price data for selected dungeon keys.",
            "ui.missingKeyPrices": "Missing key prices.",
            "ui.missingMarketSnapshot": "Missing market snapshot.",
            "ui.manualPlusMooket": "Manual + Mooket",
            "ui.mooketApiLine": "Mooket API • Player-collected",
            "ui.mooketApiRefreshFailedPrefix": "Mooket API refresh failed:",
            "ui.noApi": "No API",
            "ui.noMarketPriceMessage": "No market prices available.",
            "ui.officialApiRefreshFailedPrefix": "Official API refresh failed:",
            "ui.rangeSubInline": "low uses loot @ bid + keys @ ask; high uses loot @ ask + keys @ bid.",
            "ui.refreshPricingApi": "Refresh pricing API",
            "ui.invalidApiPayload": "Invalid API payload.",
            "ui.set": "Set",
            "ui.standardSubInline": "standard uses loot @ bid - 2% tax; keys @ bid.",
            "ui.shareState": "Share state",
            "ui.shareCopied": "Share link copied to clipboard.",
            "ui.shareCopiedShort": "Copied",
            "ui.shareCopyFailed": "Couldn't copy automatically. Use the share panel to copy the link.",
            "ui.shareCopyFailedPrompt": "Couldn't copy automatically. The link is shown in a browser prompt.",
            "ui.shareCopyManualTitle": "Copy share link",
            "ui.shareCopyManualBody": "Automatic copy was blocked here. Use Copy Again or copy the link below manually.",
            "ui.shareCopyManualField": "Share link",
            "ui.shareCopyManualRetry": "Copy Again",
            "ui.shareCopyManualClose": "Close",
            "ui.shareCopyManualSelect": "Select the link and copy it manually.",
            "ui.profileSlot": "Profile {slot}",
            "ui.profileSlotEmpty": "Profile {slot} (empty)",
            "ui.profileSlotLocked": "Profile {slot} (locked)",
            "ui.profileSlotSaveTarget": "Profile {slot} (empty, click to save shared state)",
            "ui.profileSlotReplaceTarget": "Profile {slot} (click again to replace with shared state)",
            "ui.profileLoaded": "Profile {slot} loaded",
            "ui.profileLock": "Lock active profile",
            "ui.profileUnlock": "Unlock active profile",
            "ui.profileLocked": "Profile {slot} locked.",
            "ui.profileUnlocked": "Profile {slot} unlocked.",
            "ui.profileLockedNoSave": "Profile {slot} is locked. Unlock it to save changes.",
            "ui.profileLockedViewing": "Profile {slot} is locked. Click profile {slot} again to unlock and edit.",
            "ui.profileLockedReadOnly": "Profile {slot} is locked. Unlock it to edit values.",
            "ui.sharedStateTempLoaded": "Shared state loaded temporarily. Save it to an empty profile slot, or click an unlocked filled slot twice to replace it.",
            "ui.sharedStateTempLoadedPartial": "Share link may be cut off. Loaded recovered critical data only.",
            "ui.sharedStateTempHint": "Shared link mode: click an empty unlocked profile slot to save this state, or click an unlocked filled slot twice to replace it.",
            "ui.sharedStateTempPartialHint": "Share link may be cut off. Loaded recovered critical data only. Click an empty unlocked profile slot to save it, or click an unlocked filled slot twice to replace it.",
            "ui.sharedStateTempReplaceConfirm": "Profile {slot} already has saved data. Click it again to replace it with this shared state.",
            "ui.sharedStateTempReplaceConfirmPartial": "Share link may be cut off. Click profile {slot} again to replace it with the recovered critical data only.",
            "ui.sharedStateSavedToSlot": "Shared state saved to profile {slot}.",
            "aria.heroLanding": "360Dungeon landing",
            "aria.landingHeader": "Landing header",
            "aria.titleHoverArea": "360Dungeon title hover area",
            "aria.dungeonSelection": "Dungeon selection",
            "aria.tierSelection": "Tier selection",
            "aria.tokenShopSelectedDungeon": "Token Shop for selected dungeon",
            "aria.keysProfitability": "Keys profitability",
            "aria.zoneComparePanel": "Dungeon zone compare",
            "aria.quickCalculator": "Quick calculator",
            "aria.quickInputs": "Quick inputs",
            "aria.quickResults": "Quick results",
            "aria.advancedResults": "Advanced results",
            "aria.combatBuffHelp": "Combat buff help",
            "aria.combatBuffSlider": "Combat buff slider (0-20)",
            "aria.consumablesHelp": "Consumables help",
            "aria.consumablesCost": "Consumables per day cost",
            "aria.clearTimeInMinutes": "Clear time in minutes",
            "aria.calculatorOptions": "Calculator options",
            "aria.itemOverview": "Dungeon item overview",
            "aria.selectionStatus": "Selection status",
            "aria.pricingChoices": "Pricing model choices",
            "aria.manualLootToggle": "Manual loot prices toggle",
            "aria.zoneCompareClearMinutes": "{zone} {tier} clear minutes",
            "aria.zoneCompareDetails": "{zone} {tier} details",
        },

        "zh-Hans": {
            "ui.simulate": "模拟",
            "ui.reset": "重置",
            "ui.continue": "继续",
            "ui.simulations": "模拟次数",
            "ui.entryKey": "入场钥匙",
            "ui.chestKey": "宝箱钥匙",
            "ui.chest": "宝箱",
            "ui.refinedChest": "精炼宝箱",
            "ui.drop33": "~33% 掉落率",

            "d.chimerical_den": "奇幻巢穴",
            "d.sinister_circus": "阴森马戏团",
            "d.enchanted_fortress": "魔法堡垒",
            "d.pirate_cove": "海盗湾",

            "ui.simOverview": "模拟概览",
            "ui.playerInfo": "玩家信息",
            "ui.pricingModel": "钥匙价格覆盖",
            "ui.officialApi": "官方 API",
            "ui.manualInput": "手动输入",
            "ui.otherApi": "Mooket API",
            "ui.tokenShop": "代币商店",
            "ui.refreshPrices": "刷新价格",
            "ui.items": "物品",
            "ui.tokens": "代币",
            "ui.ask": "卖一",
            "ui.lockAskPrice": "锁定为卖一价格",
            "ui.lockAskPriceTip": "锁定为\n卖一价格",
            "ui.bid": "买一",
            "ui.topCoinsPerToken": "每代币最高金币",
            "ui.calculate": "计算",
            "ui.calculationsLabel": "计算：",
            "ui.advanced": "高级",
            "ui.keys": "钥匙",
            "ui.zoneCompare": "区域对比",
            "ui.quickCalculator": "快速计算器",
            "ui.quickStartHintDefault": "选择地下城以快速开始",
            "ui.quickStartHintAdvanced": "选择地下城以进入高级模式",
            "ui.quickStartHintTokenShop": "选择地下城以查看代币商店",
            "ui.tierHintDefault": "选择一个层级以解锁选项。",
            "ui.tierSelected": "已选择层级：{tier}",
            "ui.refreshOfficialApiPrices": "刷新当前 API 价格",
            "ui.combatBuff": "战斗增益",
            "ui.combatBuffHelp": "当前战斗掉落数量（游戏内）",
            "ui.enterNumber0to20": "请输入 0 到 20 的数字。",
            "ui.consumablesPerDay": "每日消耗品",
            "ui.consumablesHelp": "默认每日 10m",
            "ui.clearTimeMinutes": "通关时间（分钟）",
            "ui.clearTimePlaceholder": "例如 22",
            "ui.enterValidMinutes": "请输入有效的分钟数。",
            "ui.showRange": "显示低-高区间",
            "ui.results": "结果",
            "ui.runsPerDay": "每日次数",
            "ui.entryKeys": "入场钥匙",
            "ui.chestKeys": "宝箱钥匙",
            "ui.profit": "利润",
            "ui.selectDungeonTier": "选择一个地下城和层级。",
            "ui.each": "单价",
            "ui.total": "总计",
            "ui.evPerChest": "每箱 EV",
            "ui.tokenValue": "代币价值",
            "ui.resetSelection": "重置选择",
            "ui.dungeon": "地下城",
            "ui.tier": "层级",
            "ui.pricing": "定价",
            "ui.clear": "通关",
            "ui.buff": "增益",
            "ui.override": "覆盖",
            "ui.planner": "规划器",
            "ui.acceptsFormats": "支持：600,000 • 600000 • 600k • 6m",
            "ui.entryKeyPrice": "入场钥匙价格",
            "ui.chestKeyPrice": "宝箱钥匙价格",
            "ui.entryPricePlaceholder": "例如 600k",
            "ui.chestPricePlaceholder": "例如 6m",
            "ui.enterValueLike": "请输入类似 600k 或 6m 的值。",
            "ui.lastRefresh": "上次检查",
            "ui.usesOfficialEndpoint": "使用官方定价接口。",
            "ui.currentApiPrices": "当前 API 价格",
            "ui.usesSelectedApiKeyPrices": "使用页脚所选 API 的即时购买钥匙价格。",
            "ui.refreshNow": "立即刷新",
            "ui.instant": "即买",
            "ui.order": "挂单",
            "ui.alt": "备用",
            "ui.secondaryEndpoint": "用于对比的次级接口。",
            "ui.refresh": "刷新",
            "ui.notRefreshedYet": "尚未刷新。",
            "ui.needed": "必填",
            "ui.requiredToCalculate": "计算必填。",
            "ui.manualLootPrices": "手动掉落价格",
            "ui.overrideDropValues": "覆盖 EV 计算使用的特定掉落值。",
            "ui.filterItems": "筛选物品",
            "ui.typeToSearch": "输入以搜索...",
            "ui.officialApiPrices": "当前 API 价格",
            "ui.resetLootPrices": "重置掉落价格",
            "ui.lootHintDefault": "显示的是当前市场价格（占位）。输入数值可覆盖，留空则使用市场价。",
            "ui.createdBy": "创建者",
            "ui.onShort": "开",
            "ui.offShort": "关",
            "ui.toggleOn": "开启",
            "ui.toggleOff": "关闭",
            "ui.pickDungeonFirst": "请先选择地下城。",
            "ui.pickTierFirst": "请先选择层级。",
            "ui.nextSetClearBuff": "下一步：设置通关时间和战斗增益。",
            "ui.overridesClearedDungeon": "此地下城的覆盖已清除。",
            "ui.nowChoosePricing": "现在请选择定价模型。",
            "ui.selectApiForDefaults": "请在页脚选择一个 API 以查看市场默认值。",
            "ui.enableManualLootEdit": "启用手动掉落价格以编辑物品值。",
            "ui.refreshPricingDefaults": "刷新定价以加载这些物品的市场默认值。",
            "ui.pricesShownMarket": "显示的是当前市场价格（占位）。输入数值可覆盖，留空则使用市场价。",
            "ui.official": "官方",
            "ui.manualPlusOfficial": "手动 + 官方",
            "ui.keysPlannerPlusOfficial": "钥匙规划器 + 官方",
            "ui.mooket": "Mooket",
            "ui.keysPlannerPlusMooket": "钥匙规划器 + Mooket",
            "ui.market": "市场",
            "ui.mixed": "混合",
            "ui.refinedShards": "精炼碎片",
            "ui.officialApiRefreshed": "官方 API 已检查新数据{proxy}。",
            "ui.mooketApiRefreshed": "Mooket API 已检查新数据。",
            "ui.officialApiLastRefresh": "官方 API • 数据更新于：{age}",
            "ui.officialApiLastRefreshDash": "官方 API - 数据更新于：{age}",
            "ui.mooketUpdated": "Mooket 数据更新于：{time}{proxy}",
            "ui.apiDataUpdatedLine": "{source} API • 数据更新于：{age}",
            "ui.apiDataUpdatedTitle": "{source} API • 数据更新于：{age}",
            "ui.apiLoadErrorShort": "加载失败",
            "ui.apiLoadErrorTitle": "{source} API 加载失败。",
            "ui.apiLoadErrorPicker": "当前 API：{source}。加载失败，点击切换。",
            "ui.apiTestFailure": "API 已为测试禁用。",
            "ui.activeApiPicker": "当前 API：{source}。点击切换。",
            "ui.activeApiSelectedToast": "已选择 {source} API。",
            "ui.refreshApiPricesTip": "检查 {source} API 是否有新数据",
            "ui.changeApiSource": "切换 API 来源",
            "ui.checkedStamp": "上次检查：{time}",
            "ui.runSummary": "通关时间：{clear} - 增益：{buff}",
            "ui.runClearFmt": "{value} 分钟",
            "ui.runBuffFmt": "{value}/20",
            "ui.statusClearFmt": "{value}m",
            "ui.selectionSummary": "地下城：{dungeon} - 层级：{tier} - 定价：{pricing}",
            "ui.rangeSub": "区间：低值使用掉落买一+钥匙卖一；高值使用掉落卖一+钥匙买一。",
            "ui.standardSub": "标准：按买一即时卖出，税率 2%；钥匙按买一。",
            "ui.keysProfitPrediction": "钥匙 + 利润预测。",
            "ui.profitDash": "利润：-",
            "ui.rangePerDay": "{low} - {high} / 天",
            "ui.rangePerHour": "{low} - {high} / 小时",
            "ui.valuePerDay": "{value} / 天",
            "ui.valuePerHour": "{value} / 小时",
            "ui.clearTimeRequired": "必须填写通关时间。",
            "ui.buffMustRange": "战斗增益必须在 0-20。",
            "ui.playerInfoRequired": "玩家信息必填（增益 0-20，通关时间）。",
            "ui.calculationFailedConsole": "计算失败（见控制台）。",
            "ui.clearedInputsResetManualOfficial": "已清空输入，并将手动钥匙价格重置为当前 API。",
            "ui.scrollUpAgainReturn": "再次上滑可返回首页。",
            "ui.bestValue": "最佳价值",
            "ui.best": "最佳",
            "ui.coinsPerToken": "每代币金币",
            "ui.keysTable": "钥匙表",
            "ui.keysChestCalc": "钥匙成本规划",
            "ui.keysChestTarget": "钥匙数量",
            "ui.keysTargetForType": "{type}数量",
            "ui.keysInputPricing": "材料定价",
            "ui.keysFragmentPricing": "碎片定价",
            "ui.keysFragmentsNeeded": "需要的碎片",
            "ui.keysMaterialsNeeded": "需要的材料",
            "ui.keysTotalCost": "总成本",
            "ui.keysTotalForBudget": "你的预算可做的总钥匙数",
            "ui.keysKeysProduced": "宝箱钥匙",
            "ui.keysCraftRuns": "制作次数",
            "ui.reset": "重置",
            "ui.keysSelectDungeonPrompt": "选择一个地下城以计算碎片总量。",
            "ui.keysShowPlanner": "展开规划器",
            "ui.keysHidePlanner": "收起规划器",
            "ui.keysAutoPrice": "自动",
            "ui.keysManualPrice": "手动价格输入",
            "ui.keysEachPrice": "@ {price} /个",
            "ui.keysBank": "预算",
            "ui.keysBankHelp": "设置你的金币预算后，规划器会根据当前价格反向计算你最多能买得起多少碎片。",
            "ui.keysBankPlaceholder": "当前金币",
            "ui.keysEstimatePrefix": "~",
            "ui.keysEstimateArtisanHelp": "启用 Artisan 时为估算值",
            "ui.artisan": "工匠",
            "ui.craft": "制作",
            "ui.cost": "成本",
            "ui.guzzlingPouchLevel": "畅饮袋等级",
            "ui.discoModeOn": "迪斯科模式已解锁。再连续切换几次主题就能退出。",
            "ui.discoModeOff": "迪斯科模式已关闭。理智恢复。",
            "ui.artisanCost": "工匠成本",
            "ui.craftCost": "制作成本",
            "ui.instantArtisan": "即时工匠",
            "ui.instantCraft": "即时制作",
            "ui.orderCraft": "挂单制作",
            "ui.refreshOfficialApi": "刷新官方 API",
            "ui.key": "钥匙",
            "ui.justNow": "刚刚",
            "ui.secondsAgo": "{count} 秒前",
            "ui.minutesAgo": "{count} 分钟前",
            "ui.hoursAgo": "{count} 小时前",
            "ui.daysAgo": "{count} 天前",
            "ui.refreshedStamp": "已刷新：{time}",
            "ui.afterKeyPrices": "宝箱利润",
            "ui.afterKeyPricesAria": "宝箱利润说明",
            "ui.afterKeyPricesTip": "这是扣除钥匙成本后的宝箱预估价值。\n普通宝箱会扣除入场钥匙和宝箱钥匙成本。\n精炼宝箱只扣除宝箱钥匙成本。\n区间：低 = 即时卖出，高 = 挂单卖出",
            "ui.normal": "普通",
            "ui.refined": "精炼",
            "ui.dailyProfit": "每日利润",
            "ui.combatBuffTitle": "战斗增益",
            "ui.consumablesDay": "消耗品 / 天",
            "ui.putNumberHere": "在这里输入数值",
            "ui.removeOnePercentDrops": "去除 1% 掉落",
            "ui.backEqualsMirror": "背部 = 镜子",
            "ui.backSlotEqualsMirror": "背部栏位 = 镜子",
            "ui.backSlotDropsEqualMirrorPrice": "背部掉落 = 镜子价格",
            "ui.zoneCompareKeyPlannerValues": "钥匙规划器制作成本",
            "ui.enterTierClearThenCalc": "输入任意层级通关时间后，点击计算。",
            "ui.apiWarnings": "API 警告",
            "ui.noItemsMatchFilter": "没有符合筛选条件的物品。",
            "ui.calculating": "计算中...",
            "ui.refreshingPricesAllZones": "正在刷新所有区域价格...",
            "ui.calculatingTierComparisons": "正在计算 12 个层级对比...",
            "ui.noValidClearTimes": "未输入有效通关时间。请先输入至少一个层级时间后再计算。",
            "ui.clearedZoneCompareInputs": "已清空区域对比输入。",
            "ui.manualLootOverridesReset": "手动掉落覆盖已重置为市场价格。",
            "ui.defaultsRestoredClickAgain": "默认值已恢复。再次点击“重置时间”可清空层级分钟。",
            "ui.resetTimes": "重置时间",
            "ui.manualLootEnabled": "已启用手动掉落价格。",
            "ui.enableManualLoot": "启用手动掉落价格。",
            "ui.addTierMinutesThenCalc": "请添加一个或多个层级分钟后再计算。",
            "ui.anErrorOccurredCalculation": "计算时发生错误",
            "ui.apiPriceMissingList": "以下物品的 API 价格缺失或为 -1：{items}{extra}。",
            "ui.apiPriceWarningPrefix": "API 价格警告：{warning}",
            "ui.apiRefreshFailed": "目前无法刷新价格。",
            "ui.apiRefreshFailedShort": "API 刷新失败。",
            "ui.apiRefreshUnavailable": "API 刷新不可用。",
            "ui.apiWarningsCount": " {count} 条 API 警告。",
            "ui.buffTier": "增益等级：",
            "ui.calculationComplete": "计算完成：已更新 {count} 个层级结果。{warn}{low}{warnNote}",
            "ui.calculationDependenciesMissing": "计算依赖未加载。",
            "ui.calculationFailedPrefix": "计算失败：{error}",
            "ui.chestEv": "宝箱 EV：",
            "ui.chestEvBreakdown": "宝箱 EV 明细（{side}）",
            "ui.chestEvBreakdownTitle": "宝箱 EV 明细",
            "ui.chestKeyAskBid": "宝箱钥匙（卖一/买一）：",
            "ui.contribution": "贡献",
            "ui.coreModulesNotLoaded": "核心模块未加载",
            "ui.deltaSumEv": "Δ（总和 - EV）：",
            "ui.developerPanel": "开发者面板",
            "ui.activeApi": "当前 API",
            "ui.apiCompareFilter": "API 对比筛选",
            "ui.differentOnly": "仅看差异",
            "ui.allItems": "所有物品",
            "ui.apiPriceCompare": "API 价格对比",
            "ui.apiCompareShowing": "显示 {shown} / {total} 个{label}",
            "ui.apiCompareFormula": "差值 = {left} - {right}",
            "ui.apiComparePositiveMeans": "正值表示 {left} 更高",
            "ui.apiCompareCellTitle": "{left} {side}: {leftValue} | {right} {side}: {rightValue} | 差值: {delta}",
            "ui.apiCompareMissingSource": "缺少一个已保存的 API 快照",
            "ui.bidDelta": "买一差值",
            "ui.askDelta": "卖一差值",
            "ui.relevantItems": "相关物品",
            "ui.keysPricingItems": "钥匙定价物品",
            "ui.tokenShopPricingItems": "代币商店定价物品",
            "ui.zoneComparePricingItems": "区域对比宝箱物品",
            "ui.entryKeyAskBid": "入场钥匙（卖一/买一）：",
            "ui.evCalculationFailed": "EV 计算失败。",
            "ui.evCalculationFailedZone": "该区域 EV 计算失败。",
            "ui.evInvalidValues": "EV 返回值无效。",
            "ui.highDay": "高值/天",
            "ui.highHour": "高值/小时",
            "ui.hoursShort": "{count}时 {rem}分",
            "ui.keyPricesMissing": "钥匙价格缺失或为 -1。",
            "ui.lowChanceItemsZeroedCount": " 已将 {count} 个低概率物品置零。",
            "ui.lowDay": "低值/天",
            "ui.lowHour": "低值/小时",
            "ui.manualPriceAria": "{item} 手动价格",
            "ui.noRelevantItems": "未找到相关物品。",
            "ui.noApiDiffs": "这个地下城没有发现有参考价值的 API 价差。",
            "ui.toggleSection": "切换分区",
            "ui.noData": "无数据",
            "ui.marketSnapshotMissing": "市场快照缺失。",
            "ui.minutesShort": "{count}分 {rem}秒",
            "ui.mirrorPriceMissing": "镜子 API 价格缺失；已跳过背部镜像覆盖。",
            "ui.mismatchSumVsEv": "不匹配（总和 vs EV）",
            "ui.mooketApiRefreshed": "Mooket API 已刷新。",
            "ui.mooketApiRefreshFailedToast": "Mooket API 当前无法刷新。",
            "ui.mooketApiRefreshUsingSaved": "Mooket API 当前无法刷新，正在使用你上次保存的价格。",
            "ui.mooketApiRefreshRetry": "Mooket API 当前无法刷新，请稍后再试。",
            "ui.moreCount": " 另有 +{count}",
            "ui.netDay": "净值/天",
            "ui.netHour": "净值/小时",
            "ui.noDungeonSelected": "未选择地下城。",
            "ui.noHridMapping": "所选地下城没有 HRID 映射。",
            "ui.officialApiRefreshed": "官方 API 已刷新{proxy}。",
            "ui.officialApiRefreshFailedToast": "官方 API 当前无法刷新。",
            "ui.officialApiRefreshUsingSaved": "官方 API 当前无法刷新，正在使用你上次保存的价格。",
            "ui.officialApiRefreshRetry": "官方 API 当前无法刷新，请稍后再试。",
            "ui.ok": "正常",
            "ui.price": "价格",
            "ui.proxySuffix": "（代理）",
            "ui.proxyViaSuffix": "（通过代理）",
            "ui.quantity": "数量",
            "ui.rangeMathTitle": "{label} 区间计算（税后）",
            "ui.rangeMathTitleNoLabel": "区间计算（税后）",
            "ui.refinedChestEvBreakdown": "精炼宝箱 EV 明细（{side}）",
            "ui.refinedChestEvBreakdownTitle": "精炼宝箱 EV 明细",
            "ui.refreshFailed": "刷新失败，请稍后再试。",
            "ui.secondsShort": "{count}秒",
            "ui.standardMathTitle": "{label} 标准计算（税后）",
            "ui.standardMathTitleNoLabel": "标准计算（税后）",
            "ui.sumContrib": "Σ 贡献：",
            "ui.taxPercent": "税率 %：",
            "ui.tipAfterKeyNormal": "宝箱利润普通：{range}",
            "ui.tipAfterKeyRefined": "宝箱利润精炼：{range}",
            "ui.tipChestsRefined": "宝箱：{chests} | 精炼：{refined}",
            "ui.tipDailyRegularTotal": "普通宝箱总计/天：{range}",
            "ui.tipDailyRefinedTotal": "精炼宝箱总计/天：{range}",
            "ui.tipDailyChestTotal": "宝箱合计/天：{range}",
            "ui.tipProfitRange": "利润区间：{range}",
            "ui.tipProfitLow": "每日利润低值（即时卖出）：{value}",
            "ui.tipProfitHigh": "每日利润高值（挂单卖出）：{value}",
            "ui.tipRunsEntryChestKeys": "每日次数：{runs} | 入场：{entry} | 宝箱钥匙：{chestKeys}",
            "ui.tipStandardExplained": "标准视图：{value} | 即时卖出按买一，钥匙按买一",
            "ui.tipStandard": "标准：{value}",
            "ui.trace": "追踪",
            "ui.tokenShopPricingItems": "代币商店定价物品",
            "ui.unableComputeEv": "无法计算 EV。",
            "ui.unknownRefreshState": "未知刷新状态。",
            "ui.value": "数值",
            "ui.zone": "区域",
            "ui.zoneComparisonFailed": "区域比较计算失败。",
            "ui.zoneComparePricingItems": "区域对比宝箱物品",
            "ui.zoneMissingDataCount": " 有 {count} 个区域缺少数据。",
            "ui.zoneSelector": "区域选择器",
            "ui.zoneView": "区域视图：",
            "ui.and": "和",
            "ui.calcModulesNotReady": "计算模块尚未就绪。",
            "ui.clearTime": "通关时间",
            "ui.item": "物品",
            "ui.manualKeys": "手动钥匙",
            "ui.manualKeysLine": "手动钥匙 + 官方 API • 支持入场/宝箱（k,m）",
            "ui.manualKeysWithSource": "手动 + {source}",
            "ui.manualKeysLineWithSource": "手动钥匙 + {source} API • 支持入场/宝箱（k,m）",
            "ui.keysPlannerLineWithSource": "钥匙规划器 + {source} API • 从钥匙页导入制造成本",
            "ui.keysTabImport": "钥匙页导入",
            "ui.openKeysTab": "打开钥匙页",
            "ui.keysImportDesc": "使用你在钥匙页中的制作设置，为每个地下城导入入场钥匙和宝箱钥匙成本。",
            "ui.keysImportPreviewEmpty": "使用钥匙页设置。",
            "ui.keysImportPreviewWithPrices": "{source} • 入场 {entry} • 宝箱 {chest}",
            "ui.keysImportTooltipTitle": "钥匙规划器导入",
            "ui.keysImportTooltipSource": "来源：{source}",
            "ui.keysImportTooltipBuyMode": "购买方式：{mode}",
            "ui.keysImportTooltipArtisan": "工匠茶：{state}",
            "ui.keysImportTooltipPouch": "暴食袋：{state}",
            "ui.keysImportTooltipPouchOn": "开启（+{level}）",
            "ui.keysImportTooltipEntry": "入场钥匙：{price}",
            "ui.keysImportTooltipChest": "宝箱钥匙：{price}",
            "ui.keysImportTooltipOverrides": "手动碎片覆盖：{count}",
            "ui.keysImportUnavailable": "钥匙规划器价格尚未就绪。",
            "ui.keysImportRecipeMissing": "缺少所选地下城的钥匙配方数据。",
            "ui.keysImportMissingPrices": "钥匙规划器的部分材料缺少价格。",
            "ui.keysImportMissingMessage": "钥匙规划器价格不可用。请检查钥匙页设置和价格。",
            "ui.minutesWord": "分钟",
            "ui.min": "分钟",
            "ui.missingKeyPriceData": "缺少所选地下城钥匙价格数据。",
            "ui.missingKeyPrices": "缺少钥匙价格。",
            "ui.missingMarketSnapshot": "缺少市场快照。",
            "ui.manualPlusMooket": "手动 + Mooket",
            "ui.mooketApiLine": "Mooket API • 玩家采集",
            "ui.mooketApiRefreshFailedPrefix": "Mooket API 刷新失败：",
            "ui.noApi": "无 API",
            "ui.noMarketPriceMessage": "当前没有市场价格数据。",
            "ui.officialApiRefreshFailedPrefix": "官方 API 刷新失败：",
            "ui.rangeSubInline": "低值使用掉落买一+钥匙卖一；高值使用掉落卖一+钥匙买一。",
            "ui.refreshPricingApi": "刷新定价 API",
            "ui.invalidApiPayload": "API 数据无效。",
            "ui.set": "已设置",
            "ui.standardSubInline": "标准使用掉落买一 - 2% 税；钥匙买一。",
            "ui.shareState": "分享状态",
            "ui.shareCopied": "分享链接已复制到剪贴板。",
            "ui.shareCopiedShort": "已复制",
            "ui.shareCopyFailed": "无法自动复制，请在分享面板中复制链接。",
            "ui.shareCopyFailedPrompt": "无法自动复制，已在浏览器弹窗中显示链接。",
            "ui.shareCopyManualTitle": "复制分享链接",
            "ui.shareCopyManualBody": "此处自动复制被阻止。可点击“再次复制”，或手动复制下方链接。",
            "ui.shareCopyManualField": "分享链接",
            "ui.shareCopyManualRetry": "再次复制",
            "ui.shareCopyManualClose": "关闭",
            "ui.shareCopyManualSelect": "请选择链接并手动复制。",
            "ui.profileSlot": "配置 {slot}",
            "ui.profileSlotEmpty": "配置 {slot}（空）",
            "ui.profileSlotLocked": "配置 {slot}（已锁定）",
            "ui.profileSlotSaveTarget": "配置 {slot}（空，点击可保存分享状态）",
            "ui.profileSlotReplaceTarget": "配置 {slot}（再次点击将替换为分享状态）",
            "ui.profileLoaded": "已加载配置 {slot}",
            "ui.profileLock": "锁定当前配置",
            "ui.profileUnlock": "解锁当前配置",
            "ui.profileLocked": "配置 {slot} 已锁定。",
            "ui.profileUnlocked": "配置 {slot} 已解锁。",
            "ui.profileLockedNoSave": "配置 {slot} 已锁定，先解锁后才能保存修改。",
            "ui.profileLockedViewing": "配置 {slot} 已锁定。再次点击配置 {slot} 可解锁并编辑。",
            "ui.profileLockedReadOnly": "配置 {slot} 已锁定，解锁后才能编辑数值。",
            "ui.sharedStateTempLoaded": "分享状态已临时载入。你可以保存到空配置位，或对未锁定的已有配置连点两次进行替换。",
            "ui.sharedStateTempLoadedPartial": "分享链接可能被截断。当前仅载入已恢复的关键数据。",
            "ui.sharedStateTempHint": "分享链接临时模式：点击空且未锁定的配置位即可保存，或对未锁定的已有配置连点两次进行替换。",
            "ui.sharedStateTempPartialHint": "分享链接可能被截断。当前仅载入已恢复的关键数据。你可以保存到空且未锁定的配置位，或对未锁定的已有配置连点两次进行替换。",
            "ui.sharedStateTempReplaceConfirm": "配置 {slot} 已有保存数据。再次点击即可用这份分享状态替换它。",
            "ui.sharedStateTempReplaceConfirmPartial": "分享链接可能被截断。再次点击配置 {slot} 即可用已恢复的关键数据替换它。",
            "ui.sharedStateSavedToSlot": "分享状态已保存到配置 {slot}。",
            "aria.heroLanding": "360Dungeon 首页",
            "aria.landingHeader": "首页头部",
            "aria.titleHoverArea": "360Dungeon 标题悬停区域",
            "aria.dungeonSelection": "地下城选择",
            "aria.tierSelection": "层级选择",
            "aria.tokenShopSelectedDungeon": "已选地下城的代币商店",
            "aria.keysProfitability": "钥匙收益",
            "aria.zoneComparePanel": "地下城区域对比",
            "aria.quickCalculator": "快速计算器",
            "aria.quickInputs": "快速输入",
            "aria.quickResults": "快速结果",
            "aria.advancedResults": "高级结果",
            "aria.combatBuffHelp": "战斗增益帮助",
            "aria.combatBuffSlider": "战斗增益滑块（0-20）",
            "aria.consumablesHelp": "消耗品帮助",
            "aria.consumablesCost": "每日消耗品成本",
            "aria.clearTimeInMinutes": "通关时间（分钟）",
            "aria.calculatorOptions": "计算选项",
            "aria.itemOverview": "地下城物品概览",
            "aria.selectionStatus": "选择状态",
            "aria.pricingChoices": "定价模型选项",
            "aria.manualLootToggle": "手动掉落价格开关",
            "aria.zoneCompareClearMinutes": "{zone} {tier} 通关分钟",
            "aria.zoneCompareDetails": "{zone} {tier} 详情",
        },

        "zh-Hant": {
            "ui.simulate": "模擬",
            "ui.reset": "重置",
            "ui.continue": "繼續",
            "ui.simulations": "模擬次數",
            "ui.entryKey": "入場鑰匙",
            "ui.chestKey": "寶箱鑰匙",
            "ui.chest": "寶箱",
            "ui.refinedChest": "精煉寶箱",
            "ui.drop33": "~33% 掉落率",

            "d.chimerical_den": "奇幻巢穴",
            "d.sinister_circus": "陰森馬戲團",
            "d.enchanted_fortress": "魔法堡壘",
            "d.pirate_cove": "海盜灣",

            "ui.simOverview": "模擬概覽",
            "ui.playerInfo": "玩家資訊",
            "ui.pricingModel": "鑰匙價格覆蓋",
            "ui.officialApi": "官方 API",
            "ui.manualInput": "手動輸入",
            "ui.otherApi": "Mooket API",
            "ui.tokenShop": "代幣商店",
            "ui.refreshPrices": "刷新價格",
            "ui.items": "物品",
            "ui.tokens": "代幣",
            "ui.ask": "賣一",
            "ui.lockAskPrice": "鎖定為賣一價格",
            "ui.lockAskPriceTip": "鎖定為\n賣一價格",
            "ui.bid": "買一",
            "ui.topCoinsPerToken": "每代幣最高金幣",
            "ui.calculate": "計算",
            "ui.calculationsLabel": "計算：",
            "ui.advanced": "進階",
            "ui.keys": "鑰匙",
            "ui.zoneCompare": "區域比較",
            "ui.quickCalculator": "快速計算器",
            "ui.quickStartHintDefault": "選擇地下城以快速開始",
            "ui.quickStartHintAdvanced": "選擇地下城以進入進階模式",
            "ui.quickStartHintTokenShop": "選擇地下城以查看代幣商店",
            "ui.tierHintDefault": "選擇一個層級以解鎖選項。",
            "ui.tierSelected": "已選層級：{tier}",
            "ui.refreshOfficialApiPrices": "刷新目前 API 價格",
            "ui.combatBuff": "戰鬥增益",
            "ui.combatBuffHelp": "目前戰鬥掉落數量（遊戲內）",
            "ui.enterNumber0to20": "請輸入 0 到 20 的數字。",
            "ui.consumablesPerDay": "每日消耗品",
            "ui.consumablesHelp": "預設每日 10m",
            "ui.clearTimeMinutes": "通關時間（分鐘）",
            "ui.clearTimePlaceholder": "例如 22",
            "ui.enterValidMinutes": "請輸入有效的分鐘數。",
            "ui.showRange": "顯示低-高區間",
            "ui.results": "結果",
            "ui.runsPerDay": "每日次數",
            "ui.entryKeys": "入場鑰匙",
            "ui.chestKeys": "寶箱鑰匙",
            "ui.profit": "利潤",
            "ui.selectDungeonTier": "選擇一個地下城和層級。",
            "ui.each": "單價",
            "ui.total": "總計",
            "ui.evPerChest": "每箱 EV",
            "ui.tokenValue": "代幣價值",
            "ui.resetSelection": "重置選擇",
            "ui.dungeon": "地下城",
            "ui.tier": "層級",
            "ui.pricing": "定價",
            "ui.clear": "通關",
            "ui.buff": "增益",
            "ui.override": "覆蓋",
            "ui.planner": "規劃器",
            "ui.acceptsFormats": "支援：600,000 • 600000 • 600k • 6m",
            "ui.entryKeyPrice": "入場鑰匙價格",
            "ui.chestKeyPrice": "寶箱鑰匙價格",
            "ui.entryPricePlaceholder": "例如 600k",
            "ui.chestPricePlaceholder": "例如 6m",
            "ui.enterValueLike": "請輸入例如 600k 或 6m。",
            "ui.lastRefresh": "上次檢查",
            "ui.usesOfficialEndpoint": "使用官方定價端點。",
            "ui.currentApiPrices": "目前 API 價格",
            "ui.usesSelectedApiKeyPrices": "使用頁腳所選 API 的即時購買鑰匙價格。",
            "ui.refreshNow": "立即刷新",
            "ui.instant": "即買",
            "ui.order": "掛單",
            "ui.alt": "替代",
            "ui.secondaryEndpoint": "用於比較的次要端點。",
            "ui.refresh": "刷新",
            "ui.notRefreshedYet": "尚未刷新。",
            "ui.needed": "必填",
            "ui.requiredToCalculate": "計算必填。",
            "ui.manualLootPrices": "手動掉落價格",
            "ui.overrideDropValues": "覆蓋 EV 計算使用的特定掉落值。",
            "ui.filterItems": "篩選物品",
            "ui.typeToSearch": "輸入以搜尋...",
            "ui.officialApiPrices": "目前 API 價格",
            "ui.resetLootPrices": "重置掉落價格",
            "ui.lootHintDefault": "顯示的是目前市場價格（佔位）。輸入數值可覆蓋，留白則使用市場價。",
            "ui.createdBy": "建立者",
            "ui.onShort": "開",
            "ui.offShort": "關",
            "ui.toggleOn": "開啟",
            "ui.toggleOff": "關閉",
            "ui.pickDungeonFirst": "請先選擇地下城。",
            "ui.pickTierFirst": "請先選擇層級。",
            "ui.nextSetClearBuff": "下一步：設定通關時間與戰鬥增益。",
            "ui.overridesClearedDungeon": "此地下城的覆蓋已清除。",
            "ui.nowChoosePricing": "現在請選擇定價模型。",
            "ui.selectApiForDefaults": "請在頁腳選擇一個 API 以檢視市場預設值。",
            "ui.enableManualLootEdit": "啟用手動掉落價格以編輯物品值。",
            "ui.refreshPricingDefaults": "刷新定價以載入這些物品的市場預設值。",
            "ui.pricesShownMarket": "顯示的是目前市場價格（佔位）。輸入數值可覆蓋，留白則使用市場價。",
            "ui.official": "官方",
            "ui.manualPlusOfficial": "手動 + 官方",
            "ui.keysPlannerPlusOfficial": "鑰匙規劃器 + 官方",
            "ui.mooket": "Mooket",
            "ui.keysPlannerPlusMooket": "鑰匙規劃器 + Mooket",
            "ui.market": "市場",
            "ui.mixed": "混合",
            "ui.refinedShards": "精煉碎片",
            "ui.officialApiRefreshed": "官方 API 已檢查新資料{proxy}。",
            "ui.mooketApiRefreshed": "Mooket API 已檢查新資料。",
            "ui.officialApiLastRefresh": "官方 API • 資料更新於：{age}",
            "ui.officialApiLastRefreshDash": "官方 API - 資料更新於：{age}",
            "ui.mooketUpdated": "Mooket 資料更新於：{time}{proxy}",
            "ui.apiDataUpdatedLine": "{source} API • 資料更新於：{age}",
            "ui.apiDataUpdatedTitle": "{source} API • 資料更新於：{age}",
            "ui.apiLoadErrorShort": "載入失敗",
            "ui.apiLoadErrorTitle": "{source} API 載入失敗。",
            "ui.apiLoadErrorPicker": "目前 API：{source}。載入失敗，點擊切換。",
            "ui.apiTestFailure": "API 已為測試停用。",
            "ui.activeApiPicker": "目前 API：{source}。點擊切換。",
            "ui.activeApiSelectedToast": "已選擇 {source} API。",
            "ui.refreshApiPricesTip": "檢查 {source} API 是否有新資料",
            "ui.changeApiSource": "切換 API 來源",
            "ui.checkedStamp": "上次檢查：{time}",
            "ui.runSummary": "通關時間：{clear} - 增益：{buff}",
            "ui.runClearFmt": "{value} 分鐘",
            "ui.runBuffFmt": "{value}/20",
            "ui.statusClearFmt": "{value}m",
            "ui.selectionSummary": "地下城：{dungeon} - 層級：{tier} - 定價：{pricing}",
            "ui.rangeSub": "區間：低值使用掉落買一+鑰匙賣一；高值使用掉落賣一+鑰匙買一。",
            "ui.standardSub": "標準：按買一即賣，稅率 2%；鑰匙按買一。",
            "ui.keysProfitPrediction": "鑰匙 + 利潤預估。",
            "ui.profitDash": "利潤：-",
            "ui.rangePerDay": "{low} - {high} / 天",
            "ui.rangePerHour": "{low} - {high} / 小時",
            "ui.valuePerDay": "{value} / 天",
            "ui.valuePerHour": "{value} / 小時",
            "ui.clearTimeRequired": "必須填寫通關時間。",
            "ui.buffMustRange": "戰鬥增益必須在 0-20。",
            "ui.playerInfoRequired": "玩家資訊必填（增益 0-20、通關時間）。",
            "ui.calculationFailedConsole": "計算失敗（請看主控台）。",
            "ui.clearedInputsResetManualOfficial": "已清空輸入，並將手動鑰匙價格重置為目前 API。",
            "ui.scrollUpAgainReturn": "再往上滑一次可返回首頁。",
            "ui.bestValue": "最佳價值",
            "ui.best": "最佳",
            "ui.coinsPerToken": "每代幣金幣",
            "ui.keysTable": "鑰匙表",
            "ui.keysChestCalc": "鑰匙成本規劃",
            "ui.keysChestTarget": "鑰匙數量",
            "ui.keysTargetForType": "{type}數量",
            "ui.keysInputPricing": "材料定價",
            "ui.keysFragmentPricing": "碎片定價",
            "ui.keysFragmentsNeeded": "需要的碎片",
            "ui.keysMaterialsNeeded": "需要的材料",
            "ui.keysTotalCost": "總成本",
            "ui.keysTotalForBudget": "你的預算可做的總鑰匙數",
            "ui.keysKeysProduced": "寶箱鑰匙",
            "ui.keysCraftRuns": "製作次數",
            "ui.reset": "重設",
            "ui.keysSelectDungeonPrompt": "選擇一個地下城以計算碎片總量。",
            "ui.keysShowPlanner": "展開規劃器",
            "ui.keysHidePlanner": "收起規劃器",
            "ui.keysAutoPrice": "自動",
            "ui.keysManualPrice": "手動價格輸入",
            "ui.keysEachPrice": "@ {price} /個",
            "ui.keysBank": "預算",
            "ui.keysBankHelp": "設定你的金幣預算後，規劃器會依照目前價格反向計算你最多買得起多少碎片。",
            "ui.keysBankPlaceholder": "目前金幣",
            "ui.keysEstimatePrefix": "~",
            "ui.keysEstimateArtisanHelp": "啟用 Artisan 時為估算值",
            "ui.artisan": "工匠",
            "ui.craft": "製作",
            "ui.cost": "成本",
            "ui.guzzlingPouchLevel": "暢飲袋等級",
            "ui.discoModeOn": "迪斯可模式已解鎖。再連續切換幾次主題就能退出。",
            "ui.discoModeOff": "迪斯可模式已關閉。理智恢復。",
            "ui.artisanCost": "工匠成本",
            "ui.craftCost": "製作成本",
            "ui.instantArtisan": "即時工匠",
            "ui.instantCraft": "即時製作",
            "ui.orderCraft": "掛單製作",
            "ui.refreshOfficialApi": "刷新官方 API",
            "ui.key": "鑰匙",
            "ui.justNow": "剛剛",
            "ui.secondsAgo": "{count} 秒前",
            "ui.minutesAgo": "{count} 分鐘前",
            "ui.hoursAgo": "{count} 小時前",
            "ui.daysAgo": "{count} 天前",
            "ui.refreshedStamp": "已刷新：{time}",
            "ui.afterKeyPrices": "寶箱利潤",
            "ui.afterKeyPricesAria": "寶箱利潤說明",
            "ui.afterKeyPricesTip": "這是扣除鑰匙成本後的寶箱預估價值。\n普通寶箱會扣除入場鑰匙和寶箱鑰匙成本。\n精煉寶箱只扣除寶箱鑰匙成本。\n區間：低 = 即時賣出，高 = 掛單賣出",
            "ui.normal": "普通",
            "ui.refined": "精煉",
            "ui.dailyProfit": "每日利潤",
            "ui.combatBuffTitle": "戰鬥增益",
            "ui.consumablesDay": "消耗品 / 天",
            "ui.putNumberHere": "在此輸入數值",
            "ui.removeOnePercentDrops": "移除 1% 掉落",
            "ui.backEqualsMirror": "背部 = 鏡子",
            "ui.backSlotEqualsMirror": "背部欄位 = 鏡子",
            "ui.backSlotDropsEqualMirrorPrice": "背部掉落 = 鏡子價格",
            "ui.zoneCompareKeyPlannerValues": "鑰匙規劃器製作成本",
            "ui.enterTierClearThenCalc": "輸入任一層級通關時間後，點擊計算。",
            "ui.apiWarnings": "API 警告",
            "ui.noItemsMatchFilter": "沒有符合篩選條件的物品。",
            "ui.calculating": "計算中...",
            "ui.refreshingPricesAllZones": "正在刷新所有區域價格...",
            "ui.calculatingTierComparisons": "正在計算 12 個層級比較...",
            "ui.noValidClearTimes": "未輸入有效通關時間。請先輸入至少一個層級時間再計算。",
            "ui.clearedZoneCompareInputs": "已清空區域比較輸入。",
            "ui.manualLootOverridesReset": "手動掉落覆蓋已重置為市場價格。",
            "ui.defaultsRestoredClickAgain": "已恢復預設值。再次點擊「重置時間」可清空層級分鐘。",
            "ui.resetTimes": "重置時間",
            "ui.manualLootEnabled": "已啟用手動掉落價格。",
            "ui.enableManualLoot": "啟用手動掉落價格。",
            "ui.addTierMinutesThenCalc": "請加入一或多個層級分鐘後再計算。",
            "ui.anErrorOccurredCalculation": "計算時發生錯誤",
            "ui.apiPriceMissingList": "下列物品的 API 價格缺失或為 -1：{items}{extra}。",
            "ui.apiPriceWarningPrefix": "API 價格警告：{warning}",
            "ui.apiRefreshFailed": "目前無法刷新價格。",
            "ui.apiRefreshFailedShort": "API 刷新失敗。",
            "ui.apiRefreshUnavailable": "API 刷新不可用。",
            "ui.apiWarningsCount": " {count} 條 API 警告。",
            "ui.buffTier": "增益等級：",
            "ui.calculationComplete": "計算完成：已更新 {count} 個層級結果。{warn}{low}{warnNote}",
            "ui.calculationDependenciesMissing": "計算相依模組未載入。",
            "ui.calculationFailedPrefix": "計算失敗：{error}",
            "ui.chestEv": "寶箱 EV：",
            "ui.chestEvBreakdown": "寶箱 EV 明細（{side}）",
            "ui.chestEvBreakdownTitle": "寶箱 EV 明細",
            "ui.chestKeyAskBid": "寶箱鑰匙（賣一/買一）：",
            "ui.contribution": "貢獻",
            "ui.coreModulesNotLoaded": "核心模組未載入",
            "ui.deltaSumEv": "Δ（總和 - EV）：",
            "ui.developerPanel": "開發者面板",
            "ui.activeApi": "目前 API",
            "ui.apiCompareFilter": "API 比對篩選",
            "ui.differentOnly": "只看差異",
            "ui.allItems": "所有物品",
            "ui.apiPriceCompare": "API 價格比較",
            "ui.apiCompareShowing": "顯示 {shown} / {total} 個{label}",
            "ui.apiCompareFormula": "差值 = {left} - {right}",
            "ui.apiComparePositiveMeans": "正值表示 {left} 較高",
            "ui.apiCompareCellTitle": "{left} {side}: {leftValue} | {right} {side}: {rightValue} | 差值: {delta}",
            "ui.apiCompareMissingSource": "缺少一個已儲存的 API 快照",
            "ui.bidDelta": "買一差值",
            "ui.askDelta": "賣一差值",
            "ui.relevantItems": "相關物品",
            "ui.keysPricingItems": "鑰匙定價物品",
            "ui.entryKeyAskBid": "入場鑰匙（賣一/買一）：",
            "ui.evCalculationFailed": "EV 計算失敗。",
            "ui.evCalculationFailedZone": "此區域 EV 計算失敗。",
            "ui.evInvalidValues": "EV 回傳值無效。",
            "ui.highDay": "高值/天",
            "ui.highHour": "高值/小時",
            "ui.hoursShort": "{count}時 {rem}分",
            "ui.keyPricesMissing": "鑰匙價格缺失或為 -1。",
            "ui.lowChanceItemsZeroedCount": " 已將 {count} 個低機率物品歸零。",
            "ui.lowDay": "低值/天",
            "ui.lowHour": "低值/小時",
            "ui.manualPriceAria": "{item} 手動價格",
            "ui.noRelevantItems": "找不到相關物品。",
            "ui.noApiDiffs": "這個地牢沒有發現有參考價值的 API 價差。",
            "ui.toggleSection": "切換區塊",
            "ui.noData": "無資料",
            "ui.marketSnapshotMissing": "市場快照缺失。",
            "ui.minutesShort": "{count}分 {rem}秒",
            "ui.mirrorPriceMissing": "鏡子 API 價格缺失；已略過背部鏡像覆蓋。",
            "ui.mismatchSumVsEv": "不匹配（總和 vs EV）",
            "ui.mooketApiRefreshed": "Mooket API 已刷新。",
            "ui.mooketApiRefreshFailedToast": "Mooket API 目前無法刷新。",
            "ui.mooketApiRefreshUsingSaved": "Mooket API 目前無法刷新，正在使用你上次儲存的價格。",
            "ui.mooketApiRefreshRetry": "Mooket API 目前無法刷新，請稍後再試。",
            "ui.moreCount": " 另有 +{count}",
            "ui.netDay": "淨值/天",
            "ui.netHour": "淨值/小時",
            "ui.noDungeonSelected": "未選擇地下城。",
            "ui.noHridMapping": "所選地下城沒有 HRID 映射。",
            "ui.officialApiRefreshed": "官方 API 已刷新{proxy}。",
            "ui.officialApiRefreshFailedToast": "官方 API 目前無法刷新。",
            "ui.officialApiRefreshUsingSaved": "官方 API 目前無法刷新，正在使用你上次儲存的價格。",
            "ui.officialApiRefreshRetry": "官方 API 目前無法刷新，請稍後再試。",
            "ui.ok": "正常",
            "ui.price": "價格",
            "ui.proxySuffix": "（代理）",
            "ui.proxyViaSuffix": "（透過代理）",
            "ui.quantity": "數量",
            "ui.rangeMathTitle": "{label} 區間計算（稅後）",
            "ui.rangeMathTitleNoLabel": "區間計算（稅後）",
            "ui.refinedChestEvBreakdown": "精煉寶箱 EV 明細（{side}）",
            "ui.refinedChestEvBreakdownTitle": "精煉寶箱 EV 明細",
            "ui.refreshFailed": "刷新失敗，請稍後再試。",
            "ui.secondsShort": "{count}秒",
            "ui.standardMathTitle": "{label} 標準計算（稅後）",
            "ui.standardMathTitleNoLabel": "標準計算（稅後）",
            "ui.sumContrib": "Σ 貢獻：",
            "ui.taxPercent": "稅率 %：",
            "ui.tipAfterKeyNormal": "寶箱利潤普通：{range}",
            "ui.tipAfterKeyRefined": "寶箱利潤精煉：{range}",
            "ui.tipChestsRefined": "寶箱：{chests} | 精煉：{refined}",
            "ui.tipDailyRegularTotal": "普通寶箱總計/天：{range}",
            "ui.tipDailyRefinedTotal": "精煉寶箱總計/天：{range}",
            "ui.tipDailyChestTotal": "寶箱合計/天：{range}",
            "ui.tipProfitRange": "利潤區間：{range}",
            "ui.tipProfitLow": "每日利潤低值（即時賣出）：{value}",
            "ui.tipProfitHigh": "每日利潤高值（掛單賣出）：{value}",
            "ui.tipRunsEntryChestKeys": "每日次數：{runs} | 入場：{entry} | 寶箱鑰匙：{chestKeys}",
            "ui.tipStandardExplained": "標準視圖：{value} | 即時賣出按買一，鑰匙按買一",
            "ui.tipStandard": "標準：{value}",
            "ui.trace": "追蹤",
            "ui.tokenShopPricingItems": "代幣商店定價物品",
            "ui.unableComputeEv": "無法計算 EV。",
            "ui.unknownRefreshState": "未知刷新狀態。",
            "ui.value": "數值",
            "ui.zone": "區域",
            "ui.zoneComparisonFailed": "區域比較計算失敗。",
            "ui.zoneComparePricingItems": "區域比較寶箱物品",
            "ui.zoneMissingDataCount": " 有 {count} 個區域缺少資料。",
            "ui.zoneSelector": "區域選擇器",
            "ui.zoneView": "區域視圖：",
            "ui.and": "和",
            "ui.calcModulesNotReady": "計算模組尚未就緒。",
            "ui.clearTime": "通關時間",
            "ui.item": "物品",
            "ui.manualKeys": "手動鑰匙",
            "ui.manualKeysLine": "手動鑰匙 + 官方 API • 支援入場/寶箱（k,m）",
            "ui.manualKeysWithSource": "手動 + {source}",
            "ui.manualKeysLineWithSource": "手動鑰匙 + {source} API • 支援入場/寶箱（k,m）",
            "ui.keysPlannerLineWithSource": "鑰匙規劃器 + {source} API • 從鑰匙頁匯入製作成本",
            "ui.keysTabImport": "鑰匙頁匯入",
            "ui.openKeysTab": "打開鑰匙頁",
            "ui.keysImportDesc": "使用你在鑰匙頁中的製作設定，為每個地下城匯加入場鑰匙與寶箱鑰匙成本。",
            "ui.keysImportPreviewEmpty": "使用鑰匙頁設定。",
            "ui.keysImportPreviewWithPrices": "{source} • 入場 {entry} • 寶箱 {chest}",
            "ui.keysImportTooltipTitle": "鑰匙規劃器匯入",
            "ui.keysImportTooltipSource": "來源：{source}",
            "ui.keysImportTooltipBuyMode": "購買方式：{mode}",
            "ui.keysImportTooltipArtisan": "工匠茶：{state}",
            "ui.keysImportTooltipPouch": "暴食袋：{state}",
            "ui.keysImportTooltipPouchOn": "開啟（+{level}）",
            "ui.keysImportTooltipEntry": "入場鑰匙：{price}",
            "ui.keysImportTooltipChest": "寶箱鑰匙：{price}",
            "ui.keysImportTooltipOverrides": "手動碎片覆蓋：{count}",
            "ui.keysImportUnavailable": "鑰匙規劃器價格尚未就緒。",
            "ui.keysImportRecipeMissing": "缺少所選地下城的鑰匙配方資料。",
            "ui.keysImportMissingPrices": "鑰匙規劃器的部分材料缺少價格。",
            "ui.keysImportMissingMessage": "鑰匙規劃器價格不可用。請檢查鑰匙頁設定和價格。",
            "ui.minutesWord": "分鐘",
            "ui.min": "分鐘",
            "ui.missingKeyPriceData": "缺少所選地下城鑰匙價格資料。",
            "ui.missingKeyPrices": "缺少鑰匙價格。",
            "ui.missingMarketSnapshot": "缺少市場快照。",
            "ui.manualPlusMooket": "手動 + Mooket",
            "ui.mooketApiLine": "Mooket API • 玩家蒐集",
            "ui.mooketApiRefreshFailedPrefix": "Mooket API 刷新失敗：",
            "ui.noApi": "無 API",
            "ui.noMarketPriceMessage": "目前沒有市場價格資料。",
            "ui.officialApiRefreshFailedPrefix": "官方 API 刷新失敗：",
            "ui.rangeSubInline": "低值使用掉落買一+鑰匙賣一；高值使用掉落賣一+鑰匙買一。",
            "ui.refreshPricingApi": "刷新定價 API",
            "ui.invalidApiPayload": "API 資料無效。",
            "ui.set": "已設定",
            "ui.standardSubInline": "標準使用掉落買一 - 2% 稅；鑰匙買一。",
            "ui.shareState": "分享狀態",
            "ui.shareCopied": "分享連結已複製到剪貼簿。",
            "ui.shareCopiedShort": "已複製",
            "ui.shareCopyFailed": "無法自動複製，請在分享面板中複製連結。",
            "ui.shareCopyFailedPrompt": "無法自動複製，已在瀏覽器彈窗中顯示連結。",
            "ui.shareCopyManualTitle": "複製分享連結",
            "ui.shareCopyManualBody": "此處自動複製被阻止。可點擊「再次複製」，或手動複製下方連結。",
            "ui.shareCopyManualField": "分享連結",
            "ui.shareCopyManualRetry": "再次複製",
            "ui.shareCopyManualClose": "關閉",
            "ui.shareCopyManualSelect": "請選取連結並手動複製。",
            "ui.profileSlot": "配置 {slot}",
            "ui.profileSlotEmpty": "配置 {slot}（空）",
            "ui.profileSlotLocked": "配置 {slot}（已鎖定）",
            "ui.profileSlotSaveTarget": "配置 {slot}（空，點擊可儲存分享狀態）",
            "ui.profileSlotReplaceTarget": "配置 {slot}（再次點擊將替換為分享狀態）",
            "ui.profileLoaded": "已載入配置 {slot}",
            "ui.profileLock": "鎖定目前配置",
            "ui.profileUnlock": "解除鎖定目前配置",
            "ui.profileLocked": "配置 {slot} 已鎖定。",
            "ui.profileUnlocked": "配置 {slot} 已解除鎖定。",
            "ui.profileLockedNoSave": "配置 {slot} 已鎖定，請先解除鎖定再儲存修改。",
            "ui.profileLockedViewing": "配置 {slot} 已鎖定。再次點擊配置 {slot} 可解除鎖定並編輯。",
            "ui.profileLockedReadOnly": "配置 {slot} 已鎖定，請先解除鎖定再編輯數值。",
            "ui.sharedStateTempLoaded": "分享狀態已暫時載入。你可以儲存到空配置位，或對未鎖定的已有配置連點兩次進行替換。",
            "ui.sharedStateTempLoadedPartial": "分享連結可能被截斷。目前僅載入已恢復的關鍵資料。",
            "ui.sharedStateTempHint": "分享連結暫時模式：點擊空且未鎖定的配置位即可儲存，或對未鎖定的已有配置連點兩次進行替換。",
            "ui.sharedStateTempPartialHint": "分享連結可能被截斷。目前僅載入已恢復的關鍵資料。你可以儲存到空且未鎖定的配置位，或對未鎖定的已有配置連點兩次進行替換。",
            "ui.sharedStateTempReplaceConfirm": "配置 {slot} 已有儲存資料。再次點擊即可用這份分享狀態替換它。",
            "ui.sharedStateTempReplaceConfirmPartial": "分享連結可能被截斷。再次點擊配置 {slot} 即可用已恢復的關鍵資料替換它。",
            "ui.sharedStateSavedToSlot": "分享狀態已儲存到配置 {slot}。",
            "aria.heroLanding": "360Dungeon 首頁",
            "aria.landingHeader": "首頁標頭",
            "aria.titleHoverArea": "360Dungeon 標題懸停區",
            "aria.dungeonSelection": "地下城選擇",
            "aria.tierSelection": "層級選擇",
            "aria.tokenShopSelectedDungeon": "已選地下城的代幣商店",
            "aria.keysProfitability": "鑰匙收益",
            "aria.zoneComparePanel": "地下城區域比較",
            "aria.quickCalculator": "快速計算器",
            "aria.quickInputs": "快速輸入",
            "aria.quickResults": "快速結果",
            "aria.advancedResults": "進階結果",
            "aria.combatBuffHelp": "戰鬥增益說明",
            "aria.combatBuffSlider": "戰鬥增益滑桿（0-20）",
            "aria.consumablesHelp": "消耗品說明",
            "aria.consumablesCost": "每日消耗品成本",
            "aria.clearTimeInMinutes": "通關時間（分鐘）",
            "aria.calculatorOptions": "計算選項",
            "aria.itemOverview": "地下城物品總覽",
            "aria.selectionStatus": "選擇狀態",
            "aria.pricingChoices": "定價模型選項",
            "aria.manualLootToggle": "手動掉落價格開關",
            "aria.zoneCompareClearMinutes": "{zone} {tier} 通關分鐘",
            "aria.zoneCompareDetails": "{zone} {tier} 詳情",
        }
    };

    function parseWhitelistText(text) {
        const next = new Set(DEFAULT_WHITELIST_TERMS);
        String(text || "").split(/\r?\n/).forEach((rawLine) => {
            const line = String(rawLine || "").trim();
            if (!line) return;
            if (line.startsWith("#")) return;
            if (/^\[.*\]$/.test(line)) return;
            next.add(line);
        });
        return next;
    }

    async function loadWhitelist() {
        try {
            const res = await fetch(WHITELIST_URL, { cache: "no-store" });
            if (!res.ok) return false;
            const text = await res.text();
            whitelistTerms = parseWhitelistText(text);
            return true;
        } catch (_) {
            return false;
        }
    }

    function isWhitelistedTerm(value) {
        if (typeof value !== "string") return false;
        const normalized = value.trim();
        if (!normalized) return false;
        return whitelistTerms.has(normalized);
    }

    function resolveI18nValue(key, fallback = "", lang = getLang()) {
        const enValue = (I18N.en && I18N.en[key]) || "";
        const langValue = (I18N[lang] && I18N[lang][key]) || "";
        if (isWhitelistedTerm(enValue)) return enValue;
        if (isWhitelistedTerm(langValue)) return langValue;
        if (isWhitelistedTerm(fallback)) return fallback;
        return langValue || enValue || fallback;
    }

    function createLzStringCodec(alphabet) {
        const reverseLookup = {};

        function getBaseValue(ch) {
            if (!Object.prototype.hasOwnProperty.call(reverseLookup, ch)) {
                reverseLookup[ch] = alphabet.indexOf(ch);
            }
            return reverseLookup[ch];
        }

        function compressToEncodedURIComponent(input) {
            if (input == null) return "";
            return compress(String(input), 6, (value) => alphabet.charAt(value));
        }

        function decompressFromEncodedURIComponent(input) {
            if (input == null) return "";
            const text = String(input || "");
            if (!text) return "";
            return decompress(text.length, 32, (index, source) => getBaseValue(source.charAt(index)), text);
        }

        function compress(uncompressed, bitsPerChar, getCharFromInt) {
            if (uncompressed == null) return "";
            let value;
            const dictionary = {};
            const dictionaryToCreate = {};
            let contextC = "";
            let contextWC = "";
            let contextW = "";
            let enlargeIn = 2;
            let dictSize = 3;
            let numBits = 2;
            const data = [];
            let dataVal = 0;
            let dataPosition = 0;

            const writeBit = (bit) => {
                dataVal = (dataVal << 1) | bit;
                if (dataPosition === bitsPerChar - 1) {
                    dataPosition = 0;
                    data.push(getCharFromInt(dataVal));
                    dataVal = 0;
                } else {
                    dataPosition += 1;
                }
            };

            const writeBits = (bitCount, initialValue) => {
                let bitIndex = 0;
                let nextValue = initialValue;
                while (bitIndex < bitCount) {
                    writeBit(nextValue & 1);
                    nextValue >>= 1;
                    bitIndex += 1;
                }
            };

            for (let ii = 0; ii < uncompressed.length; ii += 1) {
                contextC = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(dictionary, contextC)) {
                    dictionary[contextC] = dictSize;
                    dictSize += 1;
                    dictionaryToCreate[contextC] = true;
                }

                contextWC = contextW + contextC;
                if (Object.prototype.hasOwnProperty.call(dictionary, contextWC)) {
                    contextW = contextWC;
                    continue;
                }

                if (Object.prototype.hasOwnProperty.call(dictionaryToCreate, contextW)) {
                    if (contextW.charCodeAt(0) < 256) {
                        writeBits(numBits, 0);
                        writeBits(8, contextW.charCodeAt(0));
                    } else {
                        writeBits(numBits, 1);
                        writeBits(16, contextW.charCodeAt(0));
                    }
                    enlargeIn -= 1;
                    if (enlargeIn === 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits += 1;
                    }
                    delete dictionaryToCreate[contextW];
                } else {
                    value = dictionary[contextW];
                    writeBits(numBits, value);
                }

                enlargeIn -= 1;
                if (enlargeIn === 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits += 1;
                }

                dictionary[contextWC] = dictSize;
                dictSize += 1;
                contextW = String(contextC);
            }

            if (contextW !== "") {
                if (Object.prototype.hasOwnProperty.call(dictionaryToCreate, contextW)) {
                    if (contextW.charCodeAt(0) < 256) {
                        writeBits(numBits, 0);
                        writeBits(8, contextW.charCodeAt(0));
                    } else {
                        writeBits(numBits, 1);
                        writeBits(16, contextW.charCodeAt(0));
                    }
                    enlargeIn -= 1;
                    if (enlargeIn === 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits += 1;
                    }
                    delete dictionaryToCreate[contextW];
                } else {
                    value = dictionary[contextW];
                    writeBits(numBits, value);
                }

                enlargeIn -= 1;
                if (enlargeIn === 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits += 1;
                }
            }

            writeBits(numBits, 2);

            while (true) {
                dataVal <<= 1;
                if (dataPosition === bitsPerChar - 1) {
                    data.push(getCharFromInt(dataVal));
                    break;
                }
                dataPosition += 1;
            }

            return data.join("");
        }

        function decompress(length, resetValue, getNextValue, source) {
            const dictionary = [];
            const result = [];
            const data = { value: getNextValue(0, source), position: resetValue, index: 1 };
            let enlargeIn = 4;
            let dictSize = 4;
            let numBits = 3;
            let entry = "";
            let bits = 0;
            let c = "";
            let w = "";

            const readBits = (bitCount) => {
                let out = 0;
                let currentPower = 1;
                const currentMaxPower = Math.pow(2, bitCount);
                while (currentPower !== currentMaxPower) {
                    const resb = data.value & data.position;
                    data.position >>= 1;
                    if (data.position === 0) {
                        data.position = resetValue;
                        data.value = getNextValue(data.index, source);
                        data.index += 1;
                    }
                    out |= (resb > 0 ? 1 : 0) * currentPower;
                    currentPower <<= 1;
                }
                return out;
            };

            for (let i = 0; i < 3; i += 1) dictionary[i] = i;

            bits = readBits(2);
            switch (bits) {
                case 0:
                    c = String.fromCharCode(readBits(8));
                    break;
                case 1:
                    c = String.fromCharCode(readBits(16));
                    break;
                case 2:
                    return "";
                default:
                    return "";
            }

            dictionary[3] = c;
            w = c;
            result.push(c);

            while (true) {
                if (data.index > length) return "";

                const code = readBits(numBits);
                switch (code) {
                    case 0:
                        dictionary[dictSize] = String.fromCharCode(readBits(8));
                        c = dictSize;
                        dictSize += 1;
                        enlargeIn -= 1;
                        break;
                    case 1:
                        dictionary[dictSize] = String.fromCharCode(readBits(16));
                        c = dictSize;
                        dictSize += 1;
                        enlargeIn -= 1;
                        break;
                    case 2:
                        return result.join("");
                    default:
                        c = code;
                        break;
                }

                if (enlargeIn === 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits += 1;
                }

                if (dictionary[c]) {
                    entry = dictionary[c];
                } else if (c === dictSize) {
                    entry = w + w.charAt(0);
                } else {
                    return "";
                }
                result.push(entry);

                dictionary[dictSize] = w + entry.charAt(0);
                dictSize += 1;
                enlargeIn -= 1;
                w = entry;

                if (enlargeIn === 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits += 1;
                }
            }
        }

        return {
            compressToEncodedURIComponent,
            decompressFromEncodedURIComponent,
        };
    }

    const LZStringHashCodec = createLzStringCodec("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+$_");

    function normalizeProfileSlot(raw, fallback = 1) {
        const n = Number(raw);
        if (Number.isInteger(n) && n >= 1 && n <= PROFILE_SLOT_COUNT) return n;
        return fallback;
    }

    function profileStorageKey(slot) {
        return `${LS_PROFILE_PREFIX}${normalizeProfileSlot(slot)}.v1`;
    }

    function readProfileLocks() {
        try {
            const raw = storageGetItem(LS_PROFILE_LOCKS);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return {};
            const out = {};
            for (let slot = 1; slot <= PROFILE_SLOT_COUNT; slot += 1) {
                const flag = parsed[slot] ?? parsed[String(slot)];
                if (!flag) continue;
                out[slot] = true;
            }
            return out;
        } catch (_) {
            return {};
        }
    }

    function writeProfileLocks(rawMap) {
        const next = {};
        let hasLocked = false;
        for (let slot = 1; slot <= PROFILE_SLOT_COUNT; slot += 1) {
            if (!rawMap || !rawMap[slot]) continue;
            next[slot] = 1;
            hasLocked = true;
        }
        try {
            if (!hasLocked) {
                storageRemoveItem(LS_PROFILE_LOCKS);
                return true;
            }
            storageSetItem(LS_PROFILE_LOCKS, JSON.stringify(next));
            return true;
        } catch (_) {
            return false;
        }
    }

    function isProfileLocked(slotRaw) {
        const slot = normalizeProfileSlot(slotRaw, 1);
        const map = readProfileLocks();
        return !!map[slot];
    }

    function setProfileLocked(slotRaw, locked) {
        const slot = normalizeProfileSlot(slotRaw, 1);
        const map = readProfileLocks();
        if (locked) {
            map[slot] = true;
        } else {
            delete map[slot];
        }
        return writeProfileLocks(map);
    }

    function sanitizeStateValue(key, value) {
        const raw = String(value == null ? "" : value);
        if (key === "dungeon.selectedDungeon") {
            const normalized = raw.trim().toLowerCase();
            if (!normalized || !SHARE_DUNGEON_KEY_RE.test(normalized)) return "";
            return normalized;
        }
        if (key === "dungeon.selectedTier") {
            const normalized = raw.trim().toUpperCase();
            if (!normalized || !SHARE_TIER_KEY_RE.test(normalized)) return "";
            return normalized;
        }
        if (key === "dungeon.pricingModel") {
            const normalized = raw.trim().toLowerCase();
            return SHARE_PRICING_MODE_SET.has(normalized) ? normalized : "api";
        }
        if (key === "dungeon.viewMode.v1") {
            const normalized = normalizeShareViewMode(raw);
            return normalized || "";
        }
        return raw;
    }

    function canonicalizeSharedLootStateMap(map) {
        if (!map || typeof map !== "object") return map;
        if (!map[SHARED_LOOT_OVERRIDE_ENABLED_KEY] && map[LEGACY_ZONE_MANUAL_LOOT_KEY] === "1") {
            map[SHARED_LOOT_OVERRIDE_ENABLED_KEY] = "1";
        }
        if (!map[SHARED_LOOT_PRICE_OVERRIDES_KEY] && map[LEGACY_ZONE_MANUAL_OVERRIDES_KEY]) {
            map[SHARED_LOOT_PRICE_OVERRIDES_KEY] = map[LEGACY_ZONE_MANUAL_OVERRIDES_KEY];
        }
        delete map[LEGACY_ZONE_MANUAL_LOOT_KEY];
        delete map[LEGACY_ZONE_MANUAL_OVERRIDES_KEY];
        return map;
    }

    function sanitizeStateMap(raw) {
        const out = {};
        if (!raw || typeof raw !== "object") return out;
        Object.entries(raw).forEach(([key, value]) => {
            if (!STATE_KEYS_SET.has(key)) return;
            if (value == null) return;
            const safeValue = sanitizeStateValue(key, value);
            if (safeValue == null || safeValue === "") return;
            out[key] = safeValue;
        });
        return canonicalizeSharedLootStateMap(out);
    }

    function hasStateData(rawMap) {
        return !!(rawMap && typeof rawMap === "object" && Object.keys(rawMap).length > 0);
    }

    function snapshotHasData(snapshot) {
        return hasStateData(snapshot && snapshot.state ? snapshot.state : null);
    }

    function isTempSharedModeActive() {
        return tempSharedMode;
    }

    function isTempSharedPartialState() {
        return tempSharedMode && tempSharedPartial;
    }

    function setTempSharedState(rawMap, options = {}) {
        tempSharedMode = !!(rawMap && typeof rawMap === "object");
        tempSharedPartial = tempSharedMode && !!options.partial;
        clearPendingSharedReplace({ refresh: false });
    }

    function clearTempSharedState() {
        tempSharedMode = false;
        tempSharedPartial = false;
        clearPendingSharedReplace({ refresh: false });
    }

    function captureStateMap() {
        const out = {};
        STATE_KEYS.forEach((key) => {
            const value = storageGetItem(key);
            if (value == null || value === "") return;
            out[key] = String(value);
        });
        return sanitizeStateMap(out);
    }

    function applyStateMap(rawMap) {
        const map = sanitizeStateMap(rawMap);
        STATE_KEYS.forEach((key) => storageRemoveItem(key));
        Object.entries(map).forEach(([key, value]) => storageSetItem(key, value));
    }

    function getActiveProfileSlot() {
        return normalizeProfileSlot(storageGetItem(LS_PROFILE_ACTIVE), 1);
    }

    function setActiveProfileSlot(slot) {
        storageSetItem(LS_PROFILE_ACTIVE, String(normalizeProfileSlot(slot)));
    }

    function readProfileSnapshot(slot) {
        try {
            const raw = storageGetItem(profileStorageKey(slot));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return null;
            return {
                v: Number(parsed.v) || PROFILE_SNAPSHOT_VERSION,
                savedAt: Number(parsed.savedAt) || Date.now(),
                state: sanitizeStateMap(parsed.state),
            };
        } catch (_) {
            return null;
        }
    }

    function writeProfileSnapshot(slot, map) {
        const normalizedSlot = normalizeProfileSlot(slot, 1);
        if (isProfileLocked(normalizedSlot)) return false;
        const state = sanitizeStateMap(map);
        if (!hasStateData(state)) {
            try {
                storageRemoveItem(profileStorageKey(normalizedSlot));
                return true;
            } catch (_) {
                return false;
            }
        }

        const payload = {
            v: PROFILE_SNAPSHOT_VERSION,
            savedAt: Date.now(),
            state,
        };
        try {
            storageSetItem(profileStorageKey(normalizedSlot), JSON.stringify(payload));
            return true;
        } catch (_) {
            return false;
        }
    }

    function saveCurrentStateToProfile(slot = getActiveProfileSlot()) {
        return writeProfileSnapshot(slot, captureStateMap());
    }

    function saveCurrentStateIfPersistent() {
        if (isTempSharedModeActive()) return false;
        return saveCurrentStateToProfile();
    }

    function toggleActiveProfileLock(slotRaw = getActiveProfileSlot()) {
        const slot = normalizeProfileSlot(slotRaw, 1);
        const nextLocked = !isProfileLocked(slot);
        if (!setProfileLocked(slot, nextLocked)) return false;
        refreshProfileControls();
        const key = nextLocked ? "ui.profileLocked" : "ui.profileUnlocked";
        const fallback = nextLocked ? "Profile {slot} locked." : "Profile {slot} unlocked.";
        notify(tf(key, fallback, { slot }));
        return true;
    }

    let profileLockNoticeAt = 0;
    let profileLockGuardBound = false;

    function isRestrictedWhileLocked(target) {
        if (!(target instanceof Element)) return false;
        return !!target.closest(LOCK_RESTRICTED_SELECTOR);
    }

    function syncLockedControlsState(locked = isProfileLocked(getActiveProfileSlot())) {
        const isLocked = !!locked;
        document.body.classList.toggle("profile-locked", isLocked);

        document.querySelectorAll("input, select, textarea, button").forEach((el) => {
            const isRestricted = isRestrictedWhileLocked(el);
            if (isLocked && isRestricted) {
                if (!Object.prototype.hasOwnProperty.call(el.dataset, "profileLockPrevDisabled")) {
                    el.dataset.profileLockPrevDisabled = el.disabled ? "1" : "0";
                }
                el.disabled = true;
                if ("readOnly" in el && !Object.prototype.hasOwnProperty.call(el.dataset, "profileLockPrevReadonly")) {
                    el.dataset.profileLockPrevReadonly = el.readOnly ? "1" : "0";
                    el.readOnly = true;
                }
                return;
            }

            if (Object.prototype.hasOwnProperty.call(el.dataset, "profileLockPrevDisabled")) {
                el.disabled = el.dataset.profileLockPrevDisabled === "1";
                delete el.dataset.profileLockPrevDisabled;
            }
            if ("readOnly" in el && Object.prototype.hasOwnProperty.call(el.dataset, "profileLockPrevReadonly")) {
                el.readOnly = el.dataset.profileLockPrevReadonly === "1";
                delete el.dataset.profileLockPrevReadonly;
            }
        });
    }

    function shouldBlockLockedInteraction(target) {
        if (!document.body.classList.contains("profile-locked")) return false;
        if (!(target instanceof Element)) return false;
        if (!isRestrictedWhileLocked(target)) return false;
        return true;
    }

    function notifyLockedReadOnlyMode() {
        const now = Date.now();
        if (now - profileLockNoticeAt < 1100) return;
        profileLockNoticeAt = now;
        const slot = getActiveProfileSlot();
        notify(tf("ui.profileLockedReadOnly", "Profile {slot} is locked. Unlock it to edit values.", { slot }));
    }

    function blockLockedInteraction(event) {
        if (!shouldBlockLockedInteraction(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        notifyLockedReadOnlyMode();
    }

    function bindProfileLockInteractionGuard() {
        if (profileLockGuardBound) return;
        profileLockGuardBound = true;
        document.addEventListener("click", blockLockedInteraction, true);
        document.addEventListener("beforeinput", blockLockedInteraction, true);
        document.addEventListener("input", blockLockedInteraction, true);
        document.addEventListener("change", blockLockedInteraction, true);
        document.addEventListener("zone-compare:rendered", () => {
            syncLockedControlsState();
        });
    }

    let profileStatusHideTimer = 0;
    let profileStatusClearTimer = 0;
    const PROFILE_STATUS_VISIBLE_MS = 2400;
    const PROFILE_STATUS_FADE_MS = 260;
    const PROFILE_SHARED_REPLACE_CONFIRM_MS = 5200;
    let pendingSharedReplaceSlot = 0;
    let pendingSharedReplaceTimer = 0;
    let shareButtonFeedbackTimer = 0;
    const SHARE_BUTTON_FEEDBACK_MS = 1800;
    let shareFallbackDialogRefs = null;
    let shareFallbackDialogUrl = "";
    let shareFallbackDialogReturnFocus = null;

    function clearProfileStatusTimers() {
        if (profileStatusHideTimer) {
            window.clearTimeout(profileStatusHideTimer);
            profileStatusHideTimer = 0;
        }
        if (profileStatusClearTimer) {
            window.clearTimeout(profileStatusClearTimer);
            profileStatusClearTimer = 0;
        }
    }

    function clearPendingSharedReplace({ refresh = true } = {}) {
        if (pendingSharedReplaceTimer) {
            window.clearTimeout(pendingSharedReplaceTimer);
            pendingSharedReplaceTimer = 0;
        }
        if (!pendingSharedReplaceSlot) return;
        pendingSharedReplaceSlot = 0;
        if (refresh) refreshProfileControls();
    }

    function armPendingSharedReplace(slotRaw) {
        const slot = normalizeProfileSlot(slotRaw, 1);
        if (pendingSharedReplaceTimer) {
            window.clearTimeout(pendingSharedReplaceTimer);
            pendingSharedReplaceTimer = 0;
        }
        pendingSharedReplaceSlot = slot;
        pendingSharedReplaceTimer = window.setTimeout(() => {
            pendingSharedReplaceTimer = 0;
            if (!pendingSharedReplaceSlot) return;
            pendingSharedReplaceSlot = 0;
            if (isTempSharedModeActive()) refreshProfileControls();
        }, PROFILE_SHARED_REPLACE_CONFIRM_MS);
        return slot;
    }

    function clearShareButtonFeedbackTimer() {
        if (!shareButtonFeedbackTimer) return;
        window.clearTimeout(shareButtonFeedbackTimer);
        shareButtonFeedbackTimer = 0;
    }

    function setShareButtonFeedbackState(copied) {
        const shareBtn = document.getElementById("shareStateBtn");
        if (!shareBtn) return;
        const copiedActive = !!copied;
        shareBtn.classList.toggle("is-copied", copiedActive);
        if (copiedActive) {
            shareBtn.setAttribute("data-feedback", t("ui.shareCopiedShort", "Copied"));
        } else {
            shareBtn.removeAttribute("data-feedback");
        }
        const label = copiedActive
            ? t("ui.shareCopied", "Share link copied to clipboard.")
            : t("ui.shareState", "Share state");
        shareBtn.setAttribute("aria-label", label);
        if (copiedActive) {
            shareBtn.removeAttribute("title");
        } else {
            shareBtn.setAttribute("title", label);
        }
    }

    function flashShareButtonCopiedState() {
        clearShareButtonFeedbackTimer();
        setShareButtonFeedbackState(true);
        shareButtonFeedbackTimer = window.setTimeout(() => {
            shareButtonFeedbackTimer = 0;
            setShareButtonFeedbackState(false);
        }, SHARE_BUTTON_FEEDBACK_MS);
    }

    function selectShareFallbackDialogField(focusField = false) {
        const field = shareFallbackDialogRefs?.field;
        if (!field) return;
        if (focusField) {
            try {
                field.focus({ preventScroll: true });
            } catch (_) {
                try { field.focus(); } catch (_) { }
            }
        }
        try {
            field.select();
            if (typeof field.setSelectionRange === "function") field.setSelectionRange(0, field.value.length);
        } catch (_) { }
    }

    function syncShareFallbackDialogText() {
        const refs = shareFallbackDialogRefs;
        if (!refs || !refs.overlay?.isConnected) return;
        const title = t("ui.shareCopyManualTitle", "Copy share link");
        const body = t("ui.shareCopyManualBody", "Automatic copy was blocked here. Use Copy Again or copy the link below manually.");
        const fieldLabel = t("ui.shareCopyManualField", "Share link");
        const retryLabel = t("ui.shareCopyManualRetry", "Copy Again");
        const closeLabel = t("ui.shareCopyManualClose", "Close");
        refs.dialog.setAttribute("aria-label", title);
        refs.title.textContent = title;
        refs.body.textContent = body;
        refs.label.textContent = fieldLabel;
        refs.field.setAttribute("aria-label", fieldLabel);
        refs.retryBtn.textContent = retryLabel;
        refs.retryBtn.setAttribute("aria-label", retryLabel);
        refs.closeBtn.textContent = closeLabel;
        refs.closeBtn.setAttribute("aria-label", closeLabel);
    }

    function closeShareFallbackDialog({ restoreFocus = true } = {}) {
        const refs = shareFallbackDialogRefs;
        if (!refs || !refs.overlay?.isConnected) return;
        refs.overlay.hidden = true;
        refs.overlay.classList.remove("is-open");
        refs.field.value = "";
        shareFallbackDialogUrl = "";
        const returnFocusEl = restoreFocus ? shareFallbackDialogReturnFocus : null;
        shareFallbackDialogReturnFocus = null;
        if (returnFocusEl && typeof returnFocusEl.focus === "function") {
            window.setTimeout(() => {
                try {
                    returnFocusEl.focus({ preventScroll: true });
                } catch (_) {
                    try { returnFocusEl.focus(); } catch (_) { }
                }
            }, 0);
        }
    }

    async function retryShareFallbackDialogCopy() {
        const refs = shareFallbackDialogRefs;
        if (!refs || !refs.overlay?.isConnected) return;
        const url = shareFallbackDialogUrl || String(refs.field.value || "");
        if (!url) return;
        const copied = await copyText(url);
        if (copied) {
            closeShareFallbackDialog();
            flashShareButtonCopiedState();
            notify(t("ui.shareCopied", "Share link copied to clipboard."));
            return;
        }
        refs.field.value = url;
        selectShareFallbackDialogField(true);
        notify(t("ui.shareCopyManualSelect", "Select the link and copy it manually."));
    }

    function ensureShareFallbackDialog() {
        if (shareFallbackDialogRefs?.overlay?.isConnected) return shareFallbackDialogRefs;
        if (!document.body) return null;
        const overlay = document.createElement("div");
        overlay.className = "shareFallbackOverlay";
        overlay.id = "shareFallbackOverlay";
        overlay.hidden = true;
        overlay.innerHTML = `
      <section class="shareFallbackDialog" role="dialog" aria-modal="true" aria-labelledby="shareFallbackTitle" aria-describedby="shareFallbackBody">
        <h3 class="shareFallbackTitle" id="shareFallbackTitle"></h3>
        <p class="shareFallbackBody" id="shareFallbackBody"></p>
        <label class="shareFallbackLabel" for="shareFallbackField"></label>
        <textarea class="shareFallbackField" id="shareFallbackField" rows="3" readonly spellcheck="false" wrap="off"></textarea>
        <div class="shareFallbackActions">
          <button class="ctrlBtn shareFallbackBtn" id="shareFallbackRetryBtn" type="button"></button>
          <button class="ctrlBtn shareFallbackBtn shareFallbackBtnSecondary" id="shareFallbackCloseBtn" type="button"></button>
        </div>
      </section>
    `;
        document.body.appendChild(overlay);
        const refs = {
            overlay,
            dialog: overlay.querySelector(".shareFallbackDialog"),
            title: overlay.querySelector(".shareFallbackTitle"),
            body: overlay.querySelector(".shareFallbackBody"),
            label: overlay.querySelector(".shareFallbackLabel"),
            field: overlay.querySelector(".shareFallbackField"),
            retryBtn: overlay.querySelector("#shareFallbackRetryBtn"),
            closeBtn: overlay.querySelector("#shareFallbackCloseBtn"),
        };
        if (!refs.dialog || !refs.title || !refs.body || !refs.label || !refs.field || !refs.retryBtn || !refs.closeBtn) {
            overlay.remove();
            return null;
        }
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeShareFallbackDialog();
        });
        overlay.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeShareFallbackDialog();
            }
        });
        refs.field.addEventListener("focus", () => selectShareFallbackDialogField(false));
        refs.field.addEventListener("click", () => selectShareFallbackDialogField(false));
        refs.retryBtn.addEventListener("click", () => {
            retryShareFallbackDialogCopy().catch(() => { });
        });
        refs.closeBtn.addEventListener("click", () => closeShareFallbackDialog());
        shareFallbackDialogRefs = refs;
        syncShareFallbackDialogText();
        return refs;
    }

    function openShareFallbackDialog(url) {
        const refs = ensureShareFallbackDialog();
        if (!refs) return false;
        const activeEl = document.activeElement;
        shareFallbackDialogReturnFocus = activeEl && activeEl !== document.body && typeof activeEl.focus === "function"
            ? activeEl
            : document.getElementById("shareStateBtn");
        shareFallbackDialogUrl = String(url || "");
        refs.field.value = shareFallbackDialogUrl;
        syncShareFallbackDialogText();
        refs.overlay.hidden = false;
        refs.overlay.classList.add("is-open");
        window.setTimeout(() => selectShareFallbackDialogField(true), 0);
        return true;
    }

    function setProfileStatusText(slot = getActiveProfileSlot()) {
        const statusEl = document.getElementById("profileStatus");
        if (!statusEl) return null;
        const text = tf("ui.profileLoaded", "Profile {slot} loaded", { slot });
        statusEl.classList.remove("is-temp-shared", "is-temp-shared-warning", "is-temp-shared-confirm", "is-locked");
        statusEl.textContent = text;
        statusEl.setAttribute("title", text);
        statusEl.setAttribute("aria-label", text);
        return statusEl;
    }

    function showProfileStatus(slot = getActiveProfileSlot()) {
        if (isTempSharedModeActive()) return;
        if (isProfileLocked(slot)) return;
        const statusEl = setProfileStatusText(slot);
        if (!statusEl) return;
        clearProfileStatusTimers();
        statusEl.classList.add("is-visible");
        profileStatusHideTimer = window.setTimeout(() => {
            statusEl.classList.remove("is-visible");
            profileStatusClearTimer = window.setTimeout(() => {
                if (statusEl.classList.contains("is-visible")) return;
                statusEl.textContent = "";
                statusEl.removeAttribute("title");
                statusEl.removeAttribute("aria-label");
            }, PROFILE_STATUS_FADE_MS);
        }, PROFILE_STATUS_VISIBLE_MS);
    }

    function refreshProfileControls() {
        const active = getActiveProfileSlot();
        const tempMode = isTempSharedModeActive();
        const lockMap = readProfileLocks();
        const activeLocked = !!lockMap[active];
        const pendingReplaceSlot = tempMode ? normalizeProfileSlot(pendingSharedReplaceSlot || 0, 0) : 0;
        document.querySelectorAll(".profileBtn[data-slot]").forEach((btn) => {
            const slot = normalizeProfileSlot(btn.dataset.slot, 1);
            const hasData = snapshotHasData(readProfileSnapshot(slot));
            const isLocked = !!lockMap[slot];
            const isSaveTarget = tempMode && !hasData && !isLocked;
            const isReplaceTarget = tempMode && !!pendingReplaceSlot && slot === pendingReplaceSlot && hasData && !isLocked;
            let label = tf("ui.profileSlot", "Profile {slot}", { slot });
            if (isSaveTarget) {
                label = tf("ui.profileSlotSaveTarget", "Profile {slot} (empty, click to save shared state)", { slot });
            } else if (isReplaceTarget) {
                label = tf("ui.profileSlotReplaceTarget", "Profile {slot} (click again to replace with shared state)", { slot });
            } else if (isLocked) {
                label = tf("ui.profileSlotLocked", "Profile {slot} (locked)", { slot });
            } else if (!hasData) {
                label = tf("ui.profileSlotEmpty", "Profile {slot} (empty)", { slot });
            }
            btn.classList.toggle("is-active", slot === active);
            btn.classList.toggle("is-empty", !hasData);
            btn.classList.toggle("is-locked", isLocked);
            btn.classList.toggle("is-save-target", isSaveTarget);
            btn.classList.toggle("is-replace-target", isReplaceTarget);
            btn.setAttribute("aria-pressed", slot === active ? "true" : "false");
            btn.setAttribute("title", label);
            btn.setAttribute("aria-label", label);
        });
        syncLockedControlsState(activeLocked);

        const statusEl = document.getElementById("profileStatus");
        if (!statusEl) return;
        if (tempMode) {
            clearProfileStatusTimers();
            const partial = isTempSharedPartialState();
            const hint = pendingReplaceSlot
                ? (partial
                    ? tf("ui.sharedStateTempReplaceConfirmPartial", "Share link may be cut off. Click profile {slot} again to replace it with the recovered critical data only.", { slot: pendingReplaceSlot })
                    : tf("ui.sharedStateTempReplaceConfirm", "Profile {slot} already has saved data. Click it again to replace it with this shared state.", { slot: pendingReplaceSlot }))
                : (partial
                    ? t("ui.sharedStateTempPartialHint", "Share link may be cut off. Loaded recovered critical data only. Click an empty unlocked profile slot to save it, or click an unlocked filled slot twice to replace it.")
                    : t("ui.sharedStateTempHint", "Shared link mode: click an empty unlocked profile slot to save this state, or click an unlocked filled slot twice to replace it."));
            statusEl.classList.add("is-visible", "is-temp-shared");
            statusEl.classList.toggle("is-temp-shared-warning", partial);
            statusEl.classList.toggle("is-temp-shared-confirm", !!pendingReplaceSlot);
            statusEl.classList.remove("is-locked");
            statusEl.textContent = hint;
            statusEl.setAttribute("title", hint);
            statusEl.setAttribute("aria-label", hint);
            return;
        }
        if (activeLocked) {
            clearProfileStatusTimers();
            const text = tf("ui.profileLockedViewing", "Profile {slot} is locked. Click profile {slot} again to unlock and edit.", { slot: active });
            statusEl.classList.add("is-visible", "is-locked");
            statusEl.classList.remove("is-temp-shared", "is-temp-shared-warning", "is-temp-shared-confirm");
            statusEl.textContent = text;
            statusEl.setAttribute("title", text);
            statusEl.setAttribute("aria-label", text);
            return;
        }
        if (statusEl.classList.contains("is-temp-shared")) {
            statusEl.classList.remove("is-temp-shared", "is-temp-shared-warning", "is-temp-shared-confirm", "is-visible");
            statusEl.textContent = "";
            statusEl.removeAttribute("title");
            statusEl.removeAttribute("aria-label");
        }
        if (statusEl.classList.contains("is-locked")) {
            statusEl.classList.remove("is-locked", "is-visible");
            statusEl.textContent = "";
            statusEl.removeAttribute("title");
            statusEl.removeAttribute("aria-label");
        }
        if (statusEl.classList.contains("is-visible")) {
            setProfileStatusText(active);
        }
    }

    function switchToProfile(slotRaw) {
        const target = normalizeProfileSlot(slotRaw, 1);
        const current = getActiveProfileSlot();
        const targetSnapshot = readProfileSnapshot(target);
        const targetHasData = snapshotHasData(targetSnapshot);

        if (isTempSharedModeActive()) {
            if (isProfileLocked(target)) {
                clearPendingSharedReplace({ refresh: false });
                notify(tf("ui.profileLockedNoSave", "Profile {slot} is locked. Unlock it to save changes.", { slot: target }));
                refreshProfileControls();
                return;
            }

            if (!targetHasData) {
                clearPendingSharedReplace({ refresh: false });
                const saved = writeProfileSnapshot(target, captureStateMap());
                if (!saved) {
                    refreshProfileControls();
                    return;
                }
                notify(tf("ui.sharedStateSavedToSlot", "Shared state saved to profile {slot}.", { slot: target }));
                clearTempSharedState();
                setActiveProfileSlot(target);
                refreshProfileControls();
                window.location.reload();
                return;
            }

            if (pendingSharedReplaceSlot === target) {
                clearPendingSharedReplace({ refresh: false });
                const saved = writeProfileSnapshot(target, captureStateMap());
                if (!saved) {
                    refreshProfileControls();
                    return;
                }
                notify(tf("ui.sharedStateSavedToSlot", "Shared state saved to profile {slot}.", { slot: target }));
                clearTempSharedState();
                setActiveProfileSlot(target);
                refreshProfileControls();
                window.location.reload();
                return;
            }

            armPendingSharedReplace(target);
            setActiveProfileSlot(current);
            refreshProfileControls();
            return;
        }

        clearPendingSharedReplace({ refresh: false });
        if (target === current) {
            toggleActiveProfileLock(current);
            return;
        }
        saveCurrentStateToProfile(current);

        if (targetHasData) {
            applyStateMap(targetSnapshot.state);
        } else {
            applyStateMap({});
        }

        setActiveProfileSlot(target);
        refreshProfileControls();
        window.location.reload();
    }

    function parseJsonForShare(raw, fallback) {
        if (raw == null || raw === "") return fallback;
        try {
            return JSON.parse(String(raw));
        } catch (_) {
            return fallback;
        }
    }

    function shareString(value) {
        return value == null ? "" : String(value);
    }

    function trimTrailingEmpty(values) {
        if (!Array.isArray(values)) return [];
        let last = values.length - 1;
        while (last >= 0) {
            const value = values[last];
            const isEmptyArray = Array.isArray(value) && value.length === 0;
            if (value == null || value === "" || isEmptyArray) {
                last -= 1;
                continue;
            }
            break;
        }
        return values.slice(0, last + 1);
    }

    function isPackedValueEmpty(value) {
        if (value == null || value === "") return true;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === "object") return Object.keys(value).length === 0;
        return false;
    }

    function finiteShareNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function normalizeShareViewMode(rawMode) {
        const normalized = shareString(rawMode).trim().toLowerCase();
        if (!normalized) return "";
        if (normalized === "quick") return "quick";
        if (normalized === "advanced") return "advanced";
        if (normalized === "tokenshop" || normalized === "token") return "tokenShop";
        if (normalized === "keys") return "keys";
        if (normalized === "zonecompare" || normalized === "zone") return "zoneCompare";
        return "";
    }

    function encodeDungeonCode(rawKey) {
        const key = shareString(rawKey).trim().toLowerCase();
        return SHARE_DUNGEON_INDEX.has(key) ? SHARE_DUNGEON_INDEX.get(key) : -1;
    }

    function decodeDungeonCode(rawCode) {
        const code = Number(rawCode);
        return Number.isInteger(code) && code >= 0 && code < SHARE_DUNGEON_KEYS.length
            ? SHARE_DUNGEON_KEYS[code]
            : "";
    }

    function encodeTierCode(rawTier) {
        const match = shareString(rawTier).trim().toUpperCase().match(/^T(\d{1,2})$/);
        if (!match) return -1;
        const tier = Number(match[1]);
        return Number.isInteger(tier) && tier >= 0 ? tier : -1;
    }

    function decodeTierCode(rawTier) {
        const tier = Number(rawTier);
        return Number.isInteger(tier) && tier >= 0 ? `T${tier}` : "";
    }

    function encodeContextCode(rawContext) {
        const match = shareString(rawContext).split("::");
        if (match.length !== 2) return -1;
        const dungeonCode = encodeDungeonCode(match[0]);
        const tierCode = encodeTierCode(match[1]);
        if (dungeonCode < 0 || tierCode < 0) return -1;
        return (dungeonCode * SHARE_CONTEXT_TIER_FACTOR) + tierCode;
    }

    function decodeContextCode(rawCode) {
        const code = Number(rawCode);
        if (!Number.isInteger(code) || code < 0) return null;
        const dungeonCode = Math.floor(code / SHARE_CONTEXT_TIER_FACTOR);
        const tierCode = code % SHARE_CONTEXT_TIER_FACTOR;
        const dungeonKey = decodeDungeonCode(dungeonCode);
        const tierKey = decodeTierCode(tierCode);
        if (!dungeonKey || !tierKey) return null;
        return {
            dungeonKey,
            tierKey,
            contextKey: `${dungeonKey}::${tierKey}`,
        };
    }

    function encodePricingModeCode(rawMode) {
        const mode = shareString(rawMode).trim().toLowerCase();
        return SHARE_PRICING_MODE_INDEX.has(mode) ? SHARE_PRICING_MODE_INDEX.get(mode) : -1;
    }

    function decodePricingModeCode(rawCode) {
        const code = Number(rawCode);
        return Number.isInteger(code) && code >= 0 && code < SHARE_PRICING_MODES.length
            ? SHARE_PRICING_MODES[code]
            : "";
    }

    function encodeViewModeCode(rawMode) {
        const mode = normalizeShareViewMode(rawMode);
        return SHARE_VIEW_MODE_INDEX.has(mode) ? SHARE_VIEW_MODE_INDEX.get(mode) : -1;
    }

    function decodeViewModeCode(rawCode) {
        const code = Number(rawCode);
        return Number.isInteger(code) && code >= 0 && code < SHARE_VIEW_MODES.length
            ? SHARE_VIEW_MODES[code]
            : "";
    }

    function encodeHridKey(rawKey) {
        const key = shareString(rawKey).trim();
        const match = key.match(/^\/items\/([^/]+)$/);
        return match ? match[1] : key;
    }

    function decodeHridKey(rawKey) {
        const key = shareString(rawKey).trim();
        if (!key) return "";
        return key.startsWith("/items/") ? key : `/items/${key}`;
    }

    function packManualInputs(raw) {
        const parsed = parseJsonForShare(raw, {});
        const packed = trimTrailingEmpty([
            shareString(parsed?.entryRaw),
            shareString(parsed?.chestRaw),
        ]);
        return packed;
    }

    function unpackManualInputs(value) {
        if (!Array.isArray(value)) return {};
        return {
            entryRaw: shareString(value[0]),
            chestRaw: shareString(value[1]),
        };
    }

    function packRunInputs(raw) {
        const parsed = parseJsonForShare(raw, {});
        const clearTime = shareString(parsed?.clearTime);
        const buff = shareString(parsed?.buff || "20");
        if (!clearTime && buff === "20") return [];
        return trimTrailingEmpty([clearTime, buff !== "20" ? buff : ""]);
    }

    function unpackRunInputs(value) {
        if (!Array.isArray(value)) return {};
        return {
            clearTime: shareString(value[0]),
            buff: value.length > 1 ? shareString(value[1]) : "20",
        };
    }

    function packFlatNumericHridMap(raw) {
        const parsed = parseJsonForShare(raw, {});
        const out = [];
        Object.keys(parsed || {}).sort().forEach((hridKey) => {
            const value = finiteShareNumber(parsed[hridKey]);
            if (value == null || value < 0) return;
            out.push(encodeHridKey(hridKey), value);
        });
        return out;
    }

    function unpackFlatNumericHridMap(entries) {
        const out = {};
        if (!Array.isArray(entries)) return out;
        for (let index = 0; index + 1 < entries.length; index += 2) {
            const hridKey = decodeHridKey(entries[index]);
            const value = finiteShareNumber(entries[index + 1]);
            if (!hridKey || value == null || value < 0) continue;
            out[hridKey] = value;
        }
        return out;
    }

    function packLootOverrideValue(value) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (!value || typeof value !== "object") return null;
        const mode = shareString(value.mode || "").trim().toUpperCase();
        if (mode === "ASK") return "A";
        if (mode === "BID") return "B";
        if (mode === "CUSTOM") {
            const price = finiteShareNumber(value.price);
            return price == null ? "C" : ["C", price];
        }
        return null;
    }

    function packCompactLootOverrideValue(value) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (!value || typeof value !== "object") return null;
        const mode = shareString(value.mode || "").trim().toUpperCase();
        if (mode === "ASK") return SHARE_LOOT_OVERRIDE_ASK;
        if (mode === "BID") return SHARE_LOOT_OVERRIDE_BID;
        if (mode === "CUSTOM") {
            const price = finiteShareNumber(value.price);
            return price == null ? SHARE_LOOT_OVERRIDE_CUSTOM : price;
        }
        return null;
    }

    function unpackLootOverrideValue(value) {
        if (typeof value === "number" && Number.isFinite(value)) return value;
        if (value === "A") return { mode: "Ask" };
        if (value === "B") return { mode: "Bid" };
        if (value === "C") return { mode: "Custom" };
        if (Array.isArray(value) && value[0] === "C") {
            const price = finiteShareNumber(value[1]);
            return price == null ? { mode: "Custom" } : { mode: "Custom", price };
        }
        return null;
    }

    function unpackCompactLootOverrideValue(value) {
        const numeric = finiteShareNumber(value);
        if (numeric != null) {
            if (numeric === SHARE_LOOT_OVERRIDE_ASK) return { mode: "Ask" };
            if (numeric === SHARE_LOOT_OVERRIDE_BID) return { mode: "Bid" };
            if (numeric === SHARE_LOOT_OVERRIDE_CUSTOM) return { mode: "Custom" };
            if (numeric >= 0) return numeric;
            return null;
        }
        return unpackLootOverrideValue(value);
    }

    function packFlatLootOverrideMap(raw) {
        const parsed = parseJsonForShare(raw, {});
        const out = [];
        Object.keys(parsed || {}).sort().forEach((hridKey) => {
            const value = packCompactLootOverrideValue(parsed[hridKey]);
            if (value == null) return;
            out.push(encodeHridKey(hridKey), value);
        });
        return out;
    }

    function unpackFlatLootOverrideMap(entries) {
        const out = {};
        if (!Array.isArray(entries)) return out;
        for (let index = 0; index + 1 < entries.length; index += 2) {
            const hridKey = decodeHridKey(entries[index]);
            const value = unpackCompactLootOverrideValue(entries[index + 1]);
            if (!hridKey || value == null) continue;
            out[hridKey] = value;
        }
        return out;
    }

    function packPanelOpen(raw) {
        const parsed = parseJsonForShare(raw, {});
        if (!parsed || typeof parsed !== "object") return 0;
        let bits = 0;
        if (parsed.pricing === "1" || parsed.pricing === 1 || parsed.pricing === true) bits |= 1;
        if (parsed.run === "1" || parsed.run === 1 || parsed.run === true) bits |= 2;
        return bits;
    }

    function unpackPanelOpen(bits) {
        const mask = Number(bits);
        if (!Number.isInteger(mask) || mask <= 0) return {};
        const out = {};
        if (mask & 1) out.pricing = "1";
        if (mask & 2) out.run = "1";
        return out;
    }

    function hasDensePackedValues(values) {
        return Array.isArray(values) && values.some((value) => {
            if (Array.isArray(value)) return value.length > 0;
            return value != null && value !== "";
        });
    }

    function packDenseDungeonNumbers(raw) {
        const parsed = parseJsonForShare(raw, {});
        const out = SHARE_DUNGEON_KEYS.map((dungeonKey) => {
            const value = finiteShareNumber(parsed?.[dungeonKey]);
            return (value == null || value === 0) ? "" : value;
        });
        return hasDensePackedValues(out) ? trimTrailingEmpty(out) : [];
    }

    function unpackDenseDungeonNumbers(values) {
        const out = {};
        if (!Array.isArray(values)) return out;
        SHARE_DUNGEON_KEYS.forEach((dungeonKey, index) => {
            const value = finiteShareNumber(values[index]);
            if (value == null || value === 0) return;
            out[dungeonKey] = value;
        });
        return out;
    }

    function packDenseLootCounts(raw) {
        const parsed = parseJsonForShare(raw, {});
        const out = SHARE_DUNGEON_KEYS.map((dungeonKey) => {
            const row = parsed?.[dungeonKey];
            if (!row || typeof row !== "object") return "";
            const packedRow = trimTrailingEmpty([
                (() => {
                    const value = finiteShareNumber(row.entry);
                    return (value == null || value === 0) ? "" : value;
                })(),
                (() => {
                    const value = finiteShareNumber(row.chestKey);
                    return (value == null || value === 0) ? "" : value;
                })(),
                (() => {
                    const value = finiteShareNumber(row.chest);
                    return (value == null || value === 0) ? "" : value;
                })(),
                (() => {
                    const value = finiteShareNumber(row.refined);
                    return (value == null || value === 0) ? "" : value;
                })(),
            ]);
            return packedRow.length ? packedRow : "";
        });
        return hasDensePackedValues(out) ? trimTrailingEmpty(out) : [];
    }

    function unpackDenseLootCounts(values) {
        const out = {};
        if (!Array.isArray(values)) return out;
        SHARE_DUNGEON_KEYS.forEach((dungeonKey, index) => {
            const packedRow = values[index];
            if (!Array.isArray(packedRow)) return;
            const row = {};
            const entryValue = finiteShareNumber(packedRow[0]);
            const chestKeyValue = finiteShareNumber(packedRow[1]);
            const chestValue = finiteShareNumber(packedRow[2]);
            const refinedValue = finiteShareNumber(packedRow[3]);
            if (entryValue != null && entryValue !== 0) row.entry = entryValue;
            if (chestKeyValue != null && chestKeyValue !== 0) row.chestKey = chestKeyValue;
            if (chestValue != null && chestValue !== 0) row.chest = chestValue;
            if (refinedValue != null && refinedValue !== 0) row.refined = refinedValue;
            if (Object.keys(row).length) out[dungeonKey] = row;
        });
        return out;
    }

    function packSparseContextEntries(values) {
        if (!Array.isArray(values)) return [];
        let mask = 0;
        const packed = [];
        values.forEach((value, index) => {
            const hasValue = Array.isArray(value) ? value.length > 0 : (value != null && value !== "");
            if (!hasValue) return;
            mask |= (1 << index);
            packed.push(value);
        });
        return mask ? [mask, ...packed] : [];
    }

    function unpackSparseContextEntries(value) {
        if (!Array.isArray(value) || value.length < 2) return null;
        const mask = Number(value[0]);
        if (!Number.isInteger(mask) || mask <= 0) return null;
        return { mask, values: value.slice(1) };
    }

    function packSparseTierMinutes(raw) {
        const parsed = parseJsonForShare(raw, {});
        return packSparseContextEntries(SHARE_CONTEXT_KEYS.map((contextKey) => {
            const [dungeonKey, tierKey] = contextKey.split("::");
            return shareString(parsed?.[dungeonKey]?.[tierKey]);
        }));
    }

    function unpackSparseTierMinutes(value) {
        const packed = unpackSparseContextEntries(value);
        const out = {};
        if (!packed) return out;
        let cursor = 0;
        SHARE_CONTEXT_KEYS.forEach((contextKey, index) => {
            if ((packed.mask & (1 << index)) === 0) return;
            const entry = shareString(packed.values[cursor]);
            cursor += 1;
            if (!entry) return;
            const [dungeonKey, tierKey] = contextKey.split("::");
            if (!out[dungeonKey] || typeof out[dungeonKey] !== "object") out[dungeonKey] = {};
            out[dungeonKey][tierKey] = entry;
        });
        return out;
    }

    function packSparseContextStrings(raw) {
        const parsed = parseJsonForShare(raw, {});
        return packSparseContextEntries(SHARE_CONTEXT_KEYS.map((contextKey) => shareString(parsed?.[contextKey])));
    }

    function unpackSparseContextStrings(value) {
        const packed = unpackSparseContextEntries(value);
        const out = {};
        if (!packed) return out;
        let cursor = 0;
        SHARE_CONTEXT_KEYS.forEach((contextKey, index) => {
            if ((packed.mask & (1 << index)) === 0) return;
            const entry = shareString(packed.values[cursor]);
            cursor += 1;
            if (!entry) return;
            out[contextKey] = entry;
        });
        return out;
    }

    function clearTimeForContextKey(zoneMinutes, contextKey) {
        if (!zoneMinutes || typeof zoneMinutes !== "object") return "";
        const parts = shareString(contextKey).split("::");
        if (parts.length !== 2) return "";
        return shareString(zoneMinutes?.[parts[0]]?.[parts[1]]);
    }

    function packSparseContextRows(raw) {
        const parsed = parseJsonForShare(raw, {});
        let presenceMask = 0;
        let buffMask = 0;
        const buffValues = [];
        SHARE_CONTEXT_KEYS.forEach((contextKey, index) => {
            const row = parsed?.[contextKey];
            if (!row || typeof row !== "object") return;
            const clearTime = shareString(row.clearTime);
            const buff = shareString(row.buff || "20");
            if (!clearTime && buff === "20") return;
            presenceMask |= (1 << index);
            if (buff !== "20") {
                buffMask |= (1 << index);
                buffValues.push(buff);
            }
        });
        if (!presenceMask) return [];
        return trimTrailingEmpty([presenceMask, buffMask || "", ...buffValues]);
    }

    function unpackLegacySparseContextRows(value) {
        const packed = unpackSparseContextEntries(value);
        const out = {};
        if (!packed) return out;
        let cursor = 0;
        SHARE_CONTEXT_KEYS.forEach((contextKey, index) => {
            if ((packed.mask & (1 << index)) === 0) return;
            const row = packed.values[cursor];
            cursor += 1;
            if (!Array.isArray(row) || row.length < 1) return;
            out[contextKey] = {
                clearTime: shareString(row[0]),
                buff: row.length > 1 ? shareString(row[1]) : "20",
            };
        });
        return out;
    }

    function unpackCompactSparseContextRows(value, zoneMinutes) {
        const out = {};
        if (!Array.isArray(value) || !value.length) return out;
        const presenceMask = Number(value[0]);
        if (!Number.isInteger(presenceMask) || presenceMask <= 0) return out;
        const buffMask = (value.length > 1 && !Array.isArray(value[1])) ? (Number(value[1]) || 0) : 0;
        let cursor = (value.length > 1 && !Array.isArray(value[1])) ? 2 : 1;
        SHARE_CONTEXT_KEYS.forEach((contextKey, index) => {
            if ((presenceMask & (1 << index)) === 0) return;
            const clearTime = clearTimeForContextKey(zoneMinutes, contextKey);
            let buff = "20";
            if ((buffMask & (1 << index)) !== 0) {
                buff = shareString(value[cursor]);
                cursor += 1;
            }
            out[contextKey] = { clearTime, buff: buff || "20" };
        });
        return out;
    }

    function unpackSparseContextRows(value, zoneMinutes) {
        if (!Array.isArray(value) || !value.length) return {};
        if (value.length === 1 || !Array.isArray(value[1])) {
            return unpackCompactSparseContextRows(value, zoneMinutes);
        }
        return unpackLegacySparseContextRows(value);
    }

    function buildShareFlags(rawMap) {
        let flags = 0;
        if (rawMap["dungeon.advancedMode"] === "1") flags |= SHARE_FLAG_ADVANCED;
        if (rawMap["dungeon.lootOverrideEnabled"] === "1") flags |= SHARE_FLAG_LOOT_OVERRIDE;
        if (rawMap["dungeon.zoneCompare.removeLowDrops.v3"] === "1") flags |= SHARE_FLAG_LOW_DROP;
        if (rawMap["dungeon.zoneCompare.mirrorBackslot.v1"] === "1") flags |= SHARE_FLAG_MIRROR_BACKSLOT;
        if (rawMap["dungeon.rangeEnabled"] === "1") flags |= SHARE_FLAG_RANGE_ENABLED;
        if (rawMap["dungeon.zoneCompare.keyPlannerImport.v1"] === "1") flags |= SHARE_FLAG_ZONE_KEY_IMPORT;
        return flags;
    }

    function buildPackedSharePayload(rawMap) {
        const map = sanitizeStateMap(rawMap);
        const viewMode = encodeViewModeCode(map["dungeon.viewMode.v1"]);
        const flags = buildShareFlags(map);
        const selectedDungeon = encodeDungeonCode(map["dungeon.selectedDungeon"]);
        const selectedTier = encodeTierCode(map["dungeon.selectedTier"]);
        const pricingMode = encodePricingModeCode(map["dungeon.pricingModel"]);
        const food = shareString(map["dungeon.foodPerDay"]);
        const zoneFood = shareString(map["dungeon.zoneCompare.food.v3"]);
        const resolvedFood = food || zoneFood;
        const zoneBuff = finiteShareNumber(map["dungeon.zoneCompare.buff.v3"]);
        const simCounts = packDenseDungeonNumbers(map["dungeon.simCounts"]);
        const lootCounts = packDenseLootCounts(map["dungeon.lootCounts"]);
        const lootOverrides = packFlatLootOverrideMap(map["dungeon.lootPriceOverrides"]);
        const zoneMinutes = packSparseTierMinutes(map["dungeon.zoneCompare.minutes.v3"]);
        const foodByContext = packSparseContextStrings(map["dungeon.foodPerDayByContext.v1"]);
        const manualInputs = packManualInputs(map["dungeon.manualInputs"]);
        const runInputs = packRunInputs(map["dungeon.runInputs"]);
        const runInputsByContext = packSparseContextRows(map["dungeon.runInputsByContext.v1"]);
        const panelOpen = packPanelOpen(map["dungeon.panelOpen"]);
        return trimTrailingEmpty([
            SHARE_PAYLOAD_VERSION,
            viewMode > 0 ? viewMode : "",
            selectedDungeon >= 0 ? selectedDungeon : "",
            selectedTier >= 0 ? selectedTier : "",
            pricingMode > 0 ? pricingMode : "",
            flags || "",
            resolvedFood && resolvedFood !== SHARE_DEFAULT_FOOD ? resolvedFood : "",
            zoneFood && zoneFood !== resolvedFood ? zoneFood : "",
            zoneBuff != null && zoneBuff !== 20 ? zoneBuff : "",
            !isPackedValueEmpty(simCounts) ? simCounts : "",
            !isPackedValueEmpty(lootCounts) ? lootCounts : "",
            !isPackedValueEmpty(lootOverrides) ? lootOverrides : "",
            !isPackedValueEmpty(zoneMinutes) ? zoneMinutes : "",
            !isPackedValueEmpty(foodByContext) ? foodByContext : "",
            !isPackedValueEmpty(manualInputs) ? manualInputs : "",
            !isPackedValueEmpty(runInputs) ? runInputs : "",
            !isPackedValueEmpty(runInputsByContext) ? runInputsByContext : "",
            panelOpen || "",
        ]);
    }

    function unpackPackedSharePayloadCommon(payload, indexMap) {
        const out = {};
        const viewMode = indexMap.vm != null ? decodeViewModeCode(payload[indexMap.vm]) : "";
        const selectedDungeon = decodeDungeonCode(payload[indexMap.d]);
        const selectedTier = decodeTierCode(payload[indexMap.t]);
        const pricingMode = decodePricingModeCode(payload[indexMap.m]);
        const flags = Number(payload[indexMap.g]) || 0;
        const food = shareString(payload[indexMap.f]);
        const zoneFood = shareString(payload[indexMap.zf]) || food;
        const zoneBuff = finiteShareNumber(payload[indexMap.b]);
        const simCounts = unpackDenseDungeonNumbers(payload[indexMap.c]);
        const lootCounts = unpackDenseLootCounts(payload[indexMap.x]);
        const lootOverrides = unpackFlatLootOverrideMap(payload[indexMap.l]);
        const zoneMinutes = unpackSparseTierMinutes(payload[indexMap.z]);
        const zoneOverrides = indexMap.o != null
            ? unpackFlatNumericHridMap(payload[indexMap.o])
            : {};
        const foodByContext = unpackSparseContextStrings(payload[indexMap.fc]);
        const manualInputs = unpackManualInputs(payload[indexMap.u]);
        const runInputs = unpackRunInputs(payload[indexMap.r]);
        const runInputsByContext = unpackSparseContextRows(payload[indexMap.rc], zoneMinutes);
        const panelOpen = unpackPanelOpen(payload[indexMap.po]);

        if (viewMode && viewMode !== "quick") out["dungeon.viewMode.v1"] = viewMode;
        if (selectedDungeon) out["dungeon.selectedDungeon"] = selectedDungeon;
        if (selectedTier) out["dungeon.selectedTier"] = selectedTier;
        if (pricingMode && pricingMode !== "official") out["dungeon.pricingModel"] = pricingMode;
        if (flags & SHARE_FLAG_ADVANCED) out["dungeon.advancedMode"] = "1";
        if (flags & SHARE_FLAG_LOOT_OVERRIDE) out["dungeon.lootOverrideEnabled"] = "1";
        if (flags & SHARE_FLAG_LOW_DROP) out["dungeon.zoneCompare.removeLowDrops.v3"] = "1";
        if (flags & SHARE_FLAG_ZONE_MANUAL_LOOT) out["dungeon.zoneCompare.manualLoot.v1"] = "1";
        if (flags & SHARE_FLAG_MIRROR_BACKSLOT) out["dungeon.zoneCompare.mirrorBackslot.v1"] = "1";
        if (flags & SHARE_FLAG_RANGE_ENABLED) out["dungeon.rangeEnabled"] = "1";
        if (flags & SHARE_FLAG_ZONE_KEY_IMPORT) out["dungeon.zoneCompare.keyPlannerImport.v1"] = "1";
        if (food) out["dungeon.foodPerDay"] = food;
        if (zoneFood) out["dungeon.zoneCompare.food.v3"] = zoneFood;
        if (zoneBuff != null && zoneBuff !== 20) out["dungeon.zoneCompare.buff.v3"] = String(zoneBuff);
        if (!isPackedValueEmpty(simCounts)) out["dungeon.simCounts"] = JSON.stringify(simCounts);
        if (!isPackedValueEmpty(lootCounts)) out["dungeon.lootCounts"] = JSON.stringify(lootCounts);
        if (!isPackedValueEmpty(lootOverrides)) out["dungeon.lootPriceOverrides"] = JSON.stringify(lootOverrides);
        if (!isPackedValueEmpty(zoneMinutes)) out["dungeon.zoneCompare.minutes.v3"] = JSON.stringify(zoneMinutes);
        if (!isPackedValueEmpty(zoneOverrides)) out["dungeon.zoneCompare.manualOverrides.v1"] = JSON.stringify(zoneOverrides);
        if (!isPackedValueEmpty(foodByContext)) out["dungeon.foodPerDayByContext.v1"] = JSON.stringify(foodByContext);
        if (!isPackedValueEmpty(manualInputs)) out["dungeon.manualInputs"] = JSON.stringify(manualInputs);
        if (!isPackedValueEmpty(runInputs)) out["dungeon.runInputs"] = JSON.stringify(runInputs);
        if (!isPackedValueEmpty(runInputsByContext)) out["dungeon.runInputsByContext.v1"] = JSON.stringify(runInputsByContext);
        if (!isPackedValueEmpty(panelOpen)) out["dungeon.panelOpen"] = JSON.stringify(panelOpen);
        return out;
    }

    function unpackPackedSharePayloadV6(payload) {
        if (!Array.isArray(payload) || Number(payload[SHARE_PAYLOAD_INDEX_V7.v]) !== 6) return null;
        return unpackPackedSharePayloadCommon(payload, SHARE_PAYLOAD_INDEX_V7);
    }

    function unpackPackedSharePayloadV7(payload) {
        if (!Array.isArray(payload) || Number(payload[SHARE_PAYLOAD_INDEX_V7.v]) !== 7) return null;
        return unpackPackedSharePayloadCommon(payload, SHARE_PAYLOAD_INDEX_V7);
    }

    function unpackPackedSharePayloadV8(payload) {
        if (!Array.isArray(payload) || Number(payload[SHARE_PAYLOAD_INDEX_V8.v]) !== 8) return null;
        return unpackPackedSharePayloadCommon(payload, SHARE_PAYLOAD_INDEX_V8);
    }

    function unpackPackedSharePayloadV9(payload) {
        if (!Array.isArray(payload) || Number(payload[SHARE_PAYLOAD_INDEX_V9.v]) !== 9) return null;
        return unpackPackedSharePayloadCommon(payload, SHARE_PAYLOAD_INDEX_V9);
    }

    function unpackPackedSharePayload(payload) {
        return unpackPackedSharePayloadV9(payload) || unpackPackedSharePayloadV8(payload) || unpackPackedSharePayloadV7(payload) || unpackPackedSharePayloadV6(payload);
    }

    function encodeHashSharePayload(payload) {
        try {
            return LZStringHashCodec.compressToEncodedURIComponent(JSON.stringify(payload || {}));
        } catch (_) {
            return "";
        }
    }

    function decodeHashSharePayload(raw) {
        try {
            const text = LZStringHashCodec.decompressFromEncodedURIComponent(raw);
            if (!text) return null;
            return JSON.parse(text);
        } catch (_) {
            return null;
        }
    }

    function buildCriticalSharePayload(rawMap) {
        const map = sanitizeStateMap(rawMap);
        const zoneMinutes = packSparseTierMinutes(map["dungeon.zoneCompare.minutes.v3"]);
        return trimTrailingEmpty([
            SHARE_CRITICAL_VERSION,
            !isPackedValueEmpty(zoneMinutes) ? zoneMinutes : "",
        ]);
    }

    function unpackCriticalSharePayload(payload) {
        if (!Array.isArray(payload)) return null;
        const version = Number(payload[0]);
        if (version === 1) {
            const out = {};
            const declaredSecondaryLength = Math.max(0, Number(payload[1]) || 0);
            const zoneMinutes = unpackSparseTierMinutes(payload[2]);
            if (!isPackedValueEmpty(zoneMinutes)) out["dungeon.zoneCompare.minutes.v3"] = JSON.stringify(zoneMinutes);
            return {
                secondaryLength: declaredSecondaryLength,
                state: out,
            };
        }
        if (version === 2) {
            const out = {};
            const zoneMinutes = unpackSparseTierMinutes(payload[1]);
            if (!isPackedValueEmpty(zoneMinutes)) out["dungeon.zoneCompare.minutes.v3"] = JSON.stringify(zoneMinutes);
            return {
                secondaryLength: null,
                state: out,
            };
        }
        return null;
    }

    function stripCriticalStateForSecondary(rawMap) {
        const map = sanitizeStateMap(rawMap);
        delete map["dungeon.zoneCompare.minutes.v3"];
        return map;
    }

    function isSharePayloadEffectivelyEmpty(payload) {
        return !Array.isArray(payload) || payload.length <= 1;
    }

    function buildSegmentedShareHash(rawMap) {
        const secondaryMap = stripCriticalStateForSecondary(rawMap);
        const secondaryPayload = buildPackedSharePayload(secondaryMap);
        const encodedSecondary = isSharePayloadEffectivelyEmpty(secondaryPayload)
            ? ""
            : encodeHashSharePayload(secondaryPayload);
        const criticalPayload = buildCriticalSharePayload(rawMap);
        const encodedCritical = isSharePayloadEffectivelyEmpty(criticalPayload)
            ? ""
            : encodeHashSharePayload(criticalPayload);
        if (encodedCritical && encodedSecondary) {
            return `${encodedCritical}${SHARE_SEGMENT_DELIMITER}${encodedSecondary}`;
        }
        return encodedCritical || encodedSecondary || "";
    }

    function decodeSegmentedShareCandidate(raw) {
        const text = String(raw || "");
        const separatorIndex = text.indexOf(SHARE_SEGMENT_DELIMITER);
        if (separatorIndex <= 0) return null;
        const criticalRaw = text.slice(0, separatorIndex);
        const secondaryRaw = text.slice(separatorIndex + 1);
        const criticalPayload = decodeHashSharePayload(criticalRaw);
        const critical = unpackCriticalSharePayload(criticalPayload);
        if (!critical || !critical.state || typeof critical.state !== "object") return null;
        const merged = sanitizeStateMap(critical.state);
        if (Number.isInteger(critical.secondaryLength) && secondaryRaw.length !== critical.secondaryLength) {
            return { state: merged, partial: true };
        }
        if (!secondaryRaw.length) {
            return { state: merged, partial: !Number.isInteger(critical.secondaryLength) || critical.secondaryLength > 0 };
        }
        const secondaryPayload = decodeHashSharePayload(secondaryRaw);
        if (!secondaryPayload) return { state: merged, partial: true };
        const secondaryState = unpackPackedSharePayload(secondaryPayload);
        if (!secondaryState || typeof secondaryState !== "object") return { state: merged, partial: true };
        return {
            state: sanitizeStateMap({ ...sanitizeStateMap(secondaryState), ...merged }),
            partial: false,
        };
    }

    function decodeStandaloneShareCandidate(raw) {
        const payload = decodeHashSharePayload(raw);
        if (!payload) return null;
        const fullState = unpackPackedSharePayload(payload);
        if (fullState && typeof fullState === "object") {
            return {
                state: sanitizeStateMap(fullState),
                partial: false,
            };
        }
        const critical = unpackCriticalSharePayload(payload);
        if (!critical || !critical.state || typeof critical.state !== "object") return null;
        return {
            state: sanitizeStateMap(critical.state),
            partial: false,
        };
    }

    function buildShareUrl() {
        const encoded = buildSegmentedShareHash(captureStateMap());
        if (!encoded) return "";
        const url = new URL(window.location.href);
        url.hash = encoded;
        return url.toString();
    }

    async function shareCurrentState() {
        if (!isTempSharedModeActive()) saveCurrentStateToProfile();
        const url = buildShareUrl();
        if (!url) return;
        const copied = await copyText(url);
        if (copied) {
            flashShareButtonCopiedState();
            notify(t("ui.shareCopied", "Share link copied to clipboard."));
            return;
        }
        clearShareButtonFeedbackTimer();
        setShareButtonFeedbackState(false);
        if (openShareFallbackDialog(url)) {
            notify(t("ui.shareCopyFailed", "Couldn't copy automatically. Use the share panel to copy the link."));
            return;
        }
        notify(t("ui.shareCopyFailedPrompt", "Couldn't copy automatically. The link is shown in a browser prompt."));
        try { window.prompt(t("ui.shareState", "Share state"), url); } catch (_) { }
    }

    function decodeShareCandidate(raw) {
        const segmentedState = decodeSegmentedShareCandidate(raw);
        if (segmentedState && typeof segmentedState.state === "object") return segmentedState;
        const standaloneState = decodeStandaloneShareCandidate(raw);
        return (standaloneState && typeof standaloneState.state === "object") ? standaloneState : null;
    }

    function clearShareStateUrlParts(url, appliedHashRaw = "") {
        const rawHash = String(url.hash || "").replace(/^#/, "");
        if (appliedHashRaw && rawHash === appliedHashRaw) {
            url.hash = "";
            const q = url.searchParams.toString();
            return `${url.pathname}${q ? `?${q}` : ""}`;
        }
        const q = url.searchParams.toString();
        const h = String(url.hash || "");
        return `${url.pathname}${q ? `?${q}` : ""}${h || ""}`;
    }

    function applySharedStateFromUrl() {
        try {
            const url = new URL(window.location.href);
            const rawHash = String(url.hash || "").replace(/^#/, "");
            if (!rawHash) return { applied: false, partial: false };
            const decoded = decodeShareCandidate(rawHash);
            if (!decoded || typeof decoded.state !== "object") return { applied: false, partial: false };
            const state = sanitizeStateMap(decoded.state);
            applyStateMap(state);
            setTempSharedState(state, { partial: !!decoded.partial });
            window.history.replaceState({}, "", clearShareStateUrlParts(url, rawHash));
            return { applied: true, partial: !!decoded.partial };
        } catch (_) {
            return { applied: false, partial: false };
        }
    }

    function notify(msg) {
        try {
            if (typeof window.showToast === "function") {
                window.showToast(msg);
            }
        } catch (_) { }
    }

    async function copyText(text) {
        const value = String(text || "");
        if (!value) return false;
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                await navigator.clipboard.writeText(value);
                return true;
            }
        } catch (_) { }

        try {
            const ta = document.createElement("textarea");
            ta.value = value;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand("copy");
            ta.remove();
            return !!ok;
        } catch (_) {
            return false;
        }
    }

    function guessLang() {
        const l = (navigator.language || "").toLowerCase();
        if (l.startsWith("zh")) {
            if (l.includes("hant") || l.includes("tw") || l.includes("hk") || l.includes("mo")) return "zh-Hant";
            return "zh-Hans";
        }
        return "en";
    }

    function getLang() {
        const saved = storageGetItem(LS_LANG);
        if (saved && LANG_ORDER.includes(saved)) return saved;
        return guessLang();
    }

    function setLang(lang) {
        storageSetItem(LS_LANG, lang);
        applyLang(lang);
        updateLangButton();
        updateControlI18nText();
        refreshProfileControls();
    }

    function t(key, fallback = "") {
        return resolveI18nValue(key, fallback, getLang());
    }

    function tf(key, fallback = "", vars = {}) {
        let str = t(key, fallback);
        Object.entries(vars || {}).forEach(([name, value]) => {
            const re = new RegExp(`\\{${String(name)}\\}`, "g");
            str = str.replace(re, String(value ?? ""));
        });
        return str;
    }

    function updateControlI18nText() {
        const shareBtn = document.getElementById("shareStateBtn");
        if (shareBtn) {
            setShareButtonFeedbackState(shareBtn.classList.contains("is-copied"));
        }
        syncShareFallbackDialogText();
    }

    // Expose translator so your other scripts can use it later:
    window.SiteI18n = {
        t,
        tf,
        getLang,
        setLang,
        applyLang: () => applyLang(getLang()),
        getWhitelist: () => Array.from(whitelistTerms),
        reloadWhitelist: async () => {
            await loadWhitelist();
            applyLang(getLang());
        },
        shareState: () => shareCurrentState(),
        getActiveProfile: () => getActiveProfileSlot(),
        switchProfile: (slot) => switchToProfile(slot),
        toggleProfileLock: () => toggleActiveProfileLock(),
        isProfileLocked: (slot) => isProfileLocked(slot),
    };

    function bindKnownElements() {
        // If you use data-i18n in HTML, this will automatically work.
        // This function ALSO “binds” common elements by selectors so you don’t have to tag everything.

        // Dungeon card titles by data-dungeon
        document.querySelectorAll('.card[data-dungeon]').forEach((card) => {
            const k = card.getAttribute("data-dungeon");
            const h2 = card.querySelector("h2");
            if (h2 && !h2.dataset.i18n) h2.dataset.i18n = `d.${k}`;
        });

        // Buttons by IDs (works in your newer layout too)
        const sim = document.getElementById("simulateBtn");
        if (sim && !sim.dataset.i18n) sim.dataset.i18n = "ui.simulate";

        const reset = document.getElementById("resetBtn");
        if (reset && !reset.dataset.i18n) reset.dataset.i18n = "ui.reset";

        // Refined chest tooltip (if you already use data-tip, you can swap to data-i18n-tip)
        const refined = document.getElementById("lootRefinedBox");
        if (refined && refined.dataset.tip && refined.dataset.tip.includes("33%")) {
            refined.dataset.i18nTip = "ui.drop33";
        }
    }

    function setTextBySelector(selector, str) {
        document.querySelectorAll(selector).forEach((el) => { el.textContent = str; });
    }

    function setAttrBySelector(selector, attr, str) {
        document.querySelectorAll(selector).forEach((el) => { el.setAttribute(attr, str); });
    }

    function setTipBySelector(selector, str) {
        document.querySelectorAll(selector).forEach((el) => { el.dataset.tip = str; });
    }

    function setLabelPrefix(selector, textWithSuffix) {
        const label = document.querySelector(selector);
        if (!label) return;
        const first = label.firstChild;
        if (first && first.nodeType === Node.TEXT_NODE) {
            first.nodeValue = textWithSuffix;
        } else {
            label.insertBefore(document.createTextNode(textWithSuffix), label.firstChild || null);
        }
    }

    function setSimLineLabels(lang) {
        const value = resolveI18nValue("ui.calculationsLabel", "Calculations:", lang);
        document.querySelectorAll(".simLine").forEach((line) => {
            const wrap = line.querySelector(".simCountWrap");
            if (!wrap) {
                line.textContent = value;
                return;
            }
            let label = line.querySelector(".simLabel");
            if (!label) {
                label = document.createElement("span");
                label.className = "simLabel";
            }
            label.textContent = value;

            // Normalize structure on every pass so existing static text nodes
            // do not stack with translated labels across re-renders.
            line.textContent = "";
            line.appendChild(label);
            line.appendChild(document.createTextNode(" "));
            line.appendChild(wrap);
        });
    }

    function applyHardcodedPageTranslations(lang) {
        const tt = (key, fallback = "") => resolveI18nValue(key, fallback, lang);
        setSimLineLabels(lang);

        setTextBySelector('.subtitleRow label[for="advMode"] .modeTglText', tt("ui.advanced", "Advanced"));
        setTextBySelector('.subtitleRow label[for="tokenShopToggle"] .modeTglText', tt("ui.tokenShop", "Token Shop"));
        setTextBySelector('.subtitleRow label[for="keysToggle"] .modeTglText', tt("ui.keys", "Keys"));
        setTextBySelector('.subtitleRow label[for="zoneCompareToggle"] .modeTglText', tt("ui.zoneCompare", "Zone Compare"));
        setTextBySelector("#quickStartHint", tt("ui.quickStartHintDefault", "Pick a dungeon for quick start"));
        setTextBySelector("#tierHint", tt("ui.tierHintDefault", "Choose a tier to unlock options."));

        setTextBySelector("#simpleInputsCard .simpleTitle", tt("ui.quickCalculator", "Quick Calculator"));
        setTextBySelector("#simpleOfficialRefreshBtn", tt("ui.refreshPrices", "Refresh prices"));
        setTipBySelector("#simpleOfficialRefreshBtn", tt("ui.refreshOfficialApiPrices", "Refresh current API prices"));
        setLabelPrefix('label[for="simpleBuffCustom"]', `${tt("ui.combatBuff", "Combat buff")}: `);
        setTipBySelector('[data-tip="Current Combat Drop Quantity (Found in Game)"]', tt("ui.combatBuffHelp", "Current Combat Drop Quantity (Found in Game)"));
        setTextBySelector("#simpleBuffErr", tt("ui.enterNumber0to20", "Enter a number from 0 to 20."));
        setTextBySelector('label[for="foodPerDay"]', tt("ui.consumablesPerDay", "Consumables Per Day"));
        setTipBySelector('[data-tip="Default 10m per day"]', tt("ui.consumablesHelp", "Default 10m per day"));
        setLabelPrefix('label[for="simpleClearTime"]', `${tt("ui.clearTimeMinutes", "Clear time (minutes)")} `);
        setAttrBySelector("#simpleClearTime", "placeholder", tt("ui.clearTimePlaceholder", "e.g. 22"));
        setTextBySelector("#simpleClearTimeErr", tt("ui.enterValidMinutes", "Enter a valid number of minutes."));
        setTextBySelector("#simpleSimulateBtn span", tt("ui.calculate", "Calculate"));

        setTextBySelector("#simpleResultsCard .simpleTitle", tt("ui.results", "Results"));
        setTextBySelector('label[for="toggleRange"] .modeTglText', tt("ui.showRange", "Show Low–High range"));
        setTipBySelector('label[for="toggleRange"]', tt("ui.showRange", "Show Low–High range"));
        setTextBySelector('#simpleResultsCard .simpleStatsGrid .simpleStat:nth-child(1) .muted.small', tt("ui.runsPerDay", "Runs / day"));
        setTextBySelector('#simpleResultsCard .simpleStatsGrid .simpleStat:nth-child(2) .muted.small', tt("ui.entryKeys", "Entry keys"));
        setTextBySelector('#simpleResultsCard .simpleStatsGrid .simpleStat:nth-child(3) .muted.small', tt("ui.chestKeys", "Chest keys"));
        setTextBySelector('#simpleResultsCard .simpleStatsGrid .simpleStat:nth-child(4) .muted.small', tt("ui.profit", "Profit"));

        setTextBySelector(".optionsTitle > h3", tt("ui.simOverview", "Calculator Overview"));
        setTextBySelector("#selectionSummary", tt("ui.selectDungeonTier", "Select a dungeon and tier."));
        setTextBySelector('.lootBox[data-loot="entry"] .lootName', tt("ui.entryKey", "Entry Key"));
        setTextBySelector('.lootBox[data-loot="chestKey"] .lootName', tt("ui.chestKey", "Chest Key"));
        setTextBySelector('.lootBox[data-loot="chest"] .lootName', tt("ui.chest", "Chest"));
        setTextBySelector('.lootBox[data-loot="refined"] .lootName', tt("ui.refinedChest", "Refined Chest"));

        document.querySelectorAll('.lootBox[data-loot="entry"] .lootSub').forEach((el, i) => {
            if (i === 0) el.childNodes[0].nodeValue = `${tt("ui.each", "Each")}: `;
            if (i === 1) el.childNodes[0].nodeValue = `${tt("ui.total", "Total")}: `;
        });
        document.querySelectorAll('.lootBox[data-loot="chestKey"] .lootSub').forEach((el, i) => {
            if (i === 0) el.childNodes[0].nodeValue = `${tt("ui.each", "Each")}: `;
            if (i === 1) el.childNodes[0].nodeValue = `${tt("ui.total", "Total")}: `;
        });
        document.querySelectorAll('.lootBox[data-loot="chest"] .lootSub').forEach((el, i) => {
            if (i === 0) el.childNodes[0].nodeValue = `${tt("ui.evPerChest", "EV/chest")}: `;
            if (i === 1) el.childNodes[0].nodeValue = `${tt("ui.tokenValue", "Token value")}: `;
        });
        document.querySelectorAll('.lootBox[data-loot="refined"] .lootSub').forEach((el) => {
            el.childNodes[0].nodeValue = `${tt("ui.evPerChest", "EV/chest")}: `;
        });

        setTextBySelector("#resetBtn", tt("ui.reset", "Reset"));
        setTipBySelector("#resetBtn", tt("ui.resetSelection", "Reset selection"));
        setTextBySelector(".statusLine:nth-child(1) .label", tt("ui.dungeon", "Dungeon"));
        setTextBySelector(".statusLine:nth-child(2) .label", tt("ui.tier", "Tier"));
        setTextBySelector(".statusLine:nth-child(3) .label", tt("ui.pricing", "Pricing"));
        setTextBySelector(".statusLine:nth-child(4) .label", tt("ui.clear", "Clear"));
        setTextBySelector(".statusLine:nth-child(5) .label", tt("ui.buff", "Buff"));

        setTextBySelector('[data-panel="pricing"] h4', tt("ui.pricingModel", "Key price override"));
        setTextBySelector('[data-choice="manual"] .choiceName', tt("ui.manualInput", "Manual input"));
        setTextBySelector('[data-choice="manual"] .choiceTag', tt("ui.override", "Override"));
        setTextBySelector('[data-choice="manual"] .choiceDesc', tt("ui.acceptsFormats", "Accepts: 600,000 • 600000 • 600k • 6m"));
        setTextBySelector('label[for="manualEntry"]', tt("ui.entryKeyPrice", "Entry Key Price"));
        setTextBySelector('label[for="manualChest"]', tt("ui.chestKeyPrice", "Chest Key Price"));
        setAttrBySelector("#manualEntry", "placeholder", tt("ui.entryPricePlaceholder", "e.g. 600k"));
        setAttrBySelector("#manualChest", "placeholder", tt("ui.chestPricePlaceholder", "e.g. 6m"));
        setTextBySelector("#manualEntryErr", tt("ui.enterValueLike", "Enter a value like 600k or 6m."));
        setTextBySelector("#manualChestErr", tt("ui.enterValueLike", "Enter a value like 600k or 6m."));
        setTextBySelector('[data-choice="keyplanner"] .choiceName', tt("ui.keysTabImport", "Keys tab import"));
        setAttrBySelector("#keyPlannerOpenBtn", "aria-label", tt("ui.openKeysTab", "Open Keys tab"));
        setAttrBySelector("#keyPlannerOpenBtn", "title", tt("ui.openKeysTab", "Open Keys tab"));
        setTextBySelector('[data-choice="keyplanner"] .choiceDesc', tt("ui.keysImportDesc", "Uses your Keys tab crafting settings for per-dungeon entry and chest key costs."));
        setTextBySelector("#keyPlannerPreview", tt("ui.keysImportPreviewEmpty", "Uses Keys tab settings."));
        setAttrBySelector("#keyPlannerDetails", "aria-label", tt("ui.keysImportTooltipTitle", "Keys planner import"));
        setTextBySelector('[data-choice="api"] .choiceName', tt("ui.currentApiPrices", "Current API prices"));
        setTextBySelector('[data-choice="api"] .choiceTag', tt("ui.activeApi", "Active API"));
        setTextBySelector('[data-choice="api"] .choiceDesc', tt("ui.usesSelectedApiKeyPrices", "Uses instant-buy key prices from the API selected in the footer."));
        setTextBySelector("#officialRefreshBtn", tt("ui.refreshPrices", "Refresh prices"));

        setTextBySelector('[data-panel="run"] h4', tt("ui.playerInfo", "Player Information"));
        setTextBySelector("#runPill", tt("ui.needed", "Needed"));
        setLabelPrefix('label[for="playerBuff"]', `${tt("ui.combatBuff", "Combat buff")}: `);
        setTextBySelector("#playerBuffErr", tt("ui.enterNumber0to20", "Enter a number from 0 to 20."));
        setTextBySelector('label[for="advFoodPerDay"]', tt("ui.consumablesPerDay", "Consumables Per Day"));
        setLabelPrefix('label[for="clearTime"]', `${tt("ui.clearTimeMinutes", "Clear time (minutes)")} `);
        setAttrBySelector("#clearTime", "placeholder", tt("ui.clearTimePlaceholder", "e.g. 22"));
        setTextBySelector("#clearTimeErr", tt("ui.enterValidMinutes", "Enter a valid number of minutes."));

        setTextBySelector("#lootOverrideSection .row.spread .muted.small:first-child", tt("ui.manualLootPrices", "Manual loot prices"));
        setTextBySelector("#lootOverrideSection .row.spread .muted.small:nth-child(2)", tt("ui.overrideDropValues", "Override specific drop values used for EV calculations."));
        setTextBySelector('label[for="lootOverrideFilter"]', tt("ui.filterItems", "Filter items"));
        setAttrBySelector("#lootOverrideFilter", "placeholder", tt("ui.typeToSearch", "Type to search..."));
        setTextBySelector("#lootOverrideResetBtn", tt("ui.resetLootPrices", "Reset Loot Prices"));
        setTipBySelector("#lootOverrideResetBtn", tt("ui.officialApiPrices", "Current API Prices"));
        setTextBySelector("#simulateBtn span", tt("ui.calculate", "Calculate"));

        setTextBySelector("#advResultsCard .simpleTitle", tt("ui.results", "Results"));
        setTextBySelector('label[for="advToggleRange"] .modeTglText', tt("ui.showRange", "Show Low–High range"));
        setTipBySelector('label[for="advToggleRange"]', tt("ui.showRange", "Show Low–High range"));
        setTextBySelector('#advResultsCard .simpleStatsGrid .simpleStat:nth-child(1) .muted.small', tt("ui.runsPerDay", "Runs / day"));
        setTextBySelector('#advResultsCard .simpleStatsGrid .simpleStat:nth-child(2) .muted.small', tt("ui.entryKeys", "Entry keys"));
        setTextBySelector('#advResultsCard .simpleStatsGrid .simpleStat:nth-child(3) .muted.small', tt("ui.chestKeys", "Chest keys"));
        setTextBySelector('#advResultsCard .simpleStatsGrid .simpleStat:nth-child(4) .muted.small', tt("ui.profit", "Profit"));
    }

    function applyLang(lang) {
        // html lang attribute (use zh for both variants)
        document.documentElement.lang = (lang === "en") ? "en" : "zh";
        document.documentElement.dataset.lang = lang;

        bindKnownElements();

        // Text content
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.dataset.i18n;
            const str = resolveI18nValue(key, "", lang);
            if (typeof str === "string") el.textContent = str;
        });

        // Placeholders
        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            const key = el.dataset.i18nPlaceholder;
            const str = resolveI18nValue(key, "", lang);
            if (typeof str === "string") el.setAttribute("placeholder", str);
        });

        // Tooltips (your refined chest uses dataset.tip)
        document.querySelectorAll("[data-i18n-tip]").forEach((el) => {
            const key = el.dataset.i18nTip;
            const str = resolveI18nValue(key, "", lang);
            if (typeof str === "string") el.dataset.tip = str;
        });

        // ARIA labels
        document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
            const key = el.dataset.i18nAriaLabel;
            const str = resolveI18nValue(key, "", lang);
            if (typeof str === "string") el.setAttribute("aria-label", str);
        });

        // Title attributes
        document.querySelectorAll("[data-i18n-title]").forEach((el) => {
            const key = el.dataset.i18nTitle;
            const str = resolveI18nValue(key, "", lang);
            if (typeof str === "string") el.setAttribute("title", str);
        });

        applyHardcodedPageTranslations(lang);
        updateControlI18nText();
        refreshProfileControls();

        try {
            document.dispatchEvent(new CustomEvent("site:lang-changed", { detail: { lang } }));
        } catch (_) { }
    }

    function getThemeOverride() {
        const v = storageGetItem(LS_THEME);
        return (v === "light" || v === "dark") ? v : "";
    }

    function prefersDarkScheme() {
        return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    function isDiscoModeEnabled() {
        return storageGetItem(LS_THEME_DISCO) === "1";
    }

    function setDiscoModeEnabled(enabled) {
        if (enabled) storageSetItem(LS_THEME_DISCO, "1");
        else storageRemoveItem(LS_THEME_DISCO);
    }

    function effectiveTheme() {
        if (isDiscoModeEnabled()) return "dark";
        const override = getThemeOverride(); // "light" | "dark" | "" (system)
        if (override) return override;
        return prefersDarkScheme() ? "dark" : "light";
    }

    function updateThemeMeta(theme) {
        const resolved = theme === "light" ? "light" : "dark";
        document.documentElement.style.colorScheme = resolved;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            const content = isDiscoModeEnabled()
                ? (resolved === "light" ? "#ffd43b" : "#ff4fd8")
                : (resolved === "light" ? "#f6f7fb" : "#18181b");
            meta.setAttribute("content", content);
        }
    }

    let themeTransitionTimer = null;
    let themeToggleHistory = [];

    function syncDiscoThemeUi() {
        const enabled = isDiscoModeEnabled();
        document.documentElement.classList.toggle("disco-mode", enabled);
        const themeBtn = document.getElementById("themeBtn");
        if (themeBtn) themeBtn.classList.toggle("is-disco", enabled);
        return enabled;
    }

    function registerRapidThemeToggle() {
        if (isDiscoModeEnabled()) {
            themeToggleHistory = [];
            setDiscoModeEnabled(false);
            return "disabled";
        }
        const now = Date.now();
        themeToggleHistory = themeToggleHistory.filter((stamp) => (now - stamp) <= DISCO_TOGGLE_WINDOW_MS);
        themeToggleHistory.push(now);
        if (themeToggleHistory.length < DISCO_TOGGLE_COUNT) return "";
        themeToggleHistory = [];
        const enabled = !isDiscoModeEnabled();
        setDiscoModeEnabled(enabled);
        return enabled ? "enabled" : "disabled";
    }

    function applyTheme(opts = {}) {
        const animate = !!opts.animate;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (animate && !reduceMotion) {
            document.documentElement.classList.add("theme-transitioning");
            if (themeTransitionTimer) clearTimeout(themeTransitionTimer);
            themeTransitionTimer = setTimeout(() => {
                document.documentElement.classList.remove("theme-transitioning");
            }, 280);
        }

        // Always set a concrete theme so CSS matches what the UI thinks
        const theme = effectiveTheme();
        document.documentElement.dataset.theme = theme;
        syncDiscoThemeUi();
        updateThemeMeta(theme);
        updateThemeButton();
    }


    function toggleTheme() {
        const currentTheme = effectiveTheme();
        const discoState = registerRapidThemeToggle();
        const next = discoState === "enabled"
            ? "dark"
            : ((currentTheme === "dark") ? "light" : "dark");
        storageSetItem(LS_THEME, next);
        applyTheme({ animate: true });
        if (discoState === "enabled") {
            notify(t("ui.discoModeOn", "Disco mode unlocked. Toggle the theme a bunch again to escape."));
        } else if (discoState === "disabled") {
            notify(t("ui.discoModeOff", "Disco mode disabled. Sanity restored."));
        }
    }

    let controlsReserveObserver = null;
    let controlsReserveRootObserver = null;
    let controlsReserveRaf = 0;
    let controlsVisibilityRaf = 0;
    let controlsHidden = false;
    const CONTROLS_HIDE_SCROLL_Y = 120;
    const CONTROLS_SHOW_SCROLL_Y = 64;

    function applySiteControlsReserve() {
        const root = document.documentElement;
        const controls = document.getElementById("siteControls");
        const launcher = document.getElementById("tutorialLauncherRow");
        if ((!controls && !launcher) || root.classList.contains("mobile-compat")) {
            root.style.removeProperty("--site-controls-reserve-top");
            return;
        }
        let maxBottom = 0;
        if (controls && !controls.hidden) {
            const rect = controls.getBoundingClientRect();
            if (rect.width > 1 && rect.height > 1) maxBottom = Math.max(maxBottom, rect.bottom);
        }
        if (launcher && !launcher.hidden) {
            const rect = launcher.getBoundingClientRect();
            if (rect.width > 1 && rect.height > 1) maxBottom = Math.max(maxBottom, rect.bottom);
        }
        const reserveTop = Math.max(22, Math.ceil(maxBottom + 10));
        root.style.setProperty("--site-controls-reserve-top", `${reserveTop}px`);
    }

    function scheduleSiteControlsReserve() {
        if (controlsReserveRaf) window.cancelAnimationFrame(controlsReserveRaf);
        controlsReserveRaf = window.requestAnimationFrame(() => {
            controlsReserveRaf = 0;
            applySiteControlsReserve();
        });
    }

    function applySiteControlsVisibility() {
        const root = document.documentElement;
        const controls = document.getElementById("siteControls");
        if (!controls) {
            controlsHidden = false;
            root.classList.remove("site-controls-hidden");
            return;
        }
        const y = Math.max(0, Math.floor(window.scrollY || window.pageYOffset || 0));
        if (!controlsHidden && y >= CONTROLS_HIDE_SCROLL_Y) {
            controlsHidden = true;
            root.classList.add("site-controls-hidden");
            return;
        }
        if (controlsHidden && y <= CONTROLS_SHOW_SCROLL_Y) {
            controlsHidden = false;
            root.classList.remove("site-controls-hidden");
        }
    }

    function scheduleSiteControlsVisibility() {
        if (controlsVisibilityRaf) window.cancelAnimationFrame(controlsVisibilityRaf);
        controlsVisibilityRaf = window.requestAnimationFrame(() => {
            controlsVisibilityRaf = 0;
            applySiteControlsVisibility();
        });
    }

    function bindSiteControlsReserve(controlsEl) {
        if (!controlsEl) return;
        window.addEventListener("resize", scheduleSiteControlsReserve, { passive: true });
        window.addEventListener("resize", scheduleSiteControlsVisibility, { passive: true });
        window.addEventListener("scroll", scheduleSiteControlsVisibility, { passive: true });
        document.addEventListener("tutorial:launcher-layout-changed", scheduleSiteControlsReserve);
        if (typeof ResizeObserver === "function") {
            if (!controlsReserveObserver) controlsReserveObserver = new ResizeObserver(() => scheduleSiteControlsReserve());
            controlsReserveObserver.observe(controlsEl);
        }
        if (typeof MutationObserver === "function" && !controlsReserveRootObserver) {
            controlsReserveRootObserver = new MutationObserver(() => {
                scheduleSiteControlsReserve();
                scheduleSiteControlsVisibility();
            });
            controlsReserveRootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        }
        if (document.fonts?.ready) document.fonts.ready.then(scheduleSiteControlsReserve).catch(() => {});
        window.setTimeout(scheduleSiteControlsReserve, 120);
        window.setTimeout(scheduleSiteControlsReserve, 420);
        window.setTimeout(scheduleSiteControlsVisibility, 120);
        window.setTimeout(scheduleSiteControlsVisibility, 420);
        scheduleSiteControlsReserve();
        scheduleSiteControlsVisibility();
    }


    function injectControls() {
        if (document.getElementById("siteControls")) return;

        const wrap = document.createElement("div");
        wrap.className = "siteControls";
        wrap.id = "siteControls";

        const profileWrap = document.createElement("div");
        profileWrap.className = "profileWrap";
        const profileMain = document.createElement("div");
        profileMain.className = "profileMain";

        const shareBtn = document.createElement("button");
        shareBtn.type = "button";
        shareBtn.className = "ctrlBtn profileShareBtn";
        shareBtn.id = "shareStateBtn";
        shareBtn.setAttribute("aria-label", t("ui.shareState", "Share state"));
        shareBtn.setAttribute("title", t("ui.shareState", "Share state"));
        shareBtn.innerHTML = `
      <svg class="ctrlIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M8.5 12a3.5 3.5 0 0 1 3.5-3.5h3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M15.5 12a3.5 3.5 0 0 1-3.5 3.5H8.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M14.2 8.3l2.1-2.1a3.1 3.1 0 0 1 4.4 4.4l-2.1 2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M9.8 15.7l-2.1 2.1a3.1 3.1 0 0 1-4.4-4.4l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;

        const slots = document.createElement("div");
        slots.className = "profileSlots";
        slots.id = "profileSlots";
        for (let slot = 1; slot <= PROFILE_SLOT_COUNT; slot += 1) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "ctrlBtn profileBtn";
            btn.dataset.slot = String(slot);
            btn.textContent = String(slot);
            btn.setAttribute("aria-label", tf("ui.profileSlot", "Profile {slot}", { slot }));
            btn.setAttribute("title", tf("ui.profileSlot", "Profile {slot}", { slot }));
            slots.appendChild(btn);
        }
        profileMain.appendChild(shareBtn);
        profileMain.appendChild(slots);
        profileWrap.appendChild(profileMain);

        const profileStatus = document.createElement("div");
        profileStatus.className = "profileStatus";
        profileStatus.id = "profileStatus";
        profileStatus.setAttribute("aria-live", "polite");
        profileStatus.setAttribute("aria-atomic", "true");
        profileWrap.appendChild(profileStatus);

        // Watermark / brand tag
        const watermark = document.createElement("div");
        watermark.className = "siteWatermark";
        watermark.textContent = "A YAPMAXXING PRODUCT";

        const langBtn = document.createElement("button");
        langBtn.type = "button";
        langBtn.className = "ctrlBtn";
        langBtn.id = "langBtn";
        langBtn.setAttribute("aria-label", "Language");

        langBtn.innerHTML = `
      <svg class="ctrlIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
        <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M2 12h20" stroke="currentColor" stroke-width="1.8" opacity="0.75"/>
        <path d="M12 2c2.8 2.6 4.5 6.2 4.5 10S14.8 19.4 12 22c-2.8-2.6-4.5-6.2-4.5-10S9.2 4.6 12 2Z" stroke="currentColor" stroke-width="1.8" opacity="0.75"/>
      </svg>
      <span class="ctrlText" id="langBtnText">EN</span>
    `;

        const themeBtn = document.createElement("button");
        themeBtn.type = "button";
        themeBtn.className = "ctrlBtn";
        themeBtn.id = "themeBtn";
        themeBtn.setAttribute("aria-label", "Toggle theme");

        themeBtn.innerHTML = `
      <svg class="ctrlIcon" viewBox="0 0 24 24" aria-hidden="true" fill="none" id="themeIcon">
        <path d="M21 13.2A8.2 8.2 0 1 1 10.8 3a6.8 6.8 0 0 0 10.2 10.2Z"
          stroke="currentColor" stroke-width="1.8" />
      </svg>
    `;

        const appearanceWrap = document.createElement("div");
        appearanceWrap.className = "siteAppearanceControls";
        appearanceWrap.id = "siteAppearanceControls";
        appearanceWrap.appendChild(langBtn);
        appearanceWrap.appendChild(themeBtn);

        wrap.appendChild(profileWrap);
        wrap.appendChild(watermark);
        wrap.appendChild(appearanceWrap);

        document.body.appendChild(wrap);
        bindSiteControlsReserve(wrap);

        langBtn.addEventListener("click", () => {
            const cur = getLang();
            const i = LANG_ORDER.indexOf(cur);
            const next = LANG_ORDER[(i + 1) % LANG_ORDER.length];
            setLang(next);
        });

        themeBtn.addEventListener("click", () => toggleTheme());
        shareBtn.addEventListener("click", () => { void shareCurrentState(); });
        slots.querySelectorAll(".profileBtn[data-slot]").forEach((btn) => {
            btn.addEventListener("click", () => {
                switchToProfile(btn.dataset.slot);
            });
        });
        refreshProfileControls();
    }

    function updateLangButton() {
        const el = document.getElementById("langBtnText");
        if (!el) return;
        const lang = getLang();
        el.textContent = LANG_LABEL[lang] || "EN";
    }

    function updateThemeButton() {
        const icon = document.getElementById("themeIcon");
        if (!icon) return;

        // If effective is light -> show sun, else show moon
        const eff = effectiveTheme();
        if (eff === "light") {
            icon.innerHTML = `
        <path d="M12 18a6 6 0 1 0-6-6 6 6 0 0 0 6 6Z" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M19.8 4.2l-1.6 1.6M5.8 18.2l-1.6 1.6"
          stroke="currentColor" stroke-width="1.8" opacity="0.75"/>
      `;
        } else {
            icon.innerHTML = `
        <path d="M21 13.2A8.2 8.2 0 1 1 10.8 3a6.8 6.8 0 0 0 10.2 10.2Z"
          stroke="currentColor" stroke-width="1.8" />
      `;
        }
    }

    async function init() {
        const sharedLoad = applySharedStateFromUrl();
        const hasSharedState = !!sharedLoad?.applied;
        const startupProfile = hasSharedState
            ? 1
            : normalizeProfileSlot(storageGetItem(LS_PROFILE_ACTIVE), 1);
        setActiveProfileSlot(startupProfile);
        if (!hasSharedState) {
            const startupSnapshot = readProfileSnapshot(startupProfile);
            applyStateMap(snapshotHasData(startupSnapshot) ? startupSnapshot.state : {});
            clearTempSharedState();
        }
        injectControls();
        bindProfileLockInteractionGuard();
        applyTheme();
        await loadWhitelist();

        const lang = getLang();
        applyLang(lang);
        updateControlI18nText();
        updateLangButton();
        refreshProfileControls();
        if (!hasSharedState) showProfileStatus(startupProfile);
        if (hasSharedState) {
            notify(sharedLoad.partial
                ? t("ui.sharedStateTempLoadedPartial", "Share link may be cut off. Loaded recovered critical data only.")
                : t("ui.sharedStateTempLoaded", "Shared state loaded temporarily. Click an empty profile slot to save it, then edit."));
        }

        window.addEventListener("beforeunload", () => { saveCurrentStateIfPersistent(); });
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") saveCurrentStateIfPersistent();
        });

        // If system theme changes and user has no override, update icon
        const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
        if (mq) {
            const onSystemThemeChange = () => {
                if (!getThemeOverride()) applyTheme();
            };
            if (typeof mq.addEventListener === "function") {
                mq.addEventListener("change", onSystemThemeChange);
            } else if (typeof mq.addListener === "function") {
                mq.addListener(onSystemThemeChange);
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();


