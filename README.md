# dsh-plugins

个人维护的 dsh（deepseek-harness）插件集合。monorepo 布局：一个子目录 =
一个独立可安装的 dsh bundle 包。

## 插件清单

| 插件 | 说明 |
|---|---|
| [kcoder-git-panel](./kcoder-git-panel) | 独立 git 工作区浮动面板：变更统计 + Codex 风格环境信息区（变更文件列表 / 工作位置·worktree 切换 / 分支选择器 / 提交或推送 / 比较分支外链）+ 任务计划列表 |
| [kcoder-stats-panel](./kcoder-stats-panel) | 会话统计图表面板：hover 输入框下方 StatsLine 缩略条 → 底部弹出自绘图表（轮/步、首 token 平均、解码速度、LLM/工具调用耗时、Token 用量、缓存命中率环），zh/en 双时长格式解析 |
| [kcoder-terminal](./kcoder-terminal) | 嵌入式终端面板：node-pty 多标签 shell、按工作区分桶、xterm.js UI，dsh web 页底部 dock（替代已退役的 Electron 宿主终端） |
| [kcoder-language](./kcoder-language) | 「强制中文回答」system-prompt section 开关包（默认 disabled，home patch 层热切换） |
| [kcoder-skills](./kcoder-skills) | 方法论技能包（适配自 KSkills，dsh 兼容清洗后物化） |
| [dsh-file-review-tab](./dsh-file-review-tab) | 文件审查 fork（origin: Lzh3070/dsh-file-review-tab）：行级红绿 diff + undo 审查 agent 产物；tsdown 构建型，lib 产物随仓提交，包名 @kcoder/file-review |
| [DSH-better-sidebar](./DSH-better-sidebar) | dsh-better-sidebar（npm 0.17.x）的 fork 源码仓：侧边栏工作台底座（文件树/CM6/预览/子代理），仅作 npm 包维护，不参与 KCoder sync |

## 安装

pnpm 的 `github:` 说明符只认仓库根为包边界，子目录插件用路径安装：

```sh
git clone git@github.com:kkutysllb/dsh-plugins.git
dsh plugin --profile web add ./dsh-plugins/kcoder-git-panel
```

或发布到 npm 后按包名安装（`dsh plugin --profile web add @kcoder/git-panel`）。
安装后重启 dsh 生效。

## 开发约定

- 每个插件目录自包含：`package.json`（含 `dsh.bundle` / `dsh.client`
  manifest）、`cordis.patch.yml`、server 入口（`entry.js`）、client 交付物
  （`client.js`）、README、tests、LICENSE。
- 零构建链插件直接提交产物（`files` 白名单覆盖产物），安装无需 `prepare`
  授权，也不会落入 git 源空壳坑。
- 写操作 RPC 必须沿用安全边界：isTrusted（loopback + trustedHosts）、
  POST-only、JSON body、execFile 无 shell 拼接、参数基础校验。
- **本仓库是 KCoder 内置插件唯一真源**（2026-08-30 迁址）：KCoder 仓的
  `bundle/` 目录是随包分发的同步副本，由 KCoder 侧
  `scripts/sync-bundles.mjs` 单向同步（dsh-plugins → bundle/，支持
  `--check` 对账断言）。改插件先改这里 → 提交推送 → 到 KCoder 跑 sync
  同步进 bundle/ 再发版（发版对账不通过会硬拦）。file-review 经
  `dsh-file-review-tab` 选择面映射为 `bundle/kcoder-file-review`
  （lib/package.json/cordis.patch.yml/README/LICENSE）；DSH-better-sidebar
  不参与 sync。
- KCoder 侧消费入口：开发态 `PROJECT_ROOT/bundle/<dir>`，打包态
  `resources/<dir>`（electron-builder extraResources），由
  kcoder-skills-bundle 物化进 web profile。
