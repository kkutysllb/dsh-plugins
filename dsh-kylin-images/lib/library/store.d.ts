import type { LocalizedText } from './i18n.ts';
export interface LibraryTemplate {
    id: string;
    anchor?: string;
    cover?: string;
    category: string;
    styles: string[];
    scenes: string[];
    tags: string[];
    title: LocalizedText;
    description: LocalizedText;
    useWhen: LocalizedText;
    guidance: {
        en?: string[];
        zh?: string[];
    };
    pitfalls: {
        en?: string[];
        zh?: string[];
    };
    exampleCases: number[];
}
export interface LibraryCase {
    id: number;
    title: string;
    image: string;
    prompt: string;
    promptPreview: string;
    category: string;
    styles: string[];
    scenes: string[];
    featured: boolean;
}
export interface Library {
    repository: string;
    version: number;
    categories: string[];
    styles: string[];
    scenes: string[];
    tagLabels: Record<string, LocalizedText>;
    templates: LibraryTemplate[];
    cases: LibraryCase[];
}
export interface SearchQuery {
    query?: string | undefined;
    category?: string | undefined;
    styles?: readonly string[] | undefined;
    scenes?: readonly string[] | undefined;
    tags?: readonly string[] | undefined;
    limit?: number | undefined;
    cursor?: number | undefined;
    /** summary 只回摘要（默认）；prompt 才回全文提示词（token 预算由调用方显式打开）。 */
    include?: 'summary' | 'prompt' | undefined;
}
export interface TemplateHit {
    id: string;
    title: string;
    category: string;
    score: number;
    matched: string[];
    useWhen: string;
    guidance: string[];
    pitfalls: string[];
    exampleCases: number[];
}
export interface CaseHit {
    id: number;
    title: string;
    category: string;
    image: string;
    score: number;
    promptPreview: string;
    prompt?: string;
}
export interface SearchResult {
    totalTemplates: number;
    totalCases: number;
    nextCursor?: number;
    templates: TemplateHit[];
    cases: CaseHit[];
}
/** 纯函数：把两份上游原始数据解析成库结构。 */
export declare function buildLibrary(styleLibraryRaw: unknown, casesRaw: unknown): Library;
/** 从 data/ 目录载入库（默认插件自带快照）。 */
export declare function loadLibrary(dataDir?: string): Library;
/** 结构化检索：摘要优先，prompt 全文需显式 include:'prompt'。 */
export declare function searchLibrary(library: Library, query: SearchQuery, localeInput?: unknown): SearchResult;
