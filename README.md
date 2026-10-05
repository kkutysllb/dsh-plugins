# dsh-plugins

个人维护的 dsh（deepseek-harness）插件集合。monorepo 布局：一个子目录 =
一个独立可安装的 dsh bundle 包。

全部成员插件均为**独立仓的分发镜像**：开发真源在 kkutysllb 下各自独立仓
（个别真源仓与镜像目录不同名，在清单内注明），由真源仓的
`scripts/sync-to-dsh-plugins.mjs` 单向同步落盘（`--check` 对账断言）。
本仓库只做镜像收纳与一键安装源，不做开发修改。

## 铁律：插件变更必须同步 README

**任何成员插件的新增、升级、删除，必须先同步更新本 README（「插件清单」
及受影响的说明），并把 README.md 与插件变更放进同一次提交，然后才能
commit。**

本仓以 pre-commit 钩子对违规提交硬性拦截：

- 插件子目录（`dsh-*/`）有 staged 变更而 `README.md` 未一并 staged →
  拒绝提交；
- 顶层出现 README 未登记的 `dsh-*` 插件目录 → 拒绝提交。

克隆本仓后执行一次以下命令启用门禁：

```sh
git config core.hooksPath hooks
```

## 插件清单

### 工作台 / 面板

| 插件 | 说明 |
|---|---|
| [dsh-coding-sidebar](./dsh-coding-sidebar) | 侧边栏工作台自立包（fork 自 DSH-better-sidebar 0.17.2，底面板移除）：文件树 / CM6 编辑器 / 图片·MD 预览 / 子代理，服务化扩展点；包型产物（lib/），KCoder 预置牵引依赖树。v1.0.38：页签标题 i18n 修复——新会话种子的「文件」页签与旧 explorer→editor 迁移路径写死字面量 `Files` 绕过 `t('files')`，且标题随 localStorage 持久化，故切语言 / 重渲染都无法自愈（本版一并加一次性自愈迁移 + 无路径文件窗口纳入去重） |
| [dsh-file-review-kcoder](./dsh-file-review-kcoder) | 改动审查（血缘 left0ver/dsh-file-review，MIT 署名保留，完全自立维护）：行级红绿 diff + undo 审查 agent 产物，chat turn-tail 行 + coding-sidebar 标签页；tsdown 构建型，lib 产物随仓提交 |
| [dsh-git-panel](./dsh-git-panel)（npm: @kkutysllb/dsh-git-panel） | 独立 git 工作区浮动面板：变更统计 + Codex 风格环境信息区（变更文件列表 / 工作位置·worktree 切换 / 分支选择器 / 提交或推送 / 比较分支外链）+ 任务计划列表 |
| [dsh-stats-panel](./dsh-stats-panel) | 会话统计图表面板：hover 输入框下方 StatsLine 缩略条 → 底部弹出自绘图表（轮/步、首 token 平均、解码速度、LLM/工具调用耗时、Token 用量、缓存命中率环），zh/en 双时长格式解析 |
| [dsh-terminal](./dsh-terminal)（npm: @kkutysllb/dsh-terminal） | 嵌入式终端面板：node-pty 多标签 shell、按工作区分桶、xterm.js UI，dsh web 页底部 dock（替代已退役的 Electron 宿主终端）。v1.3.0：标签前置终端图标；header 右侧显示当前活动标签**真实使用**的 shell 短名（取服务端 `shellDisplayName`，即 `$SHELL` → passwd → bash 兜底链的实际落点，客户端不按平台猜）；修复「边框痕迹粗糙」——上缘拖条由 4px 实心填色改为常态隐形/悬停胶囊，面板加 1px 上分隔线 + 10px 上圆角 + 向上投影，分隔色走 `color-mix` 从既有 token 现算（旧版硬编码 `rgba(0,0,0,.10)` 在暗色下脏成灰线）；顺带修复依赖降级卡暗色主题下不调 `applyPalette` 而呈白板；顺带修复暗色主题下终端右缘一条 15px 白杠（`vendor/xterm.css` 的 `.xterm-viewport{overflow-y:scroll}` 恒定占位，而该 xterm.css 是裁剪版、不含滚动条配色 ⇒ 默认滚动条露出；现按亮暗主题给细滚动条，track 透明露终端底色）。v1.2.2：dsh 兼容门上界 `<0.2.0` → `<1.0.0`——上游 0.2.1-alpha.1 下 app-boot 闸门静默跳过整个 bundle（终端整块消失无报错）的修复 |

