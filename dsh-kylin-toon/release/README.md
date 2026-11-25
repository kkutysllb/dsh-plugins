# dsh-kylin-toon 版本发布说明

本目录是 dsh-kylin-toon 的版本发布事实源：每个发布版本一份 `v<semver>.md`，与 tag 对应；`package.json` 的 `version` 是插件管理检测新版本的信号。

## 版本索引

| 版本 | 日期 | 说明 |
|---|---|---|
| [v0.1.1](v0.1.1.md) | 2026-11-25 | 非标准短剧工程（自定义文档名、嵌套素材目录）也显示本集文档与素材；分镜未识别时不再整页空白 |
| [v0.1.0](v0.1.0.md) | 2026-11-25 | 首个发布：小说 / 短剧漫剧 / 互动游戏 / 视频解说四个本地文件工作台；Motion 契约、版本快照、模板包、复刻计划、Hyperframes HTML 工程与官方 Studio |

## 发版约定

1. `package.json` bump `version`；
2. `npm test` 全绿、`npm run build` 通过；
3. 写 `release/vX.Y.Z.md`（版本信息 / 新增 / 变更 / 修复 / 兼容性 / 验证）；
4. 提交并打 tag；
5. 推送源仓与镜像仓；
6. npm 发布由维护者手动执行。
