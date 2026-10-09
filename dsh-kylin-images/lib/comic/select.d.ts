/**
 * 知识漫画视觉方案选型（P0-P10）。
 *
 * 规则表来自 KSkills knowledge-comic v1.1.0 的自动选择表，这里实现为
 * 确定性纯函数：同样信号恒返回同样方案，且永远把命中规则与理由回传，
 * 便于会话模型解释或覆盖（P0 用户指定优先级最高）。
 */
import type { AspectRatio } from '../prompt/vocab.ts';
export interface VisualPlan {
    artStyle: string;
    tone: string;
    layout: string;
    aspectRatio: AspectRatio;
}
export interface ComicSignals {
    /** 内容信号（主题、关键词、摘要均可；大小写不敏感）。 */
    keywords?: readonly string[] | undefined;
    /** 用户显式指定；任意字段一经给出即视为 P0，覆盖自动匹配。 */
    userSpecified?: Partial<VisualPlan> | undefined;
}
export interface SelectionResult {
    plan: VisualPlan;
    /** 0 = 用户指定，1-10 = 自动规则优先级，99 = 兜底默认。 */
    priority: number;
    matchedRule: string;
    reason: string;
    matchedKeywords: string[];
}
interface Rule {
    priority: number;
    id: string;
    label: string;
    keywords: readonly string[];
    plan: Omit<VisualPlan, 'aspectRatio'>;
}
/** 顺序即优先级；从上到下第一个命中者生效。 */
export declare const RULES: readonly Rule[];
/** 依据内容信号选择视觉方案。纯函数。 */
export declare function selectVisualPlan(signals: ComicSignals): SelectionResult;
export {};
