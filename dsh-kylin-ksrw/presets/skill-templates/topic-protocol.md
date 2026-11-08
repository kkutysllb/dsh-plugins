---
name: topic-protocol
description: KSRW 选题工位：查新、gap、新颖点、可行性与 go/no-go
argumentHint: '[idea 或项目路径]'
---

# 选题协议（topic）

## 何时用

用户给出一个 idea、要求查新、比较候选选题，或要判断“这个题值不值得做”时。

## 步骤

1. 读项目：project.json、researchState.md、topic/、已有提案；没有项目先让用户建项目。
2. 把 idea 写成一句话问题，再拆 2–4 个候选表述；不要一上来只给一个答案。
3. 查新：用 search/read 找 5–10 篇最相关论文与 1–3 个相邻方向；记录检索式、时间、来源。
4. 做 gap 表：已有工作做到哪、缺什么、为什么现在能做；区分“没人做”和“做不出来”。
5. 列新颖点：每条都要能对应一个 gap；不能只是换数据集/换模型。
6. 可行性四问：数据从哪来、算力够不够、时间预算是多少、需要什么技能；每条给出证据或明确假设。
7. 写风险与 no-go 条件；至少一条“如果……就放弃”。
8. 用 ksrw_propose 提交 topic 提案（baseRevision 必须来自 ksrw_context）；等用户 go/no-go。
9. 用户确认 go 后，由研究主持用 ksrw_gate 推进到 topic。

## 输出契约

选题卡必须包含：question、motivation、gap、novelty[]、feasibility{data,compute,time,skill}、risks[]、decision。

## 纪律

- 查新结果必须能回点来源；没有来源的“空白”不算 gap。
- 不替用户做最终 go/no-go；给出推荐与理由。
- 不写开题正文、不跑实验、不写论文。
