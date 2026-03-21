// js/tutorial/tutorial-i18n.js
(() => {
  "use strict";

  const I18N = {
    "zh-Hans": {
      ui: {
        guideButton: "向导",
        acknowledgementsButton: "鸣谢",
        acknowledgementsTitle: "鸣谢",
        skipAll: "跳过全部",
        back: "返回",
        skipChapter: "跳过本章",
        next: "下一步",
        done: "完成",
        progressStepOf: "第 {step} 步，共 {total} 步",
        pickerTitle: "教程章节",
        pickerBody: "选择一个章节开始或重播。",
        close: "关闭",
        resetProgress: "重置教程进度",
        chapterComplete: "章节完成",
        tutorialComplete: "教程完成",
        openChapters: "打开章节",
        explore: "探索",
        continueNextChapter: "继续下一章",
        continueGuide: "继续：{name}",
        statusCompleted: "已完成",
        statusSkipped: "已跳过",
        statusInProgress: "进行中",
        statusNotStarted: "未开始",
      },
      completion: {
        allDoneBody: "你已完成所有教程章节。你可以自由探索，或随时重新打开章节。",
        chapterDoneBody: "{chapter} 已完成。现在继续下一章，或先自行探索。",
        nextUpName: "下一位是 {name}。",
        readyNext: "我们已经准备好进入下一章。",
        guideThrough: "我会带你完成《{chapter}》。",
        finalFromLine: "感谢你聆听我们的分享。希望很快会有更多朋友来与你分享。祝你地下城好运！",
      },
      ack: {
        body:
          "360Dungeon 献给 MilkMaxxing、yapmaxxing 和所有 yappers。\n\n我希望这个项目和这些工具能让你的 MilkyWayIdle 体验更好。也感谢我的公会成员，以及在测试阶段提供反馈和改进建议的社区朋友。特别鸣谢 Edible Tools 和 Physon's Calculator。\n\n如果你有任何意见或建议，欢迎在游戏里给我留言。再次感谢！\n\n-360Drago'",
      },
      chapter: {
        quick_calculator: {
          title: "快速计算器教程",
          description: "Noland 的入门路线：选择地下城、选择层级、快速计算并读取结果。",
          step: {
            "language-theme-check": {
              title: "语言与主题",
              body:
                "ᚲᚨᚾ ᛁᛟᚢ ᚢᚾᛞᛖᚱᛊᛏᚨᚾᛞ ᛗᛖ ...... 嗯嗯……要不先用{currentLanguage}？你能看懂我、看清界面吗？如果需要的话，可以先在上方切换语言和明暗主题。",
            },
            welcome: {
              title: "Noland 的快速开始",
              body:
                "欢迎来到 360Dungeon！我是 Noland。看起来你是新来的。我和朋友们会带你熟悉这里。我也还在学习，所以先带你走最简单的路线：快速计算模式。",
            },
            "dungeon-cards": {
              title: "选择地下城",
              body: "我们先从简单的开始。选择你想挑战的地下城，后续计算都会以它为基础。",
            },
            "tier-row": {
              title: "选择层级",
              body: "现在选择层级：T0、T1 或 T2。层级会影响成本和收益，请确保与队伍实际情况一致，这样结果才可靠。",
            },
            "quick-inputs": {
              title: "快速输入",
              body:
                "现在填写你的跑图信息！我默认把战斗增益设为 20，但如果你当前不是这个数值请及时修改。每日消耗和通关时间都非常重要。别担心，之后都可以再调整。",
            },
            "quick-run": {
              title: "运行计算器",
              body: "都设置好后点击 Calculate。希望我们能看到一点魔法，让你的快速计算立刻完成！",
            },
            "quick-results": {
              title: "查看结果",
              body: "干得漂亮。结果面板会显示：每日利润、每小时利润、每日次数和钥匙消耗。",
            },
            profiles: {
              title: "配置档",
              body: "一个实用技巧是用配置档保存不同方案。当前激活的配置会保持高亮，你也可以上锁，避免误清空数据。",
            },
            "profile-share": {
              title: "分享当前配置",
              body:
                "点击 Share 后，会复制一条带有当前激活配置全部信息的魔法链接。这样你可以轻松发给朋友，或留作以后参考。",
            },
          },
        },
        advanced: {
          title: "高级教程",
          description: "更深入的高级控制与计算调优。",
          step: {
            "advanced-intro": {
              title: "高级模式",
              body: "我擅长高级控制。与其只靠默认假设和市场数据，我更喜欢掌控更多细节。",
            },
            "advanced-toggle": {
              title: "高级开关",
              body: "用这个开关在快速流程和高级流程之间切换。",
            },
            "pricing-panel": {
              title: "价格来源",
              body: "如果你自己制作钥匙，或想改用其他 *API* 获取价格，就在这里调整。",
            },
            "run-panel": {
              title: "跑图输入",
              body: "就像 Noland 之前说的，务必确认这里的数据正确。玩家信息请每次都检查。",
            },
            "manual-loot-prices": {
              title: "手动掉落价格",
              body:
                "如果你有自己的掉落估值，或市场暂时没有挂单，可以在这里手动控制。小心这份力量，错误估值会让你看到并不真实的“高利润”。",
            },
            "advanced-run": {
              title: "计算高级结果",
              body: "再次点击这里生成结果。还有个小技巧：不想点按钮时，可以直接按 *ENTER KEY*。",
            },
            "advanced-results": {
              title: "高级结果",
              body: "希望这些内容能给你更多控制和信息。如果你喜欢这种深度工具，后面还有更多值得一看。",
            },
          },
        },
        compare: {
          title: "区域对比教程",
          description: "Fenric 的快节奏对比路线：设分钟、调掉落过滤、计算并快速选优。",
          step: {
            "compare-intro": {
              title: "区域对比",
              body: "我可没时间一直点来点去，我更喜欢一次看全所有数据。来，看看这个。",
            },
            "compare-toggle": {
              title: "启用对比",
              body: "先从这里开始。打开 Zone Compare，我们就能并排比较所有区域。",
            },
            "compare-panel": {
              title: "对比面板",
              body: "这就是你的对比看板。你可以在这里快速得到各区域与层级的结论。",
            },
            "compare-min-row": {
              title: "先填一行分钟",
              body: "先像这样填一行通关时间，然后把同样流程应用到你关心的所有区域与层级，甚至可以把整张对比表都填满。还有一个小提示：你也可以用方向键在这些输入框之间移动。",
            },
            "compare-low-drop-toggle": {
              title: "移除 1% 掉落",
              body: "如果你担心自己的运气，可以用这个开关移除 1% 掉落，这样既能得到更严格的基线，也能看看在运气不好时结果可能会变成什么样。",
            },
            "compare-calculate": {
              title: "计算对比",
              body: "当各行都填好后，点击 Calculate。就这么简单！别忘了（像我一样）同时检查其他输入和手动价格。",
            },
            "compare-read-board": {
              title: "读取优胜结果",
              body: "接下来就是决定队伍去哪。记得留意负期望值，有时并不是每种箱子都值得开。",
            },
          },
        },
        keys_tokens: {
          title: "钥匙与代币商店教程",
          description: "Enora 的价值工坊：选上下文、看代币价值、核对钥匙经济并刷新价格。",
          step: {
            "keys-tokens-intro": {
              title: "钥匙与代币商店",
              body: "我还有两个工具想让你看看，都是我阅读和研究后整理出来的。",
            },
            "token-toggle": {
              title: "代币商店开关",
              body: "首先打开 Token Shop。这样会显示当前地下城的代币价值面板。",
            },
            "token-select-dungeon": {
              title: "选择地下城",
              body: "现在选择要评估的地下城。代币和钥匙的计算都会跟随这个选择，所以请先设好它。",
            },
            "token-panel": {
              title: "代币商店面板",
              body: "这个面板会列出代币选项及其市场价值，帮助你找到更高的代币价值回报。",
            },
            "token-refresh": {
              title: "刷新代币价格",
              body: "当你需要最新价格快照时，在做决定前先点击这里的 Refresh prices。",
            },
            "keys-toggle": {
              title: "钥匙开关",
              body: "接着打开 Keys。这里会比较制作成本与市场价格，适合评估是否自己制作。",
            },
            "keys-headers": {
              title: "钥匙扩展视图",
              body: "这个区域会显示所有钥匙表，方便你比较钥匙的买卖价格，以及自己制作时可能需要付出的成本。",
            },
            "keys-planner": {
              title: "\u94a5\u5319\u6210\u672c\u89c4\u5212\u5668",
              body:
                "\u5982\u679c\u4f60\u60f3\u89c4\u5212\u81ea\u5df1\u7684\u5236\u4f5c\uff0c\u4e5f\u53ef\u4ee5\u5c55\u5f00\u8fd9\u4e2a\u83dc\u5355\u3002\u53ea\u8981\u4e3a\u5f53\u524d\u9009\u4e2d\u7684\u5730\u4e0b\u57ce\u8bbe\u5b9a\u60f3\u8981\u7684\u94a5\u5319\u6570\u91cf\uff0c\u518d\u628a\u6240\u6709\u5207\u6362\u9009\u9879\u68c0\u67e5\u597d\uff1b\u5982\u679c\u4f60\u613f\u610f\uff0c\u4e5f\u53ef\u4ee5\u624b\u52a8\u8f93\u5165\u4ef7\u683c\u3002",
            },
            "keys-entry-toggle": {
              title: "\u5165\u573a\u94a5\u5319",
              body: "\u4f60\u751a\u81f3\u8fd8\u53ef\u4ee5\u5207\u6362\u6210\u67e5\u770b\u5165\u573a\u94a5\u5319\u3002",
            },
            "keys-refresh": {
              title: "刷新钥匙价格",
              body: "和前面一样，记得查看刷新计时器，或直接再按一次刷新，确保数据最新。",
            },
          },
        },
      },
      guide: {
        novice: {
          name: "Noland the Novice",
          intro: "嗨，你好！我是 Noland the Novice。",
          handoff: {
            advanced: "你做得很棒。我懂得不算多，但我想把你介绍给我的教授之一，Icera the Cold。她很严格，不过能把一切都整理得井井有条。",
          },
          outro: "再见",
        },
        ice: {
          name: "Icera the Cold",
          intro: "你好，我是 Icera the Cold。我很乐意教你一些高级工具的用法。",
          handoff: {
            compare: "如果你需要更多控制，我的工具会很适合你。不过 Fenric 这位老法师也很有经验，让我把你交给他。",
          },
          outro: "再见",
        },
        flame: {
          name: "Fenric the Flame",
          intro: "很高兴见到你！我是 Fenric the Flame。别看我年纪大，火力还在。让我给你看看我这些年的心得。",
          handoff: {
            keys_tokens: "我该去打个盹了，不过在你独自冒险前，Enora 还有一些技巧想分享给你。",
          },
          outro: "再见",
        },
        elementalist: {
          name: "Enora the Elementalist",
          intro: "我是 Enora the Elementalist。我读了很多资料，也整理了一些想法，可能会在你的旅程中帮到你。",
          outro: "再见",
        },
      },
    },
    "zh-Hant": {
      ui: {
        guideButton: "嚮導",
        acknowledgementsButton: "鳴謝",
        acknowledgementsTitle: "鳴謝",
        skipAll: "跳過全部",
        back: "返回",
        skipChapter: "跳過本章",
        next: "下一步",
        done: "完成",
        progressStepOf: "第 {step} 步，共 {total} 步",
        pickerTitle: "教學章節",
        pickerBody: "選擇一個章節開始或重播。",
        close: "關閉",
        resetProgress: "重置教學進度",
        chapterComplete: "章節完成",
        tutorialComplete: "教學完成",
        openChapters: "開啟章節",
        explore: "探索",
        continueNextChapter: "繼續下一章",
        continueGuide: "繼續：{name}",
        statusCompleted: "已完成",
        statusSkipped: "已跳過",
        statusInProgress: "進行中",
        statusNotStarted: "未開始",
      },
      completion: {
        allDoneBody: "你已完成所有教學章節。你可以自由探索，或隨時重新開啟章節。",
        chapterDoneBody: "{chapter} 已完成。現在繼續下一章，或先自行探索。",
        nextUpName: "下一位是 {name}。",
        readyNext: "我們已經準備好進入下一章。",
        guideThrough: "我會帶你完成《{chapter}》。",
        finalFromLine: "感謝你聆聽我們的分享。希望很快會有更多朋友與你分享。祝你地下城好運！",
      },
      ack: {
        body:
          "360Dungeon 獻給 MilkMaxxing、yapmaxxing 與所有 yappers。\n\n我希望這個專案和這些工具能讓你的 MilkyWayIdle 體驗更好。也感謝我的公會成員，以及在測試期間提供回饋與改進建議的社群朋友。特別鳴謝 Edible Tools 與 Physon's Calculator。\n\n如果你有任何意見或建議，歡迎在遊戲內私訊我。再次感謝！\n\n-360Drago'",
      },
      chapter: {
        quick_calculator: {
          title: "快速計算器教學",
          description: "Noland 的入門路線：選地下城、選層級、快速計算並讀取結果。",
          step: {
            "language-theme-check": {
              title: "語言與主題",
              body:
                "ᚲᚨᚾ ᛁᛟᚢ ᚢᚾᛞᛖᚱᛊᛏᚨᚾᛞ ᛗᛖ ...... 嗯嗯……要不要先用{currentLanguage}？你看得懂我、看得清楚介面嗎？如果需要，可以先在上方切換語言與明暗主題。",
            },
            welcome: {
              title: "Noland 的快速開始",
              body:
                "歡迎來到 360Dungeon！我是 Noland。看起來你是新來的。我和朋友們會帶你熟悉這裡。我也還在學習，所以先帶你走最簡單的路線：快速計算模式。",
            },
            "dungeon-cards": {
              title: "選擇地下城",
              body: "我們先從簡單的開始。選擇你想挑戰的地下城，後續計算都會以它為基礎。",
            },
            "tier-row": {
              title: "選擇層級",
              body: "現在選擇層級：T0、T1 或 T2。層級會影響成本與收益，請務必與隊伍實際情況一致，結果才會可靠。",
            },
            "quick-inputs": {
              title: "快速輸入",
              body:
                "現在填寫你的跑圖資訊！我預設把戰鬥增益設為 20，但如果你目前不是這個數值，請記得修改。每日消耗與通關時間都非常重要。別擔心，之後都可以再調整。",
            },
            "quick-run": {
              title: "執行計算器",
              body: "都設定好後點擊 Calculate。希望我們能看到一點魔法，讓你的快速計算立刻完成！",
            },
            "quick-results": {
              title: "查看結果",
              body: "做得很好。結果面板會顯示：每日利潤、每小時利潤、每日次數與鑰匙消耗。",
            },
            profiles: {
              title: "配置檔",
              body: "一個實用技巧是用配置檔儲存不同方案。當前啟用的配置會保持高亮，你也可以上鎖，避免誤清空資料。",
            },
            "profile-share": {
              title: "分享目前配置",
              body:
                "點擊 Share 後，會複製一條包含目前啟用配置全部資訊的魔法連結。這樣你可以輕鬆分享給朋友，或留作日後參考。",
            },
          },
        },
        advanced: {
          title: "進階教學",
          description: "更深入的進階控制與計算調整。",
          step: {
            "advanced-intro": {
              title: "進階模式",
              body: "我擅長進階控制。與其只依賴預設假設和市場資訊，我更喜歡掌控更多細節。",
            },
            "advanced-toggle": {
              title: "進階開關",
              body: "使用這個開關在快速流程與進階流程之間切換。",
            },
            "pricing-panel": {
              title: "價格來源",
              body: "如果你自己製作鑰匙，或想改用其他 *API* 取得價格，就在這裡調整。",
            },
            "run-panel": {
              title: "跑圖輸入",
              body: "就像 Noland 先前提到的，這裡的資料一定要確認正確。玩家資訊請每次都檢查。",
            },
            "manual-loot-prices": {
              title: "手動掉落價格",
              body:
                "如果你有自己的掉落估值，或市場暫時沒有掛單，可以在這裡手動控制。這份力量要小心使用，錯誤估值會讓你看到不真實的「高利潤」。",
            },
            "advanced-run": {
              title: "計算進階結果",
              body: "再次點擊這裡產生結果。還有個小技巧：不想點按鈕時，可以直接按 *ENTER KEY*。",
            },
            "advanced-results": {
              title: "進階結果",
              body: "希望這些內容能讓你獲得更多控制與資訊。如果你喜歡這類深度工具，後面還有更多值得一看。",
            },
          },
        },
        compare: {
          title: "區域比較教學",
          description: "Fenric 的快節奏比較路線：設分鐘、調掉落過濾、計算並快速選優。",
          step: {
            "compare-intro": {
              title: "區域比較",
              body: "我可沒時間一直點來點去，我更喜歡一次看完整份資料。來，看看這個。",
            },
            "compare-toggle": {
              title: "啟用比較",
              body: "先從這裡開始。打開 Zone Compare，我們就能把所有區域並排比較。",
            },
            "compare-panel": {
              title: "比較面板",
              body: "這就是你的比較看板。你可以在這裡快速得到各區域與層級的結論。",
            },
            "compare-min-row": {
              title: "先填一行分鐘",
              body: "先像這樣填一行通關時間，接著把同樣流程套用到你關心的所有區域與層級，甚至可以把整張比較表都填滿。還有一個小提示：你也可以用方向鍵在這些輸入框之間移動。",
            },
            "compare-low-drop-toggle": {
              title: "移除 1% 掉落",
              body: "如果你擔心自己的運氣，可以用這個開關移除 1% 掉落，這樣既能得到更嚴格的基線，也能看看在運氣不好時結果可能會變成什麼樣。",
            },
            "compare-calculate": {
              title: "計算比較",
              body: "當各列都填好後，點擊 Calculate。就這麼簡單！別忘了（像我一樣）同時檢查其他輸入與手動價格。",
            },
            "compare-read-board": {
              title: "讀取優勝結果",
              body: "接著就是決定隊伍要去哪。記得留意負期望值，有時不是每一種箱子都值得開。",
            },
          },
        },
        keys_tokens: {
          title: "鑰匙與代幣商店教學",
          description: "Enora 的價值工坊：選上下文、看代幣價值、核對鑰匙經濟並刷新價格。",
          step: {
            "keys-tokens-intro": {
              title: "鑰匙與代幣商店",
              body: "我還有兩個工具想讓你看看，都是我閱讀和研究後整理出的重點。",
            },
            "token-toggle": {
              title: "代幣商店開關",
              body: "首先打開 Token Shop。這會顯示目前地下城的代幣價值面板。",
            },
            "token-select-dungeon": {
              title: "選擇地下城",
              body: "現在選擇要評估的地下城。代幣與鑰匙計算都會跟隨這個選擇，所以請先設定好。",
            },
            "token-panel": {
              title: "代幣商店面板",
              body: "這個面板會列出代幣選項及其市場價值，幫助你找出更高的代幣價值回報。",
            },
            "token-refresh": {
              title: "刷新代幣價格",
              body: "當你需要最新價格快照時，在做決策前先點擊這裡的 Refresh prices。",
            },
            "keys-toggle": {
              title: "鑰匙開關",
              body: "接著打開 Keys。這裡會比較製作成本與市場價格，適合評估是否自行製作。",
            },
            "keys-headers": {
              title: "鑰匙擴展視圖",
              body: "這個區域會顯示所有鑰匙表，方便你比較鑰匙的買賣價格，以及自己製作時可能需要付出的成本。",
            },
            "keys-planner": {
              title: "\u9470\u5319\u6210\u672c\u898f\u5283\u5668",
              body:
                "\u5982\u679c\u4f60\u60f3\u898f\u5283\u81ea\u5df1\u7684\u88fd\u4f5c\uff0c\u4e5f\u53ef\u4ee5\u5c55\u958b\u9019\u500b\u9078\u55ae\u3002\u53ea\u8981\u70ba\u76ee\u524d\u9078\u4e2d\u7684\u5730\u4e0b\u57ce\u8a2d\u5b9a\u60f3\u8981\u7684\u9470\u5319\u6578\u91cf\uff0c\u518d\u628a\u6240\u6709\u5207\u63db\u9078\u9805\u6aa2\u67e5\u597d\uff1b\u5982\u679c\u4f60\u9858\u610f\uff0c\u4e5f\u53ef\u4ee5\u624b\u52d5\u8f38\u5165\u50f9\u683c\u3002",
            },
            "keys-entry-toggle": {
              title: "\u5165\u5834\u9470\u5319",
              body: "\u4f60\u751a\u81f3\u9084\u53ef\u4ee5\u5207\u63db\u6210\u67e5\u770b\u5165\u5834\u9470\u5319\u3002",
            },
            "keys-refresh": {
              title: "刷新鑰匙價格",
              body: "和前面一樣，記得看刷新計時器，或直接再按一次刷新，確保資料最新。",
            },
          },
        },
      },
      guide: {
        novice: {
          name: "Noland the Novice",
          intro: "嗨，你好！我是 Noland the Novice。",
          handoff: {
            advanced: "你做得很棒。我懂得不算多，但我想把你介紹給我的教授之一，Icera the Cold。她很嚴格，不過能把一切整理得井井有條。",
          },
          outro: "再見",
        },
        ice: {
          name: "Icera the Cold",
          intro: "你好，我是 Icera the Cold。我很樂意教你一些進階工具的用法。",
          handoff: {
            compare: "如果你需要更多控制，我的工具會很適合你。不過 Fenric 這位老法師也很有經驗，讓我把你交給他。",
          },
          outro: "再見",
        },
        flame: {
          name: "Fenric the Flame",
          intro: "很高興見到你！我是 Fenric the Flame。別看我年紀大，火力還在。讓我給你看看我這些年的心得。",
          handoff: {
            keys_tokens: "我該去打個盹了，不過在你獨自冒險前，Enora 還有一些技巧想分享給你。",
          },
          outro: "再見",
        },
        elementalist: {
          name: "Enora the Elementalist",
          intro: "我是 Enora the Elementalist。我讀了很多資料，也整理了一些想法，可能會在你的旅程中幫到你。",
          outro: "再見",
        },
      },
    },
  };

  function applyTutorialOverrides() {
    const hans = I18N["zh-Hans"]?.chapter?.keys_tokens?.step;
    if (hans) {
      hans["token-select-dungeon"] = {
        title: "\u9009\u62e9\u5730\u4e0b\u57ce",
        body: "\u4f7f\u7528\u8fd9\u4e9b\u5206\u533a\u5361\u7247\u5207\u6362\u4f60\u6b63\u5728\u7814\u7a76\u7684\u5730\u4e0b\u57ce\u3002\u4e0b\u65b9\u7684 Token Shop \u8be6\u60c5\u9762\u677f\u4f1a\u8ddf\u968f\u8fd9\u4e2a\u9009\u62e9\uff0c\u6240\u4ee5\u8bf7\u5148\u5728\u8fd9\u91cc\u9009\u597d\u5206\u533a\u3002",
      };
      hans["token-panel"] = {
        title: "\u4ee3\u5e01\u5546\u5e97\u9762\u677f",
        body: "\u5728\u4e0a\u65b9\u9009\u597d\u5206\u533a\u540e\uff0c\u4e0b\u65b9\u7684\u8be6\u60c5\u9762\u677f\u4f1a\u663e\u793a\u5b8c\u6574\u7684 Token Shop \u8868\u683c\u548c\u5b83\u4eec\u5bf9\u5e94\u7684\u5e02\u573a\u4ef7\u503c\uff0c\u5e2e\u4f60\u627e\u5230\u6bcf\u679a token \u6700\u5212\u7b97\u7684\u9009\u9879\uff01",
      };
      hans["keys-headers"] = {
        title: "\u94a5\u5319\u603b\u89c8",
        body: "\u8fd9\u4e2a\u603b\u89c8\u533a\u57df\u53ef\u4ee5\u8ba9\u4f60\u5feb\u901f\u5bf9\u6bd4\u6240\u6709\u5730\u4e0b\u57ce\u7684\u94a5\u5319\u6458\u8981\u3002\u7528\u8fd9\u4e9b\u5361\u7247\u5207\u6362\u5206\u533a\uff0c\u5982\u679c\u4f60\u60f3\u770b\u5b8c\u6574\u7684\u5236\u4f5c\u89c4\u5212\uff0c\u518d\u770b\u4e0b\u65b9\u7684\u89c4\u5212\u9762\u677f\u3002",
      };
      hans["keys-planner"] = {
        title: "\u94a5\u5319\u6210\u672c\u89c4\u5212\u5668",
        body: "\u5982\u679c\u4f60\u60f3\u89c4\u5212\u81ea\u5df1\u7684\u5236\u4f5c\uff0c\u4e5f\u53ef\u4ee5\u5c55\u5f00\u8fd9\u4e2a\u83dc\u5355\u3002\u53ea\u8981\u4e3a\u5f53\u524d\u9009\u4e2d\u7684\u5730\u4e0b\u57ce\u8bbe\u5b9a\u60f3\u8981\u7684\u94a5\u5319\u6570\u91cf\uff0c\u518d\u628a\u6240\u6709\u5207\u6362\u9009\u9879\u68c0\u67e5\u597d\uff1b\u5982\u679c\u4f60\u613f\u610f\uff0c\u4e5f\u53ef\u4ee5\u624b\u52a8\u8f93\u5165\u4ef7\u683c\u3002",
      };
      hans["keys-entry-toggle"] = {
        title: "\u5165\u573a\u94a5\u5319",
        body: "\u4f60\u751a\u81f3\u8fd8\u53ef\u4ee5\u5207\u6362\u6210\u67e5\u770b\u5165\u573a\u94a5\u5319\u3002",
      };
    }

    const hansCompare = I18N["zh-Hans"]?.chapter?.compare?.step;
    if (hansCompare) {
      hansCompare["compare-copy-keys"] = {
        title: "\u590d\u5236\u94a5\u5319\u9700\u6c42",
        body: "\u4f60\u4e5f\u53ef\u4ee5\u628a\u9f20\u6807\u79fb\u5230\u8fd9\u91cc\u518d\u70b9\u51fb\u5b83\uff0c\u628a\u8fd9\u6b21\u6bcf\u65e5\u8fd0\u884c\u9700\u8981\u7684\u94a5\u5319\u6570\u91cf\u590d\u5236\u5230 Keys \u533a\u57df\u4f7f\u7528\u3002\u6211\u8fd9\u5c31\u53bb\u627e Enora\uff0c\u8ba9\u5979\u7ed9\u4f60\u6f14\u793a\u8fd9\u662f\u600e\u4e48\u8fd0\u4f5c\u7684\u3002",
      };
    }
    const hansCompletion = I18N["zh-Hans"]?.completion;
    if (hansCompletion) {
      hansCompletion.finalFromLine =
        "\u611f\u8c22\u4f60\u542c\u5b8c\u6211\u4eec\u60f3\u5206\u4eab\u7684\u4e00\u5207\u3002\u5982\u679c\u4f60\u4e4b\u540e\u60f3\u518d\u590d\u4e60\u4e00\u904d\uff0c\u53ef\u4ee5\u70b9\u51fb\u5de6\u4e0a\u89d2\u7684 Guide\u3002\u6211\u4eec\u5e0c\u671b\u5f88\u5feb\u8fd8\u4f1a\u6709\u66f4\u591a\u670b\u53cb\u4e0e\u4f60\u5206\u4eab\u4ed6\u4eec\u7684\u6280\u5de7\u548c\u5de5\u5177\u3002\u795d\u4f60\u7684\u5730\u4e0b\u57ce\u5192\u9669\u597d\u8fd0\uff01";
    }

    const hant = I18N["zh-Hant"]?.chapter?.keys_tokens?.step;
    if (hant) {
      hant["token-select-dungeon"] = {
        title: "\u9078\u64c7\u5730\u4e0b\u57ce",
        body: "\u4f7f\u7528\u9019\u4e9b\u5206\u5340\u5361\u7247\u5207\u63db\u4f60\u6b63\u5728\u7814\u7a76\u7684\u5730\u4e0b\u57ce\u3002\u4e0b\u65b9\u7684 Token Shop \u8a73\u7d30\u9762\u677f\u6703\u8ddf\u96a8\u9019\u500b\u9078\u64c7\uff0c\u6240\u4ee5\u8acb\u5148\u5728\u9019\u88e1\u9078\u597d\u5206\u5340\u3002",
      };
      hant["token-panel"] = {
        title: "\u4ee3\u5e63\u5546\u5e97\u9762\u677f",
        body: "\u5728\u4e0a\u65b9\u9078\u597d\u5206\u5340\u5f8c\uff0c\u4e0b\u65b9\u7684\u8a73\u7d30\u9762\u677f\u6703\u986f\u793a\u5b8c\u6574\u7684 Token Shop \u8868\u683c\u8207\u5b83\u5011\u5c0d\u61c9\u7684\u5e02\u5834\u50f9\u503c\uff0c\u5e6b\u4f60\u627e\u51fa\u6bcf\u679a token \u6700\u5212\u7b97\u7684\u9078\u9805\uff01",
      };
      hant["keys-headers"] = {
        title: "\u9470\u5319\u7e3d\u89bd",
        body: "\u9019\u500b\u7e3d\u89bd\u5340\u57df\u53ef\u4ee5\u8b93\u4f60\u5feb\u901f\u6bd4\u8f03\u6240\u6709\u5730\u4e0b\u57ce\u7684\u9470\u5319\u6458\u8981\u3002\u7528\u9019\u4e9b\u5361\u7247\u5207\u63db\u5206\u5340\uff0c\u5982\u679c\u4f60\u60f3\u770b\u5b8c\u6574\u7684\u88fd\u4f5c\u898f\u5283\uff0c\u518d\u770b\u4e0b\u65b9\u7684\u898f\u5283\u9762\u677f\u3002",
      };
      hant["keys-planner"] = {
        title: "\u9470\u5319\u6210\u672c\u898f\u5283\u5668",
        body: "\u5982\u679c\u4f60\u60f3\u898f\u5283\u81ea\u5df1\u7684\u88fd\u4f5c\uff0c\u4e5f\u53ef\u4ee5\u5c55\u958b\u9019\u500b\u9078\u55ae\u3002\u53ea\u8981\u70ba\u76ee\u524d\u9078\u4e2d\u7684\u5730\u4e0b\u57ce\u8a2d\u5b9a\u60f3\u8981\u7684\u9470\u5319\u6578\u91cf\uff0c\u518d\u628a\u6240\u6709\u5207\u63db\u9078\u9805\u6aa2\u67e5\u597d\uff1b\u5982\u679c\u4f60\u9858\u610f\uff0c\u4e5f\u53ef\u4ee5\u624b\u52d5\u8f38\u5165\u50f9\u683c\u3002",
      };
      hant["keys-entry-toggle"] = {
        title: "\u5165\u5834\u9470\u5319",
        body: "\u4f60\u751a\u81f3\u9084\u53ef\u4ee5\u5207\u63db\u6210\u67e5\u770b\u5165\u5834\u9470\u5319\u3002",
      };
    }

    const hantCompare = I18N["zh-Hant"]?.chapter?.compare?.step;
    if (hantCompare) {
      hantCompare["compare-copy-keys"] = {
        title: "\u8907\u88fd\u9470\u5319\u9700\u6c42",
        body: "\u4f60\u4e5f\u53ef\u4ee5\u5c07\u6ed1\u9f20\u79fb\u5230\u9019\u88e1\u518d\u9ede\u64ca\u5b83\uff0c\u628a\u9019\u6b21\u6bcf\u65e5\u904b\u884c\u9700\u8981\u7684\u9470\u5319\u6578\u91cf\u8907\u88fd\u5230 Keys \u5340\u57df\u4f7f\u7528\u3002\u6211\u9019\u5c31\u53bb\u627e Enora\uff0c\u8b93\u5979\u7d66\u4f60\u793a\u7bc4\u9019\u662f\u600e\u9ebc\u904b\u4f5c\u7684\u3002",
      };
    }
    const hantCompletion = I18N["zh-Hant"]?.completion;
    if (hantCompletion) {
      hantCompletion.finalFromLine =
        "\u611f\u8b1d\u4f60\u807d\u5b8c\u6211\u5011\u60f3\u5206\u4eab\u7684\u4e00\u5207\u3002\u5982\u679c\u4f60\u4e4b\u5f8c\u60f3\u518d\u8907\u7fd2\u4e00\u904d\uff0c\u53ef\u4ee5\u9ede\u64ca\u5de6\u4e0a\u89d2\u7684 Guide\u3002\u6211\u5011\u5e0c\u671b\u5f88\u5feb\u9084\u6703\u6709\u66f4\u591a\u670b\u53cb\u8207\u4f60\u5206\u4eab\u4ed6\u5011\u7684\u6280\u5de7\u548c\u5de5\u5177\u3002\u795d\u4f60\u7684\u5730\u4e0b\u57ce\u5192\u96aa\u597d\u904b\uff01";
    }
  }

  applyTutorialOverrides();

  function getLang() {
    return window.SiteI18n?.getLang?.() || "en";
  }

  function lookup(obj, path) {
    const parts = String(path || "").split(".");
    let cur = obj;
    for (const part of parts) {
      if (!cur || typeof cur !== "object" || !(part in cur)) return "";
      cur = cur[part];
    }
    return typeof cur === "string" ? cur : "";
  }

  function t(key, fallback = "") {
    const lang = getLang();
    const out = lookup(I18N[lang], key);
    return out || fallback;
  }

  function tf(key, fallback = "", vars = {}) {
    let out = t(key, fallback);
    Object.entries(vars || {}).forEach(([name, value]) => {
      const re = new RegExp(`\\{${String(name)}\\}`, "g");
      out = out.replace(re, String(value == null ? "" : value));
    });
    return out;
  }

  window.DungeonTutorialI18n = {
    t,
    tf,
    getLang,
  };
})();
