---
name: toon-game
description: 互动游戏工作台入口。把用户一句「做个互动游戏 / 把小说改成游戏 / 继续游戏项目」变成可核对的工程骨架与阶段计划：先识别意图与工程，再建 game-adaptations/<项目>/，按 novel-to-game 的立项、拆书、概念、设计、灰盒、美术、构建、验收推进。用户提到互动游戏、改编成游戏、游戏原型、灰盒、可玩版本、盲玩验收时使用。
---

# 互动游戏工作台：从一句需求到可试玩

作品是工作区里的普通文件，不是对话里的承诺。先识别意图，再建最小骨架；每个阶段只做这一步，证据没出现就不算完成。

## 0. 入口：先识别，再动手

1. 需求含糊时先 `toon_intent({ text })`。只有 `medium=game` 才进这条线；`novel/drama/video/reference` 回各自工作台。
2. 游戏需求先 `toon_game_intake({ text, workspace })`：
   - `routed=false`：这句话更像别的媒介，按返回的建议回对应工作台，不要硬建游戏工程。
   - `routed=true`：拿到 `project / existing / source / nextStage / actions`，工作台会自动切到「互动游戏」页签。
3. 用户确认后才 `toon_game_project({ action: 'init', ... })`。入口工具只读，不替用户建目录。

判断「原创还是改编」：

- 原话有「小说 / 原著 / 这本书 / 《书名》」→ 改编，`PRODUCT_BRIEF.md` 的「原著：」必须写来源；
- 原话是「原创 / 自己的世界观 / 从零」→ 原创，拆书阶段跳过；
- 判不出来就问一句，不要默认当改编。

## 1. 建骨架：只写产品边界

`toon_game_project action=init` 只创建 `PRODUCT_BRIEF.md`、`_progress.md` 和空目录，**不预建空的设计文档**（空文件会被误读成已完成）。随后只填 `PRODUCT_BRIEF.md`：

```text
- 原著：无（原创） / 《书名》
- 平台与运行时：网页 / Godot 4 Web / Unity 2022 / 移动端 …
- 玩法方向：一句话说清玩家反复做什么
- experienceProfile：system-led / narrative-led / hybrid
- targetFinish：graybox / playable-prototype / polished-vertical-slice / showcase
- 核心代入感：玩家扮演谁、追求什么、失败的代价
- 明确不做：范围外的东西
```

- 「待定」是合法状态，但立项不算完成；不要替创作者拍板平台、玩法和完成度。
- 不确定的写进「未确认假设」，后续阶段不得偷偷填成默认值。
- 已有 `PRODUCT_BRIEF.md` 时工具不会覆盖；要改就按作者原话改对应行。

## 2. 阶段与证据

| 阶段 | 证据文件 | 算完成的判据 |
| --- | --- | --- |
| 立项 | `PRODUCT_BRIEF.md` | 平台、玩法、核心代入感、experienceProfile、targetFinish 都填了且取值合法 |
| 拆书 | `analysis/SOURCE_BIBLE.md` | 仅改编需要；带原文出处的可玩冲突、场面、人物、世界规则、改编边界 |
| 概念 | `concepts/CONCEPT.md` | 玩家扮演谁、核心循环、失败与重开、与原著的关系 |
| 设计 | `design/GAME_DESIGN.md` | 世界规则、关卡与分支、选择如何改变结果、结局条件 |
| 灰盒 | `build/app/index.html` | 核心循环能从头玩通；先灰盒后美术 |
| 美术方向 | `design/ART_DIRECTION.md` | 非 graybox 才要；色板、造型、界面、镜头语言 |
| 构建 | `build/BUILD_BRIEF.md` + 可跑构建 | `# 运行` 一节能让没读过代码的人启动；有 verify 命令 |
| 验收 | `qa/verification.json` + `qa/playtest-report.md` + `qa/session.json` | 六项都是实跑 `PASS`；盲测会话与创作会话不同（同会话自审判 partial） |

`toon_game_project action=status` 给出阶段轨、下一步和诊断。每次只推进 `nextStage` 指的那个阶段；上一阶段 `partial` 时先补齐，不要跳到构建。

## 2.1 阶段模板与表单

