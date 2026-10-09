/**
 * 视觉词汇表：艺术风格 / 色调 / 布局。
 *
 * 单一事实源，同时供提示词编译器（compose）与漫画选型（comic/select）使用，
 * 数据取自 KSkills knowledge-comic 技能 v1.1.0 的三张表。
 */
export interface VocabEntry {
    readonly id: string;
    readonly zh: string;
    /** 注入提示词时使用的英文描述（生成提示词恒为英文）。 */
    readonly phrase: string;
}
export declare const ART_STYLES: readonly VocabEntry[];
export declare const TONES: readonly VocabEntry[];
export declare const LAYOUTS: readonly VocabEntry[];
export declare const ASPECT_RATIOS: readonly ["3:4", "4:3", "16:9", "9:16", "1:1", "2:3", "3:2"];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export declare const RESOLUTIONS: readonly ["1k", "2k", "4k"];
export type Resolution = (typeof RESOLUTIONS)[number];
/** 艺术风格 id -> 英文提示词片段；未知 id 原样回退为自由描述。 */
export declare function artStylePhrase(id: string | undefined): string;
/** 色调 id -> 英文提示词片段。 */
export declare function tonePhrase(id: string | undefined): string;
/** 布局 id -> 英文提示词片段。 */
export declare function layoutPhrase(id: string | undefined): string;
export declare function isAspectRatio(value: unknown): value is AspectRatio;
export declare function isResolution(value: unknown): value is Resolution;
