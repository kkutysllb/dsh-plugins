# dsh-kylin-toon

KToon 创作台：装进 **DSH / 麒麟（QiLin）** 的多产品工作台插件。作品是工作区里的普通文件；界面挂在原生对话旁边，不替换宿主 UI；媒体生成由用户已安装的多媒体网关插件（`media_*`）提供。

| 工作台 | 识别 | 主要能力 |
| --- | --- | --- |
| 小说 | `正文.md` / `正文/` `大纲/` `设定/` … | 文件树、Markdown 预览与原文编辑、版本校验保存 |
| 短剧漫剧 | `剧集/<EP>/`、`short-drama.json`；或根目录 `第N集.md` + `第N集分镜脚本.md` + `成片/`（连续剧工程）；或 `03-镜头表.md` + `shots/`（MV/短片工程） | 本集文档 + MOTION 契约、镜头契约投影、版本快照、节奏配方、闸门；渲染/编辑器走 Hyperframes HTML 工程 + 官方 Studio |
| 互动游戏 | `game-adaptations/<project>/` | 需求入口、八阶段证据轨、阶段表单/概念三选一、构建快照回滚、沙箱试玩、文稿分组、可平移画布 |
| 视频解说 | `video-recaps/<project>/` | 成片/剪后/原片预览、文稿 |

## 安装

首选由宿主插件管理器安装（本地目录或 npm tgz）：

```bash
# 本机目录（开发）
# 在宿主里调用 plugin_manager: action=install_bundle, target=<本目录绝对路径>

# 发布包
pnpm pack   # 产出 dsh-kylin-toon-0.1.0.tgz
# plugin_manager: action=install_bundle, target=/abs/path/dsh-kylin-toon-0.1.0.tgz
```

`package.json` 同时声明 `dsh.bundle.patch` 与 `qilin.bundle.patch`，两端加载同一份 `cordis.patch.yml`。客户端源码按 DSH 裸名（`@deepseek-ai/*`）加载；麒麟端由 client-modules 的别名表映射到 `@qilin-agent/*`。

## 使用

1. 在会话工作区里写出创作文件（例如 `剧集/EP001/剧本.md`）；
2. 刷新页面后，原生对话左侧出现 KToon 创作台；没有创作文件时它完全不占位置；
3. 换页签、选文件、预览/原文编辑；保存走版本校验，磁盘更新时提示冲突而不是覆盖；
4. 收起后右下角留一个小入口，选择按工作区记住。

在对话里可以直接说「用 toon-workbench 看一下目录约定」「开始制作这一集」，Agent 会加载随包技能 `toon-workbench` / `toon-drama-director` / `toon-video-pipeline` / `toon-hyperframes` / `toon-game`。

## 互动游戏入口

一句「把这本书改编成游戏」先落到 `toon_game_intake`：判断是不是游戏需求、原创还是改编、接哪个工程，再给出阶段清单与下一步。确认后才建目录：

```text
game-adaptations/<项目>/
├── PRODUCT_BRIEF.md          # 立项：平台、玩法、完成度、不做的事
├── analysis/SOURCE_BIBLE.md  # 仅改编：带原文出处的拆书
├── concepts/CONCEPT.md       # 概念：核心循环、失败与重开
├── design/GAME_DESIGN.md     # 设计：规则、关卡、分支、结局
├── design/ART_DIRECTION.md   # 灰盒过关后再做
├── build/app/index.html      # 可跑灰盒 / 构建
├── build/BUILD_BRIEF.md      # 运行方式、verify 命令、限制
├── qa/verification.json      # 六项实跑 PASS 才算验收
├── qa/playtest-report.md
└── _progress.md
```

阶段轨：立项 → 拆书 → 概念 → 设计 → 灰盒 → 美术方向 → 构建 → 验收。界面只认文件证据：缺文件、占位词（待定/TBD/待填）都不算完成；`targetFinish=graybox` 时跳过美术方向。

游戏页签下有「试玩 / 阶段 / 文稿 / 画布」：阶段页含 PRODUCT_BRIEF 表单、概念三选一、阶段模板与盲测交接；试玩页含构建快照条；画布页可平移缩放查看阶段、文稿、构建、快照与盲测节点。验收要求盲测会话与创作会话不同，同会话自审会被判未完成。

## 视频制作（KToon 保留项）

