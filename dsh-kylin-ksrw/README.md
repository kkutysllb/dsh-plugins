# dsh-kylin-ksrw

KSRW 科研工作台，作为 QiLin / dsh 的第三方可安装插件 bundle。

## 包含

- `@ksrw/core`：`/ksrw/api`、SSE、账户桥、lab 代理、reading scheduler；
- `@ksrw/desk`：科研驾驶舱 `main` 面板与工件页；
- `@ksrw/tools`：context / propose / gate / handoff / evidence / lab 等工位工具；
- `@ksrw/kernel`：项目、阶段闸门、交接单、证据、提案、论文/实验/专利数据面；
- `presets/`：研究主持 + 七工位 + AILab。

不包含桌面壳（Electron、welcome、托盘、红绿灯）与产品 runtime 打包。

## 安装

```bash
qilin plugin add dsh-kylin-ksrw
qilin plugin add @ksrw/core --from ./node_modules/dsh-kylin-ksrw/...   # 视安装器而定
```

预设：安装后运行 `node node_modules/dsh-kylin-ksrw/scripts/sync-presets.mjs`，把 8 份预设链接到用户预设根；或在 `agent-presets.roots` 指向包内 `presets/`。

## 迁移状态

见 [plans/ksrw-plugin-bundle.md](../../plans/ksrw-plugin-bundle.md)。
