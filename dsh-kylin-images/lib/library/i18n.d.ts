/**
 * 双语取值：上游数据里所有面向人的字段都是 { en, zh } 结构。
 * 取值必须容错（字段可能缺失、可能是纯字符串、可能是纯数组）。
 */
export type Locale = 'zh' | 'en';
export interface LocalizedText {
    en?: string;
    zh?: string;
}
/** 语言标识归一：zh / zh-CN / zh-Hans 等一律归到 zh，其余归到 en。 */
export declare function normalizeLocale(value: unknown): Locale;
/** {en,zh} -> 指定语言的字符串；缺失时回退另一语言，再回退空串。 */
export declare function pick(value: unknown, locale: Locale): string;
/** {en:[],zh:[]} -> 指定语言的字符串数组；容忍纯数组。 */
export declare function pickList(value: unknown, locale: Locale): string[];
/** 把 {en,zh} 或纯字符串统一成 {en,zh}，便于统一存取。 */
export declare function toLocalizedText(value: unknown): LocalizedText;
