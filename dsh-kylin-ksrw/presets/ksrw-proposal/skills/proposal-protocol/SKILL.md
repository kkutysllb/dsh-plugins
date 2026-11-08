---
name: proposal-protocol
description: KSRW 开题工位：单一问题、可证伪假设、方法、实验计划与停止条件
argumentHint: '[项目路径]'
---

# 开题协议（proposal）

## 何时用

选题已确认 go，需要把选题卡收敛成可执行研究方案时。

## 步骤

1. 读 topic/topic.json、researchState.md、相关文献；确认 decision=go。
2. 写单一研究问题：一句话，能被实验回答；不要并列三个问题。
3. 写可证伪假设：明确“什么结果支持、什么结果反驳”。
4. 写方法：数据、模型/系统、对照、变量控制；指出与最近工作的关键差异。
5. 写实验计划：基线、指标、消融、预算、随机种子、停止条件；标明哪些是必须、哪些是加分。
6. 写风险与备选：最可能失败的环节、降级方案、时间线。
7. 用 ksrw_propose 提交 proposal 提案；等用户 apply。
8. 应用后，由研究主持用 ksrw_gate 推进到 proposal。

## 输出契约

开题文档包含：question、hypothesis、method、baselines、metrics、experiments、risks、timeline、stopConditions。

## 纪律

- 方法必须能落到实验工位；不写“我们提出一个框架”这种不可执行表述。
- 没有基线的指标不算指标；没有停止条件的计划不算计划。
- 不替实验工位跑实验、不替论文工位写正文。