### 技能 / 内容生成

| 插件 | 说明 |
|---|---|
| [dsh-skills-bundle](./dsh-skills-bundle) | 方法论技能包（适配自 KSkills，dsh 兼容清洗后物化；QiLin 双通道）。**v1.0.4**：退役 6 个非编码技能（image/video/music/podcast-generation、comic、deep-research），注册面 37 → 31；同时修复真源仓同步脚本的递归排除缺陷——office 批（docx/pptx/xlsx/pdf/microsoft-foundry）的 201 文件脚本载荷此前被静默剔除出镜像，本次首次随包分发 |
| [dsh-skills-stock](./dsh-skills-stock) | A 股量化投研技能包（适配自 KStock 2.0 桌面端精选技能体系）：41 个技能（个股研究 / 选股与策略 / **场景编排** / 品种专项 / 市场全景 / 数据查询 / 图表呈现）注册为 runtime skill；策略库·因子库·选股库·**报告库**四库工作区（18 个 agent 工具，report_archive 支持 content_path 文件通道）+ 侧边栏「投研工作台」四 tab + 设置页数据源凭据配置（**多数技能需配置 Tushare Token 与问财 API Key**，纯计算类技能免密钥）。v1.3.0 补丁：修复库工具成功输出模型不可见的接口缺陷（render 需 ContentBlock 部件形状 + lossless 返回）；通告新增探测资产纪律（连通性验证走只读工具）。**v1.3.1**：上述修复正式发版 |
| [dsh-super-ppts](./dsh-super-ppts) | 演示文稿超级插件 1.5.0：三交付线——可编辑 PPTX（pptx-designer 引擎 + 结构机检/渲染验收闭环）、HTML 在线演示（8 形态）、参考图重建；内置 16 方向模板（真 deck 缩略图 + 完整样例预览）+ 用户模板库 + 侧边栏任务面板（大纲确认闸门） |
| [dsh-animations](./dsh-animations) | 动效技能包：8 个 HTML 动画技能（PPT 翻页 / 流程图 / 协议可视化 / 架构图 / 学霸笔记 / 卡片剧场 / 视频分镜 / 手机 UI）注册为 runtime skill + 左侧栏「动效技能库」工作台（技能选择 + 工作区菜单 + 一键投递会话），案例画廊随 docs/ 分发。v1.2.4：dsh 兼容门上界 `<0.2.0` → `<1.0.0`——上游 0.2.1-alpha.1 下 app-boot 闸门静默禁用插件的修复 |
| [dsh-video-generator](./dsh-video-generator)（npm: dsh-video-generator） | 短视频/AI 短剧/漫剧生成管线：三段交接（story→script→storyboard）+ 评审重拍闭环（抽帧评分，≤2 自动重拍）+ gate 三态真实现（vgen_provide 产物注入）+ 设置页双 tab（工坊产物预览 / 通道三要素自配官方中转皆可）+ 竖屏 9:16 成片 mp4+SRT（云 TTS 配音 / crop 消黑边）+ 「漫剧导演」预设（疗愈绘本题材包） |

### kylin 智能基座

| 插件 | 说明 |
|---|---|
| [dsh-kylin-memory](./dsh-kylin-memory)（npm: dsh-kylin-memory） | 会话记忆知识图谱（SQLite）：turn 级记忆导航 / 跨会话召回 / PageRank 与社区发现 / 向量检索 + FTS5；记忆全生命周期管理（失效 / 作用域 / 实体归一化 / 审计）；v0.1.3：插件详情页设置表单——保留轮数/维护节奏/召回上限/语义阈值四个参数 volatile live-edit，免重启生效 |
| [dsh-kylin-vibe](./dsh-kylin-vibe)（npm: dsh-kylin-vibe） | GraphRAG 知识库：把显式授权的本地语料增量索引成知识图谱（实体-关系-社区），以 agent 工具暴露供模型做关系性/全局性推理检索；抽取流护栏（LLM 流超时熔断）+ 证据审查更正闭环（滑选驱动）+ 知识库管理面（文本入库 / 目录导入 / 来源管理表·停用·删除 / 变更同步 / 召回测试）+ 浏览页双列布局（全量图谱视图：世界坐标力导向·枢纽标签·类型过滤·搜索定位·节点详情卡 + 可拖拽分栏）+ 二进制文档与图片多模态抽取（DOCX/PPTX/XLSX/PDF/图片）+ 抽取模型跟随会话（建库选定即生效，无需手改插件配置）+ global 模式 LLM 分批打分 + local 排序重做（种子秩加权+凸组合，MRR 达结构上限 97.4%）+ 0207 契约补齐（健康度灯/dry-run 预估卡/KB 遗忘/隔离区重放/社区列表/点击边看原文/审查排除过滤/cwd 自动选库）+ 薄 d.ts 类型面 |
| [dsh-kylin-automation](./dsh-kylin-automation)（npm: dsh-kylin-automation） | 定时任务：可复用、可边界化的编码任务按一次性 / 固定间隔 / 每天 / 每周计划投递到全新根 Agent 会话独立执行；Web 侧边栏独立页面与 Agent 工具双入口管理，运行历史持久可审计 |

