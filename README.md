# dsh-plugins

个人维护的 dsh（deepseek-harness）插件集合。monorepo 布局：一个子目录 =
一个独立可安装的 dsh bundle 包。

自研包（dsh-coding-sidebar / dsh-file-attach / dsh-file-review-kcoder / dsh-git-panel /
dsh-language-bundle / dsh-skills-bundle / dsh-stats-panel / dsh-terminal）
均为**独立仓的分发镜像**：开发真源在 kkutysllb 下同名独立仓，由各仓的
`scripts/sync-to-dsh-plugins.mjs` 单向同步落盘（`--check` 对账断言）。
本仓库只做镜像收纳与一键安装源，不做开发修改。

## 插件清单

| 插件 | 说明 |
|---|---|
| [dsh-coding-sidebar](./dsh-coding-sidebar) | 侧边栏工作台自立包（fork 自 DSH-better-sidebar 0.17.2，底面板移除）：文件树 / CM6 编辑器 / 图片·MD 预览 / 子代理，服务化扩展点；包型产物（lib/），KCoder 预置牵引依赖树 |
| [dsh-file-attach](./dsh-file-attach)（npm: @kkutysllb/dsh-file-attach） | 文件/文件夹附件：浏览器选文件 + server 定位链（会话 cwd 下搜索还原真实路径）+ 发送注入 [附件]name|path 路径行（agent 按路径读取），气泡渲染附件卡片；图片链路零参与（粘贴/拖拽/发送全走原生） |
| [dsh-file-review-kcoder](./dsh-file-review-kcoder) | 改动审查（血缘 left0ver/dsh-file-review，MIT 署名保留，完全自立维护）：行级红绿 diff + undo 审查 agent 产物，chat turn-tail 行 + coding-sidebar 标签页；tsdown 构建型，lib 产物随仓提交 |
| [dsh-git-panel](./dsh-git-panel)（npm: @kkutysllb/dsh-git-panel） | 独立 git 工作区浮动面板：变更统计 + Codex 风格环境信息区（变更文件列表 / 工作位置·worktree 切换 / 分支选择器 / 提交或推送 / 比较分支外链）+ 任务计划列表 |
| [dsh-stats-panel](./dsh-stats-panel) | 会话统计图表面板：hover 输入框下方 StatsLine 缩略条 → 底部弹出自绘图表（轮/步、首 token 平均、解码速度、LLM/工具调用耗时、Token 用量、缓存命中率环），zh/en 双时长格式解析 |
| [dsh-terminal](./dsh-terminal)（npm: @kkutysllb/dsh-terminal） | 嵌入式终端面板：node-pty 多标签 shell、按工作区分桶、xterm.js UI，dsh web 页底部 dock（替代已退役的 Electron 宿主终端） |
| [dsh-language-bundle](./dsh-language-bundle) | 「强制中文回答」system-prompt section 开关包（默认 disabled，home patch 层热切换） |
| [dsh-skills-bundle](./dsh-skills-bundle) | 方法论技能包（适配自 KSkills，dsh 兼容清洗后物化） |
| [dsh-super-ppts](./dsh-super-ppts) | 演示文稿超级插件（开发真源 kkutysllb/dsh-super-ppts 的分发镜像，由其 scripts/sync-to-dsh-plugins.mjs 同步，--check 对账）：可编辑 PPTX（pptx-designer 引擎+渲染验收闭环）与 HTML 在线演示（8 形态）双交付线 + 「演示文稿专家」Agent 预设 |
| [dsh-animations](./dsh-animations) | 动效技能包（开发真源 kkutysllb/dsh-animations 的分发镜像，由其 scripts/sync-to-dsh-plugins.mjs 同步，--check 对账）：8 个 HTML 动画技能（PPT 翻页 / 流程图 / 协议可视化 / 架构图 / 学霸笔记 / 卡片剧场 / 视频分镜 / 手机 UI）注册为 runtime skill + 「动画演示专家」Agent 预设，案例画廊随 docs/ 分发 |

## 安装

pnpm 的 `github:` 说明符只认仓库根为包边界，子目录插件用路径安装：

```sh
git clone git@github.com:kkutysllb/dsh-plugins.git
dsh plugin --profile web add ./dsh-plugins/dsh-git-panel
```

或发布到 npm 后按包名安装（`dsh plugin --profile web add dsh-git-panel`）。
安装后重启 dsh 生效。

## 开发约定

- 每个插件目录自包含：`package.json`（含 `dsh.bundle` / `dsh.client`
  manifest）、`cordis.patch.yml`、server 入口（`entry.js`）或包型产物
  （`lib/`）、client 交付物（`client.js`）、README、tests、LICENSE。
- 零构建链插件直接提交产物（`files` 白名单覆盖产物），安装无需 `prepare`
  授权，也不会落入 git 源空壳坑。
- 写操作 RPC 必须沿用安全边界：isTrusted（loopback + trustedHosts）、
  POST-only、JSON body、execFile 无 shell 拼接、参数基础校验。
- **自研包真源在各自独立仓**（2026-09-01 迁址）：改插件先改独立仓 →
  commit + 发 npm → 跑该仓 `scripts/sync-to-dsh-plugins.mjs` 镜像到本仓 →
  提交推送。本仓不再承载自研包的开发修改。
- 三级分发链：独立仓（真源）→ 本仓（镜像收纳）→ KCoder 仓 `bundle/`
  （随包分发的同步副本，由 KCoder 侧 `scripts/sync-bundles.mjs` 单向
  同步，支持 `--check` 对账断言；发版对账不通过会硬拦）。
- KCoder 侧消费入口：开发态 `PROJECT_ROOT/bundle/<dir>`，打包态
  `resources/<dir>`（electron-builder extraResources），由
  kcoder-skills-bundle 物化进 web profile。
