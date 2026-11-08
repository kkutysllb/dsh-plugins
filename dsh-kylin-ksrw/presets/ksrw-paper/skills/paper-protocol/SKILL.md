---
name: paper-protocol
description: KSRW 论文工位：大纲、写作、编译、引用审计与投稿清单
argumentHint: '[项目路径或章节]'
---

# 论文协议（paper）

## 何时用

文献与实验产物齐备，需要写论文、编译、做引用审计或准备投稿时。
没有项目、只有一份自己以前写的论文要改时，走下面的「免项目论文工坊」。

## 免项目论文工坊（workshop）

用户手里有自己以前写的论文（PDF / DOCX / MD / TXT / TeX）、没有项目，想直接改一版时，论文工位仍然可用：工坊是一个 detached 目录（`paper-workshops/<id>/`，含 `workshop.json` / `project.json`），你的工作目录就是工坊目录；`ksrw_context` / `ksrw_propose` / `ksrw_evidence` 的用法与项目内完全一致。

### 与项目内论文的区别

- 项目内论文：上游是已 apply 的文献矩阵与实验记录，正文写 `paper/main.md`，编译与投稿清单走项目闸门。
- 工坊论文：没有开题、没有文献矩阵，起点是用户上传的历史论文；原文在 `paper/source.md`（PDF 按「## 第 N 页」分页），导入初稿在 `paper/original.md`，当前正文在 `paper/main.md`（paper 工件，revision 计数）。工坊不进项目库（detached，不出现在项目列表），用户「登记为项目」后才变成正式项目；删除工坊只删工坊目录。
- 纪律不变：**保留原论文的贡献、数据与结论口径**，只改表述、结构或补充说明；不编造实验、引用或结果；需要补实验时建议用户去实验工坊跑真实 run，再把结果回流正文。

### 步骤

1. **对照原文**：`ksrw_paper_workshop(source)` 返回附件元信息（文件名/类型/页数/字符数/标题）与 `source.md` 分片（默认 2 万字符，单次上限 6 万）；不够就按返回的 `nextOffset` 续读，不要一次把全文读进上下文。
2. **读当前正文**：`ksrw_paper_workshop(draft)` 返回 `{ revision, updatedAt, content, words, sections }`；`sections` 是按标题识别出的章节结构，用来定位改动范围。
3. **先列改动清单**：告诉用户要改哪几节、为什么改、会不会动到结论/数据/图表编号；用户确认后再动笔。
4. **提交提案**：任何正文改动都走 `ksrw_propose`（`artifactRef: 'paper'`，`baseRevision` 来自 `ksrw_context` 或 `draft.revision`），等用户 apply，不要直接写权威文件。
5. **应用后重新编译**：提案被 apply 后用「编译与导出」重新编译 PDF（或 `ksrw_compile`），确认模板（`paper/style.json`）与图表引用仍然成立；编译失败或引用缺口不得说完成。
6. **恢复要显式**：只有用户明确要求时才用 `ksrw_paper_workshop(restore)`——它把正文恢复成导入时的初稿，并新增一个 revision（不删历史版本）。
7. **编译状态**：`ksrw_paper_workshop(status)` 给出 `source`、`compile { ready, pdfEngine, tools, outputs, build, stale }`、`revision` 与 `words`；`stale=true` 说明正文改过、PDF 已过期，必须重新编译。
8. **登记与删除**：用户要把工坊转正时说明「登记为项目」会进项目库；删除工坊只清工坊目录（原始附件也会删除，先提醒备份）。

## 草稿与定稿（交付格式）

- **修改期用 Word**：论文正文改动都发生在 `paper/main.md`，交付/批注用 Word（docx）；反复修改时只导出 Word，不要每次编译 PDF。
- **定稿才出 PDF**：内容定稿后由用户点「编译定稿 PDF」；PDF 会记录生成时的正文指纹。
- **完成闸门**要求：定稿 PDF 存在，且与当前正文一致；正文改过之后 PDF 标记为过期，必须重新编译才能推进到「完成」。
- 不要把 PDF 当成工作格式；也不要在正文未定时反复编译覆盖定稿。

## 图表生成（figure 工具）

图表是论文工位的内置能力，不要再让用户手动点按钮，也不要在正文里贴 ASCII 图。

- **自定义示意图必须收编**：如果确实需要手写 SVG（如 PRISMA、框架图），写完必须调用 `ksrw_figure {action:'adopt', file, caption}`：它会生成 300dpi PNG、登记图库、并把正文引用从 .svg 改成 .png。禁止把图直接丢进 `paper/figures/` 不登记；投稿前跑 `ksrw_figure {action:'validate'}` 检查分辨率/图注/引用。
1. `ksrw_figure {action:'list'}`：先看图库（文件名/图注/kind/来源），避免重复造图。
2. 数据图：
   - `ksrw_figure {action:'metrics', runId}`：把某次实验 run 的数值指标画成柱状图（优先用这个）。
   - `ksrw_figure {action:'chart', chartKind:'line|bar|scatter', series:[{name, points:[{x,y}]}], xlabel, ylabel, title}`：
     用户给了数据或你要对比多条曲线时用。
   - **数据必须真实**：只能来自 `experiments/runs/<id>/metrics.json`、论文表格里已有数字，或用户明确提供；
     不得为了「图好看」编造数值、平滑曲线或补点。
3. 流程/架构图：`ksrw_figure {action:'flow', nodes:[{id,label,active?}], edges:[{from,to,label?}], direction:'lr'|'tb'}`。
   不要自己写 .mmd 文件（Mermaid 只能在论文工位 UI 里编辑渲染）。
