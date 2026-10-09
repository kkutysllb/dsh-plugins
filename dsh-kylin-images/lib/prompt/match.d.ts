import type { Library } from '../library/store.ts';
export interface TemplateNeed {
    query?: string | undefined;
    category?: string | undefined;
    styles?: readonly string[] | undefined;
    scenes?: readonly string[] | undefined;
    tags?: readonly string[] | undefined;
}
export interface TemplateCandidate {
    id: string;
    title: string;
    category: string;
    score: number;
    /** 命中了哪些维度，如 ['category:UI & Interfaces', 'styles:UI']。 */
    matched: string[];
    useWhen: string;
    pitfalls: string[];
}
/**
 * 返回模板候选（按分数降序，最多 limit 个）。
 * 无命中时给通用兜底，并在 matched 里标注 'fallback'，调用方应据此追问用户。
 */
export declare function suggestTemplates(library: Library, need: TemplateNeed, localeInput?: unknown, limit?: number): TemplateCandidate[];
/** 是否应当先让用户做选择（候选分数接近或存在兜底）。 */
export declare function needsUserChoice(candidates: readonly TemplateCandidate[]): boolean;
