---
name: experiment-protocol
description: KSRW 实验工位：设计、基线、指标、运行记录、失败分析与复现
argumentHint: '[项目路径或实验计划]'
---

# 实验协议（experiment）

## 何时用

开题方案已应用，需要设计实验、跑基线、记录指标或分析失败时。
没有项目、只有一篇论文（或一段方法描述）要补实验时，走下面的「免项目实验工坊」。

## 职责边界

- 本工位负责实验设计、运行、指标与记录；**检索、PRISMA 记录、文献矩阵属于文献工位**。
- 上游缺文献矩阵时：在回复里标「上游缺件：literature 未应用」，不要自己代做检索，也不要编造各库命中数。
- 需要查 API/库文档时可以联网（web_search / web_fetch）；引用外部资料要绑 ksrw_evidence。

## 步骤

1. 读 proposal/proposal.md 与实验计划；确认基线、指标、预算、停止条件。
2. 写实验卡：假设、变量、对照、数据版本、代码版本、随机种子、环境。
3. 先跑最小基线；记录命令、日志路径、耗时、资源；不要只记最好结果。
4. 跑主实验与消融；每个 run 落盘 metrics.json/artifacts，并用 ksrw_evidence 绑定 run。
5. 分析：方差、失败样本、异常值、与基线的差距；区分“方法无效”和“实现有 bug”。
6. 失败也要落盘：失败原因、已排除项、下一步最小实验。
7. 用 ksrw_propose 提交实验记录/结果提案；不直接写论文结论。

## 免项目实验工坊（standalone）

用户手里只有一篇论文、没有项目时，实验工位仍然可用：工坊是一个 detached 目录（`standalone/exp-*`，含 `standalone.json` / `project.json`），你的工作目录就是工坊目录；`ksrw_context` / `ksrw_propose` / `ksrw_evidence` 的用法与项目内完全一致。

### 与项目内实验的区别

- 项目内实验：上游是已 apply 的开题方案，设计写 `experiments/record.md`，结论回流论文工位。
- 工坊实验：没有开题、没有文献矩阵，起点是用户上传的论文附件；实验要素靠 `ksrw_experiment(analyze)` 从论文里抽取，设计骨架由工具生成，产物只服务这一篇论文的补实验。用户「登记为项目」后，工坊目录就变成正式项目。
- 纪律不变：两类场景都只信真实 run 与落盘 artifacts；工坊里没有成功 run 同样不得下结论。

### 步骤

1. 先读论文：`ksrw_experiment(paper)` 返回附件元信息、抽取要素与全文分片（默认 2 万字符）；不够就按返回的 `nextOffset` 续读，不要一次把全文读进上下文。要重新抽取时用 `ksrw_experiment(analyze)`，返回 `{ title, elements, missing, warnings, sections }`。
2. 核对 `missing`：缺数据集 / 指标 / 基线 / 局限的，先用论文原文补齐，补不出来就问用户，不要猜。
3. 设计：设计以 `experiments/record.md`（experiment 工件）为准。先用 `ksrw_experiment(scaffold)` 生成确定性骨架（设计已存在时要显式传 `overwrite: true` 才会覆盖），再用 `ksrw_experiment(design)` 读当前 revision 与正文；任何补全/改写都走 `ksrw_propose`（`artifactRef: 'experiment'`，`baseRevision` 来自 `ksrw_context`），等用户 apply，不要直接写权威文件。
4. 脚本：只能用 `ksrw_experiment(script)` 写到 `experiments/code/<name>.py`（这是 Agent 唯一的写脚本入口；名字必须是 `<name>.py`，内容 ≤256KiB）。脚本必须打印指标：每行一个 `KSRW_METRIC name=value`（如 `print('KSRW_METRIC accuracy=0.912')`）；需要留文件时写 `$KSRW_RUN_DIR/artifacts/`，并把数据版本、种子、超参打进 stdout。
5. 运行：本工具不执行脚本；由工位界面触发 runner（本地 Python / 远程 GPU），run 落盘到 `experiments/runs/<runId>/`。不要在回复里假装跑过。
6. 核对：跑完用 `ksrw_experiment(runs)` 看真实 `status` / `metrics` / `artifacts`；结论只引用这里能查到的数字。没有成功 run 就只写失败分析。
7. 报告：`ksrw_experiment(report)` 按设计 + 真实 run 生成 `experiments/report.md`；没有成功 run 时报告会明确写「不给出任何实验结论」，回复照此口径。
8. 结论照旧走 `ksrw_propose`（experiment 工件）+ `ksrw_evidence` 绑定 run；用户 apply 后才算定稿。

### 纪律

- 没有成功 run 不得声称「方法有效」「指标提升」；失败 run 也是证据，保留日志并写失败分析。
- 论文里报告的数字是**论文的结果**，不是你跑出来的：两者必须分开写，不得把论文数字当成本次实验指标。

## 纪律

- 没有 run 的指标不算实验；没有 artifacts 的结果不可复现。
- 不篡改/挑选数据；不把测试集当验证集。
- AILab runner 接入后优先用 lab 工具；当前手工 run 必须写清环境。
