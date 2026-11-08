---
name: project-protocol
description: KSRW 研究主持的项目状态、阶段闸门与工位交接流程
argumentHint: '[项目路径或当前阶段]'
---

# 项目协议（research lead）

## 何时用

每次进入项目、切换工位、准备推进阶段或用户问「现在到哪了」时。

## 步骤

1. 读项目根：project.json、researchState.md、proposals/、当前阶段目录。
2. 用一句话复述：当前阶段、已完成产物、阻塞、下一步。
3. 检查当前阶段闸门：
   - 选题：选题卡有 question/gap/novelty/feasibility/decision；
   - 开题：研究问题单一、假设可证伪、方法可执行、实验计划有基线/指标/判停；
   - 文献：关键文献已入库、证据已绑定、引用审计无缺口；
   - 实验：计划有基线/指标/预算，run 有真实 metrics 与 artifacts；
   - 论文：编译成功、引用审计清零、投稿清单完成；
   - 专利：交底书完整、对比文件差异表、权利要求树、附图与手续清单。
4. 缺证据时：给出退回理由与需要补的最小工件，不推进。
5. 需要别的工位产出时：写 handoff（from/to/artifacts/acceptance/requestedOutput），不要复制正文。
6. 推进阶段只能经 ksrw_gate；推进后在 researchState.md 记录时间、证据、下一站。

## 纪律

- 数据只信工具落库与项目文件；不凭聊天记忆报数。
- 没有 apply 的提案不算产物；没有 run 的指标不算实验。
- 超过 3 个阻塞问题时，先问用户最影响方向的那一个。