4. 插图：`ksrw_figure {action:'insert', file, caption, heading?}` 把图放进正文指定小节（缺省文末），
   然后必须在该小节写一句「如图 N 所示 …」并把图讲进论证里；图注要写清**数据来源**（runId 或数据说明）。
5. `caption` 改图注、`delete` 删图；正文引用路径固定为 `figures/<file>`。

## 排版模板（会议/期刊）

排版模板不是项目里的文件，不要用 glob/文件搜索去项目目录里找 reference.docx（会找到别的项目的旧模板）。

1. `ksrw_paper_format {action:'list'}`：列出所有可选模板 + 每个模板的可执行排版要求；返回里的
   `current` 是当前项目正在用的模板。
2. `ksrw_paper_format {action:'describe', venue}`：拿到某模板的逐项要求（页面/字体/字号/行距/标题/
   图表注/行号），据此检查或改写正文：字号/行距由模板决定，不要在正文里手写字号；标题只用 #/##/###，
   不要用加粗冒充标题；图表注保持一行。
3. `ksrw_paper_format {action:'set', venue}`：把项目切到目标模板（写 `paper/style.json`），随后必须
   重新编译才生效（`ksrw_compile` 或用户在编译卡点「编译定稿 PDF」）。

用户提到「按 IEEE/ACM/Elsevier/LNCS/NeurIPS 排版」时：先 list 确认模板 id，再 set，再编译，不要自己
生成 LaTeX 类文件或改用 Word 手工排版。

## 论文精读（reading 工具）

精读是论文工位的独立能力，和写正文分开：先产出 `literature/reading/<id>/digest.md`，再谈写作。

### 流程

1. `ksrw_reading {action:'list'}` 看待读清单与精读建议（topics/goal/depth/language/includeFigures/figureNotes/focus）。
2. 用户挑一篇后 `ksrw_reading {action:'context', id}`：拿精读建议、原文（`[页.段]` 编号）、图表清单（含页码与图注候选）。
3. 按下面格式写精读稿，用 `ksrw_reading {action:'write', id, markdown}` 落盘。

### 精读稿格式（必须遵守）

```markdown
# <论文标题>

## 一句话结论
<这篇论文到底解决了什么、结论是否可靠>

## 逐段精读
### [1.2] <段落主题>
> <英文原文关键句（注明段落号）>
**译文**：<中文翻译>
**解读**：<这段在论证链里的作用/方法含义/可疑之处>

## 图表精读
### 图 1（`figures/fig-01.png`，原文 P3）
**图注**：<原文图注译文>
**解读**：<这张图证明了什么、怎么读、对应正文哪段>

## 关键结论与定位
- <结论>（原文 P5 §4.2 / 精读「§[5.1]」）
```

### 纪律

- **图表先看视觉解读**：若存在 `literature/reading/<id>/figure-notes.md`（视觉模型逐图解读），写「图表精读」时先读它并与之对齐；没有时才依据图注与正文推断，且不得编造图上数字。
- **图表不能缺**：`context.figures` 有几张，图表精读就要有几节；矢量图用页码定位原文。
- 每段解读必须能回点（`[页.段]` 或图号），不允许“总体来看”式空话。
- 原文没写的结论不要补；存疑写「存疑」并说明缺什么证据。
- 深度按 `depth`：paragraph 逐段、section 按小节、abstract 只摘要级。
- 语言按 `language`（zh-en = 中文解读 + 原文引用；en-zh = 英文解读 + 中文对照）。

## 图表（正文必须有图）

- `ksrw_context` 返回的 `figures` 是项目图库：`{file,title,caption,kind}`（result/metrics/architecture）。
- 正文用相对路径引用：`![图 N 图注](figures/<file>)`；图注写清「是什么 + 变量/条件」，不留 `figure.png` 这类文件名当图注。
- 编号连续（图 1、图 2…），正文必须有一句「如图 N 所示」把它讲出来，不能只贴图。
- 结果图（kind=result/metrics）优先用在「实验」章；`architecture.svg/png` 用在「系统设计/方法」章。
- 图库为空时不要编图：提示用户到实验工位跑一次实验（脚本写 `artifacts/figures/`）或点「生成指标图/系统架构图」。
- 图只引用不搬运：不要自己往 `paper/figures/` 里复制文件，也不要在正文里写绝对路径。
- **系统架构图是 Mermaid 源**：`paper/figures/architecture.mmd`。要改架构图，改这个文件（用户在论文工位点「编辑系统架构图（Mermaid）」导出 PNG+SVG）；不要另画一张图片替代它。
- 图注编号与正文引用必须一致；架构图放「系统设计/方法」章，不要塞进实验章冒充结果。

## 步骤

1. 读 researchState、开题、文献矩阵、实验记录；确认哪些 claim 有证据。
2. 写 claim–evidence 表：每个结论对应文献/run/图表；没有证据的 claim 删除或降级。
3. 定大纲：问题、相关工作、方法、实验、讨论、局限、结论；先写“一句话贡献”。
4. 写作：只改 paper/ 草稿区；每节写完检查术语一致、符号一致、图表编号。
5. 编译：LaTeX 必须真实编译通过；记录警告与未定义引用。
6. 引用审计：正文引用 ↔ bib 条目 ↔ DOI；缺一不可；不编引用。
7. 投稿清单：作者顺序、单位、伦理/数据声明、附录、复现材料、字数/页数限制。
8. 用 ksrw_propose 提交章节/成稿提案；由用户 apply。

## 纪律

- 不把“预期结果”写成“实验结果”。
- 不隐藏失败实验；局限要具体。
- 编译不过、引用有缺口时不得说完成。