| 工具 | 作用 |
| --- | --- |
| `toon_shot_qc` | 镜头 ID、时长、入场/出场跨镜衔接、转场白名单、提示词断链；报告写到 `.kylin-toon/qc/` |
| `toon_assemble`（legacy） | 按入出点裁剪镜头、逐切点转场（cut/fade/dissolve/wipeleft/slideup/flash）、统一画幅/帧率；本机 ffmpeg |
| `toon_audio_qc` | 逐段语速、停顿、重叠；语速变异 < 0.18 判「念课文」；表演风格是否接线 |
| `toon_route` | 媒体模型 auto/pin：实测成功率与延迟打分择优，pin 不被覆盖 |
| `toon_gate` | G0 立项/版权 → G1 分镜/Motion → G2 关键帧 → G3 样片 → G4 成片 |
| `toon_motion` | Motion.md 模板/落盘/校验；时间轴与分镜逐镜对账 |
| `toon_drama_version` | 本集源文件版本 create/list/restore（恢复建新 vN） |
| `toon_recipe` | 10 个短剧节奏配方 list/get/apply |
| `toon_composition` | Hyperframes HTML 工程：status/scaffold/repair/studio/render/stop；Studio 反代供引擎 Browser，默认中文界面 |
| `toon_template` | 短剧模板包 create/list/get/apply（结构支持分镜/镜头表；kt-template.json + TEMPLATE.md + sha256） |
| `toon_recreate` | 参考复刻计划 plan/read（保持/替换/表示/4 个同刻比对） |
| `toon_production` | 只更新界面投影：打开区块、聚焦镜头、设定顺序、登记任务；无文件/网络/计费副作用 |
| `toon_novel_init` | 从零建小说结构（灵感/架构/世界观/人物/大纲/正文/追踪），只补缺失文件 |
| `toon_novel_chapter` | 章节四态（蓝图/草稿/审稿/定稿）、从大纲新建、装配本章上下文 |
| `toon_novel_project` | 多书：列出/切换激活的小说项目 |
| `toon_novel_import` | 导入 .txt/.md 现成小说，识别章节写入正文与大纲 |
| `toon_novel_world` | 世界观条目增改删（六类） |
| `toon_novel_character` | 人物卡新增/合并/删除 |
| `toon_novel_task` | 生成本章写作任务书到 `章节/第N章/写作任务.md` |
| `toon_novel_finalize` | 定稿门：有审稿且无阻断才复制草稿为定稿 |
| `toon_novel_review` | 按规则生成章节审稿单到 `章节/第N章/审稿.md` |
| `toon_novel_publish` | 汇总发布资料到 `发布资料.md`（缺项留空） |
| `toon_novel_adapt` | 输出 `改编计划.md`：人物/世界观/章节→集数 |
| `toon_novel_status` | 小说阶段完成度、下一阶段与缺口 |
| `toon_intent` | 判断用户需求是小说/短剧/游戏/解说/参考片，以及新建/续写/修改/拆解/发布/改编；返回工作台页签与入口工具 |
| `toon_game_intake` | 游戏需求入口：原创/改编、接哪个工程、阶段证据清单与下一步（只读） |
| `toon_game_project` | 游戏工程 `list/status/init/switch`；阶段只认文件证据 |
| `toon_game_stage` | 阶段模板、概念三选一、PRODUCT_BRIEF 表单读写 |
| `toon_game_snapshot` | 构建快照 `list/create/restore/delete`，回滚前自动备份 |
| `toon_game_qa` | 盲测交接单、记录盲测会话、查看隔离状态 |
| `toon_project` | 只读状态：识别到哪些工程、剧集、ffmpeg 是否就绪 |
| `toon_reference_intake` | 登记参考片（本地视频）：体检、来源备注 |
| `toon_reference_fetch` | 用本机 yt-dlp 下载在线参考片并登记 |
| `toon_reference_transcript` | 写入转写分段（来自多媒体网关 ASR 或字幕） |
| `toon_reference_style_refs` | 标记关键帧为定妆照/视觉定调风格参考（只用风格，不复用构图） |
| `toon_reference_export` | 导出参考拆解 + 镜头表 + 方案到 `参考视频/参考拆解.md` |
| `toon_reference_reset` | 清除当前参考片（归档旧状态、删关键帧） |
| `toon_reference_analyze` | 拆参考片结构：ffmpeg 场景切点 → 镜窗 → 节奏/开场钩子 → 结构标签 → 关键帧 |
| `toon_reference_plans` | 提交 2–3 张同款方案（keep=保留结构 / replace=换内容） |
| `toon_reference_choose` | 记录创作者选定的方案（必须明确确认，不能代选） |
| `toon_reference_rights` | 版权口径：self / licensed / structure-only（必须明确确认） |
| `toon_reference_status` | 只读档案与 G0 就绪情况 |