### 远程运维

| 插件 | 说明 |
|---|---|
| [dsh-ssh-remote](./dsh-ssh-remote)（npm: dsh-ssh-remote） | SSH 远程运维/开发工具套件（真源仓为 dsh-kylin-ssh-tunnel）：11 个工具（run/read/write/edit/glob/grep/push/pull/hosts/status/target）+ ControlMaster 连接层（失败快返回、ControlPersist daemon 化语义正确处理）+ 三种登录方式（key / agent / 密码——AES-256-GCM 加密凭据库 + SSH_ASKPASS 助手，自管密钥；2FA 不支持）+ 远程目标绑定（本地工作区 ↔ 远程目录：browse 逐层列举 / ssh_target 切换 / 默认 cwd / 系统提示实时注入）+ 设置页（DSH 原生配方：测试连接 / 设为目标 / ★ 当前目标徽章）+ 远端执行世界引导（provision 脚本与 API）。v0.1.4：dsh 兼容门上界 `<0.2.0` → `<1.0.0`——上游 0.2.1-alpha.1 下 app-boot 闸门静默跳过整个 bundle 的修复（与 dsh-terminal v1.2.2 同因） |

## 安装

pnpm 的 `github:` 说明符只认仓库根为包边界，子目录插件用路径安装：

```sh
git clone git@github.com:kkutysllb/dsh-plugins.git
dsh plugin --profile web add ./dsh-plugins/dsh-git-panel
```

或发布到 npm 后按包名安装（`dsh plugin --profile web add dsh-git-panel`）。
安装后重启 dsh 生效。

## 开发约定

- **铁律**：成员插件变更（新增 / 升级 / 删除）必须先同步本 README 再提交，
  由 `hooks/pre-commit` 钩子硬性拦截（见上文「铁律」一节；克隆后执行
  `git config core.hooksPath hooks` 启用）。
- 每个插件目录自包含：`package.json`（含 `dsh.bundle` / `dsh.client`
  manifest）、`cordis.patch.yml`、server 入口（`entry.js`）或包型产物
  （`lib/`）、client 交付物（`client.js`）、README、tests、LICENSE。
- 零构建链插件直接提交产物（`files` 白名单覆盖产物），安装无需 `prepare`
  授权，也不会落入 git 源空壳坑。
- 写操作 RPC 必须沿用安全边界：isTrusted（loopback + trustedHosts）、
  POST-only、JSON body、execFile 无 shell 拼接、参数基础校验。
- **自研包真源在各自独立仓**（2026-09-01 迁址）：改插件先改独立仓 →
  commit + 发 npm → 跑该仓 `scripts/sync-to-dsh-plugins.mjs` 镜像到本仓 →
  同步更新本 README → 提交推送。本仓不再承载自研包的开发修改。
- 三级分发链：独立仓（真源）→ 本仓（镜像收纳）→ KCoder 仓 `bundle/`
  （随包分发的同步副本，由 KCoder 侧 `scripts/sync-bundles.mjs` 单向
  同步，支持 `--check` 对账断言；发版对账不通过会硬拦）。
- KCoder 侧消费入口：开发态 `PROJECT_ROOT/bundle/<dir>`，打包态
  `resources/<dir>`（electron-builder extraResources），由
  kcoder-skills-bundle 物化进 web profile。
