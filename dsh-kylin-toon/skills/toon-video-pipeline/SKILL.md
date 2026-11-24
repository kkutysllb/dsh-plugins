---
name: toon-video-pipeline
description: KToon 短剧漫剧制作流水线（Hyperframes 渲染栈）。用于把一集从分镜做到可审样片/成片：核对镜头与 MOTION 契约、用多媒体网关出素材、生成/编辑 Hyperframes HTML 工程、用官方 Studio 预览、渲染 MP4 并做技术验证。用户说「开始制作这一集」「出样片/成片」「打开 Studio」「渲染这一集」「检查能不能交付」时使用。
---

# KToon 视频制作流水线（Hyperframes）

作品全在本集文件里，界面是投影。新工程一律走 **Hyperframes：HTML 工程 → 浏览器逐帧 → MP4**；自研 ffmpeg 装配只保留给已有媒体工程，不再用于新集。

## 0. 开工前

1. 跑 `toon_project` 看工作区识别到什么、ffmpeg 是否就绪。
2. 读 `剧本.md`、`视觉设定.md`、`分镜.md`、`MOTION.md`；缺哪份如实说，不代写未要求的阶段。
3. 跑 `toon_motion action=validate`。有阻断先改分镜或 Motion；没有 MOTION 就先 `action=template` 补保持/替换/证据。
4. 动文档前 `toon_drama_version action=create` 存一版；恢复会生成新 vN，不删除后续历史。
5. 检查渲染栈：`toon_composition action=status`。没有 composition 就从分镜生成；CLI 缺失时提示安装 `hyperframes@0.9.81`，不要偷偷回退到旧装配。
6. 媒体网关：`media_health`。未就绪就去「设置 → 多媒体网关」配置，不改走别的 HTTP 接口。

## 1. 镜头与 Motion 契约

- 镜头 ID 全篇唯一；时长用秒；写清**入场/出场**状态与转场。
- MOTION 的保持/替换/时间轴/证据必须与分镜逐镜对得上；`toon_shot_qc` 阻断项先修。
- 镜头 HTML 工程是执行层：一个镜头一个 `compositions/<id>.html`，由 `index.html` 挂载。

## 2. 生成素材（付费，先确认）

1. `media_models` 拉模型/参数；`toon_route action=plan` 给候选与理由。
2. 在对话里列**任务清单 + 模型/参数/预计路径**，等创作者明确确认。
3. `media_generate`（长任务 `wait=false`，`media_job` 轮询）；`toon_production action=track_job` 登记。
4. 产物放 `剧集/<EP>/制作成果/`，或导入 `composition/assets/`；文件名带镜头 ID。
5. 失败不静默重试；说清错误码与可恢复动作，不自行升级预算/模型。

## 3. HTML 工程与 Studio（默认路径）

```text
剧集/<EP>/composition/
  index.html              # 根时间轴：data-duration / data-width / data-height / data-fps
  compositions/S01-01.html # 一个镜头一个场景，<template> 包住样式/标记/脚本
  assets/                 # 视频/音频/字体/GSAP
```

1. `toon_composition action=scaffold`：按分镜生成最小可渲染工程（已有则不覆盖）。
2. `toon_composition action=status`：跑官方 lint，先修 error。
3. `toon_composition action=studio`：启动官方 Studio，并返回**反代地址**。
4. **用引擎自带的右栏 Browser 打开反代地址**；不要打开系统浏览器，也不要自己写 iframe（Studio 原头禁止跨源嵌入，反代已剥掉）。
5. 在 Studio 里改文字/时间/素材；保存的是同一组源文件。改完重新 `status`。

硬约束（Hyperframes 契约）：

- 每个计时元素有 `class="clip"`、`data-start`、`data-duration`（秒）；根时长是 `data-duration`；
- 场景文件放到 `<template>` 里；场景根、宿主、`window.__timelines["<id>"]` 三者 id 一致；
- 只用时间函数，禁止 `Date.now()`、未播种随机、网络请求、定时器、`repeat:-1`；
- 不要 tween `.clip` 的 `display/visibility/autoAlpha`；不要对 GSAP 控制的元素写 CSS transform；
- 视频/音频素材路径 `assets/...`；字体要么用内置可解析字体，要么 `@font-face` 指向 `assets/fonts/`；
- 不手写 named effect/transition/caption 样式前，先查 `npx hyperframes` 的 registry/文档。

## 4. 渲染与验证

`toon_composition action=render` 调 `hyperframes render`（`--no-wait --strict`），输出默认 `制作成果/成片/<EP>-html.mp4`。渲染后用 ffprobe 核对宽/高/fps/时长/视频流，报告写 `.kylin-toon/qc/<EP>-html-render.json`。

**渲染退出 0 不等于交付通过**：验证未通过时逐项说明，不宣称可交付。需要改入出点/转场时改 HTML 工程再渲染，不在成片上二次压片。

旧工程如果只有媒体片段、没有 HTML 工程，才用 `toon_assemble`（ffmpeg 装配 + ffprobe 验证）；不要用它替代新集的 Hyperframes 路径。

## 5. 质检与交付

- `toon_shot_qc`：镜头契约与提示词断链；
- `toon_audio_qc`：语速/停顿/重叠/语速变异（<0.18 判「念课文」）；
- `toon_gate`：G0 版权 → G1 分镜/Motion → G2 关键帧 → G3 样片 → G4 成片；
- 节奏配方：`toon_recipe action=list` 选 1–2 个，`apply` 只写 `recipes/<id>.md`，不改分镜。

成片在 `剧集/<EP>/制作成果/成片/`。交付前最后跑 `toon_gate`，把「通过了什么 / 还剩什么风险」讲清楚。