媒体生成**不在本插件内**：出图、出视频、配音、配乐调用已安装的多媒体网关插件（如 `dsh-kylin-media` 的 `media_*`）。插件不保存供应商密钥，也不发起供应商 HTTP 调用。付费前必须先在对话里预览参数并得到创作者确认。

## HTTP 面

全部挂在 `/kylin-toon`，只接受回环 Host、同源、非跨站请求；路径限制在创作目录内。

| 端点 | 说明 |
| --- | --- |
| `GET /kylin-toon/workspace?sessionId=` | 文件树、四类工程识别 |
| `GET/PUT /kylin-toon/file?...&path=` | 读/写文本，PUT 带 `baseVersion`，冲突 412 |
| `GET /kylin-toon/media?...&path=` | 媒体字节流，支持 Range |
| `GET /kylin-toon/drama?episode=` | 本集投影 + 诊断 + 闸门 |
| `GET/POST /kylin-toon/drama/motion` | Motion 契约读/生成/校验 |
| `GET/POST /kylin-toon/drama/versions` | 本集版本列表/创建/恢复 |
| `GET/POST /kylin-toon/drama/recipes` | 节奏配方列表/生成建议 |
| `GET/POST /kylin-toon/drama/composition` | HTML 工程状态/生成/Studio/渲染 |
| `GET/POST /kylin-toon/drama/templates` | 模板包列表/创建/套用 |
| `GET/POST /kylin-toon/drama/recreate` | 复刻计划生成/读取 |
| `GET /kylin-toon/gates?episode=` | 交付闸门 |
| `GET /kylin-toon/game?project=` | 游戏工程列表、激活项与八阶段投影 |
| `POST /kylin-toon/game` | `action=init/switch`：建骨架或切换激活工程 |
| `GET/POST /kylin-toon/game/brief` | PRODUCT_BRIEF 表单读写 |
| `GET/POST /kylin-toon/game/stage` | 阶段模板、概念方案与选定 |
| `GET/POST /kylin-toon/game/snapshots` | 构建快照列表、创建、回滚、删除 |
| `GET/POST /kylin-toon/game/qa` | 盲测交接单、盲测会话记录、隔离状态 |
| `GET /kylin-toon/game-preview/<id>/...` | 可玩构建沙箱（CSP 收紧） |
| `GET /kylin-toon/intents?since=` | 生产投影轮询 |
| `GET /kylin-toon/client-status` | 客户端挂载/布局诊断（不含任何作品内容） |
| `GET /kylin-toon/health` | 健康检查 |

## 边界

- 不建数据库：界面状态只存在浏览器/会话内存，作品只存在文件里；
- 不替代确认：付费媒体任务必须由创作者在对话里明确确认；
- 不抢宿主 UI：只注册 `shell.overlay` 与一个 session 作用域子座席；
- 不改写上游创作方法：随包四套上游技能保持原文，只在加载时前置「宿主桥」。

## 状态（0.1.0）

已完成：双端包骨架、四个工作台文件面、短剧投影与制作详情、互动游戏入口与八阶段证据轨、阶段表单/概念三选一/构建快照/盲测隔离/游戏画布、KToon 视频工具、技能注册（含四套上游技能）、安装验收。
计划中：无限画布、页签显隐设置、`toon_role` 子代理座席、写作实时跟随、发布流水线与 DSH 端复验。

## 许可

本包代码 MIT。`knowledge/` 下四套上游创作技能来自各自 MIT 仓库，保留其 `LICENSE` / `LICENSE.upstream` 与版本清单。

渲染栈与编辑器迁移说明见 `docs/hyperframes-migration.md`；Hyperframes 0.9.81（Apache-2.0）作为依赖安装，需要 Node ≥22、Chrome、ffmpeg。
