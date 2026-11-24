---
name: toon-reference
description: 拍同款（参考视频）。用于把一条参考片拆成可复用的结构骨架（切点、镜长、节奏、开场钩子、画幅），出 2–3 张差异化同款方案，确认版权后再进入生产。用户说「拍同款」「参考这条视频」「拆一下这个参考片」「照这个节奏做」时使用。
---

# 拍同款：参考视频 → 结构 → 同款方案

学结构，不抄画面。参考片是 G0 的前置条件，不是新闸门。

## 0. 登记

- 本地文件：优先让创作者在「参考」页直接上传（选文件即写入 `参考视频/` 并登记，不经过对话），或给本机路径用 `toon_reference_intake({ path })`；`参考视频/` 里的文件也可直接登记。
- 链接：`toon_reference_fetch({ url })` 用本机 yt-dlp 下载到 `参考视频/` 并登记；没有 yt-dlp 时工具会给出安装命令，不要假装下载成功。需要登录态的站点可传 `cookiesFromBrowser`（chrome/safari/edge）。
- 参考片与项目分开存：档案在 `.kylin-toon/reference/analysis.json`，关键帧在 `.kylin-toon/reference/frames/`。

## 1. 拆解

跑 `toon_reference_analyze`（本机 ffmpeg 场景检测）：

- 切点 → 镜窗 → 节奏（平均/最长镜、每分钟切数、开场钩子）；
- 结构标签只由体检与节奏判定（横屏/竖屏、快切/长镜、开场 3 秒内切），不编题材与情绪；
- 关键帧只作分析依据，**不要**当作首帧、参考图或成片素材。

拿到档案后读关键帧，用创作者能懂的话讲：开场钩子在第几秒、前 15 秒切了几刀、最长镜停在哪、哪一段是情绪留白。

### 转写（可选）

插件不自己跑 ASR。用多媒体网关 `media_audio({ action: 'transcribe', file })` 转写，再把分段交给 `toon_reference_transcript({ segments, language })`；也可以直接给 SRT/VTT 路径。没有分段就不要编台词。

## 2. 出方案（2–3 张）

方案是项目数据，不是插件硬编码。每张可带交付规格：`format`（horizontal/vertical/concept/other）、`aspectRatio`、`targetDurationSec`、`episodeCount`、`platform`；参考页与导出都会显示。不同项目（横屏完整集、竖屏投放、概念片）用同一套字段表达，不需要改插件。

必须给出差异化选择，而不是同一套换皮：

```json
{"plans":[
  {"id":"A","title":"快切悬念版","summary":"…","keep":["开场钩子","三镜递进"],"replace":["人物","场景"],"risks":"…"},
  {"id":"B","title":"长镜氛围版","summary":"…","keep":["开场钩子"],"replace":["切点密度","旁白节奏"]}
]}
```

`keep` 写保留的结构，`replace` 写换掉的内容；每张至少各一条。调用 `toon_reference_plans`；新方案会作废之前的选择。

## 3. 选定与版权

- `toon_reference_choose({ planId, confirmed: true })`：**只有在创作者明确选定后**才能调用，不能代选。
- `toon_reference_rights({ basis, confirmed: true })`：`self` 自有 / `licensed` 已授权 / `structure-only` 只学结构不复用画面；同样必须由创作者确认。
- 未确认版权或未选定方案时，`toon_gate` 的 G0 会阻断，列出缺什么。

## 3.5 关键帧作定妆照风格参考

把选定的关键帧标记为定妆照/视觉定调的风格参考：

```json
{"frames":[1,3],"note":"冷白日光、低饱和、粗颗粒；不复用构图"}
```

- 调用 `toon_reference_style_refs`；返回的路径可直接给 `media_upload`。
- 出定妆照时：先 `media_upload` 这些关键帧 → `media_generate`（图片改图/参考生图）→ 提示词写明**只用光线、色调、质感，不复用构图与人物身份**。
- 风格参考只服务定妆照与 Look Development，不作为镜头首帧或成片素材。

## 3.6 导出与换片

- `toon_reference_export`：把拆解、镜头表、方案、版权与风格参考写成 `参考视频/参考拆解.md`，给下游技能或人看；
- `toon_reference_reset`：换参考片时清除当前档案（旧状态归档到 `.kylin-toon/reference/archive`，关键帧一并删除）。

## 4. 进入生产

选定方案 + 版权确认后，把「保留什么 / 换什么」写进剧本与分镜的创作约束，再走正常生产。不要复制参考片的台词、画面构图与人物造型。

## 边界

- 不把参考片画面送进生成链路；
- 不伪造转写（0.1.0 未接 ASR）；
- 不因为「分析过了」就跳过版权确认。