# dsh-plugins

个人维护的 dsh（deepseek-harness）插件集合。monorepo 布局：一个子目录 =
一个独立可安装的 dsh bundle 包。

## 插件清单

| 插件 | 说明 |
|---|---|
| [kcoder-git-panel](./kcoder-git-panel) | 独立 git 工作区浮动面板：变更统计 + Codex 风格环境信息区（变更文件列表 / 工作位置·worktree 切换 / 分支选择器 / 提交或推送 / 比较分支外链）+ 任务计划列表 |

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
- 与 KCoder 仓库 in-box bundle（`bundle/kcoder-git-panel`）双向同步：
  KCoder 侧为开发真源，升版后整体拷贝本仓库对应子目录再提交。