不要每次从零手写结构，先用模板，再填判断：

- 立项：工作台「互动游戏 → 阶段」里的 PRODUCT_BRIEF 表单；或 `toon_game_stage action=brief` 读字段、`action=save_brief` 保存。保存只改对应字段，保留作者其他段落。
- 概念：`toon_game_stage action=apply stage=concept` 生成 `concepts/OPTIONS.md` 的 A/B/C 三个方向；填成差异明显的方案后，`action=choose option=B` 生成 `concepts/CONCEPT.md`。
- 其他阶段：`action=template stage=design|art|build|analysis` 取骨架，`action=apply` 落盘；已有文件不覆盖。
- 模板里的 `<待填>` 不是完成：投影会把仍含待填项的阶段判 `partial`。

## 3. 技能分工

| 阶段 | 技能 | 产物 |
| --- | --- | --- |
| 拆书 | `novel-game-analyze` | `analysis/SOURCE_BIBLE.md`（结论带原文位置） |
| 概念 / 设计 / 美术 | `game-design` 三阶段 | `CONCEPT.md` / `GAME_DESIGN.md` / `ART_DIRECTION.md` |
| 灰盒 / 构建 | `game-build` | `build/app/`、`build/BUILD_BRIEF.md`、verify 命令 |
| 验收 | `game-qa` | `qa/verification.json`、`qa/playtest-report.md`、`qa/session.json` |

编排边界：

- `game-qa` 必须在没参与编码的独立会话里做；先盲玩，再核对设计，最后跑 verify。
- 构建阶段不私自改写上游决定；要改产品边界回 `PRODUCT_BRIEF.md`，要改玩法回 `GAME_DESIGN.md`。
- 单次任务变重、并行会话反复改同一批文件时缩小范围，不降低标准；做完少量内容胜过铺满占位。

## 4. 不做与不说

- 不伪造可玩构建、截图、通关记录或 `PASS`；`NOT_RUN` 就是没跑。
- 不把「跑通流程」说成「好玩 / 数值平衡 / 版权合规 / 已达上线水准」。
- 媒体生成（美术、配音、音乐）走已安装的多媒体网关 `media_*`；插件不存密钥。付费前先列任务与参数，得到创作者确认再提交。
- 不覆盖作者已经写过的正文；工具只补缺失文件。

## 4.1 盲玩会话隔离

1. 创作会话里跑 `toon_game_qa action=brief`：生成 `qa/盲测任务.md` 与 `qa/blind-plan.json`，记录创作会话 id，不含任何设计细节。
2. 把返回的提示词发到**未参与编码的新会话**；盲测会话只读任务书与 `BUILD_BRIEF.md` 的「# 运行」。
3. 盲测会话生成验收文件后跑 `toon_game_qa action=record`，把自己的 session id 写进 `qa/session.json`。
4. 两个 id 不同才算隔离；相同会被投影判 `partial`，并提示换会话重跑。无法新建会话时，至少用工作台「画布 → 盲测与验收」复制提示词手动开新会话。

## 4.2 构建快照

可玩构建生成后，用 `toon_game_snapshot action=create` 存版本；`action=list` 查看，`action=restore` 回滚（回滚前自动备份当前构建到 `.kylin-toon/game-build-backup/`），`action=delete` 清理。默认保留最近 10 个。工作台「试玩」和「画布」上都有入口。

## 5. 工具速查

| 工具 | 用途 |
| --- | --- |
| `toon_intent` | 判断媒介与动作，给出工作台页签与入口工具 |
| `toon_game_intake` | 游戏需求入口：原创/改编、接哪个工程、阶段清单、下一步 |
| `toon_game_project` | `list` / `status` / `init` / `switch` |
| `toon_game_stage` | 阶段模板、概念三选一、PRODUCT_BRIEF 表单读写 |
| `toon_game_snapshot` | 构建快照 `list/create/restore/delete` |
| `toon_game_qa` | 盲测交接单、记录盲测会话、查看隔离状态 |
| `toon_project` | 工作区识别与 ffmpeg 就绪状态 |

常见错误：先做美术再做灰盒；把所有文档一次铺满；没有 `qa/verification.json` 就宣称完成；用「待定」当已完成。
