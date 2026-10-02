# AGENTS.md

本仓是 dsh 插件集合的镜像收纳仓：一个子目录 = 一个独立可安装的 bundle 包。
所有成员插件的开发修改都在各自独立仓完成，经真源仓的
`scripts/sync-to-dsh-plugins.mjs` 同步落盘到本仓，本仓不做开发修改。

## 铁律（必须遵守）

成员插件有任何变更（新增 / 升级 / 删除），必须先同步根 README.md 的
「插件清单」与相关说明，并将 README.md 与插件变更放进同一次提交。
README 未同步的插件提交会被 `hooks/pre-commit` 钩子直接拒绝——任何
agent 在本仓执行 commit 前，先确认 README.md 已在本次暂存中。

更多约定（安装、分发链、RPC 安全边界）见 [README.md](./README.md)。
