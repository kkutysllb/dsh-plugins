---
name: toon-hyperframes
description: 用 Hyperframes 的 HTML 工程、官方 Studio 与渲染器制作/修改短剧漫剧镜头。用于创建 composition/、打开 Studio、修 lint、渲染 MP4、做技术验证，或从旧的 ffmpeg 时间线迁移。用户说「用 Hyperframes」「HTML 工程」「打开 Studio 编辑器」「渲染这一集」「迁移时间线」时使用。
---

# Hyperframes：HTML 工程、Studio、渲染

KToon 的短剧渲染栈与编辑器外壳就是 Hyperframes；不再自研时间线和 ffmpeg 装配（旧工程保留 `toon_assemble` 兼容）。

## 1. 工程形状

```text
剧集/<EP>/composition/
  index.html
  compositions/<shot>.html
  assets/
  hyperframes.json
```

- `index.html` 是根 composition：`data-composition-id="main"`、`data-duration`、`data-width/height`、`data-fps`；每个镜头一个宿主 `data-composition-src="compositions/<shot>.html"`，带 `data-start/data-duration`。scaffold 会把文件名命中镜头 ID 的 `制作成果/片段` 视频复制到 `assets/media/` 并嵌成 `<video muted>`；没有素材的镜头用标题卡占位。
- 本集有 `剪辑单.md` 时，scaffold 优先用对应镜头的 `源/入点/出点/输出起点`，视频块写 `data-media-start`，宿主时长按出点减入点；没有剪辑单行才回落到分镜时长。
- `配音/`、`音乐/`、`音效/` 音频复制到 `assets/audio/`，在根时间轴挂独立 `<audio>`；分镜视频默认 muted，避免和音轨打架。
- 场景文件全部放 `<template>`；场景根 `#root` 的 `data-composition-id` 与宿主 id、`window.__timelines[id]` 一致。
- 计时元素 `class="clip"` + `data-start` + `data-duration`（秒）。时间必须是确定函数：无 `Date.now()`、无未播种随机、无网络、无定时器、无 `repeat:-1`。
- 不 tween `.clip` 的 `display/visibility/autoAlpha`；不写 CSS transform 到 GSAP 控制的元素。
- 素材路径 `assets/...`；字体用内置可解析字体或本地 `@font-face`。本地视频用 `media.autoProxy=false`，否则 Hyperframes 的 browser-safe codec 代理会 422。

## 2. 工具流程

| 步骤 | 调用 | 说明 |
| --- | --- | --- |
| 检查 | `toon_composition action=status` | 官方 lint + 分镜镜头覆盖（缺宿主/多宿主）；有 error 先修 |
| 修复 | `toon_composition action=repair` | 旧场景的 bar/title/line 去掉 clip 计时，消除 too_dense 警告 |
| 生成 | `toon_composition action=scaffold` | 从分镜生成；已有不覆盖；每个场景只保留 1 个计时元素 |
| 编辑器 | `toon_composition action=studio` | 返回反代地址；固定 `--no-open`，只开引擎 Browser |
| 打开 | 引擎自带右栏 Browser | 打反代地址；**不用系统浏览器/自写 iframe** |
| 渲染 | `toon_composition action=render` | `hyperframes render --no-wait --strict` + ffprobe |
| 停止 | `toon_composition action=stop` | 停 Studio 与反代 |

Studio 原服务带 `frame-ancestors 'self'` / `X-Frame-Options: SAMEORIGIN`，跨源无法嵌入；`studio` 启动的本地反代会剥掉这两个头并转发 HTTP/WebSocket，所以只能用引擎 Browser 打开反代地址。反代注入默认中文、可切英文的界面层（右下角 EN/中文）；左上角只显示 `dsh-kylin-toon`，右上角「安装桌面版」按钮已移除。

## 3. 迁移与兼容

- 新集默认 Hyperframes；`分镜.md`/`MOTION.md` 仍是契约，HTML 工程是执行层。
- 旧工程的媒体片段可以用 `toon_assemble` 出片；不要把旧时间线再扩展成新编辑器。
- 改 Studio 前先 `toon_drama_version action=create`：版本会快照 composition 的 HTML/JSON（不含 assets），恢复会生成新版本。
- 渲染验证：宽度/高度/fps/时长/视频流（有音轨时音轨）与 expected 对账；报告 `.kylin-toon/qc/<EP>-html-render.json`。
- 技术通过、视觉审阅、用户采用分开说；不把渲染成功当审美通过。

## 4. 归属

Hyperframes 0.9.81，Apache-2.0（heygen-com/hyperframes）。Studio 时间线吸附逻辑部分来自 OpenReel Video（MIT），保留其上游声明。
