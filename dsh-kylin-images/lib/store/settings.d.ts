import type { AspectRatio, Resolution } from '../prompt/vocab.ts';
import type { ImageFormat } from '../prompt/schema.ts';
export declare const QUALITIES: readonly ["low", "medium", "high", "auto"];
export type Quality = (typeof QUALITIES)[number];
export interface PluginSettings {
    /** 默认通道 id；空串表示未配置（工具会给出明确指引）。 */
    defaultChannelId: string;
    defaultModel: string;
    defaultAspectRatio: AspectRatio;
    defaultResolution: Resolution;
    defaultFormat: ImageFormat;
    defaultQuality: Quality;
    /** 单次生成张数上限（1-4）。 */
    defaultCount: number;
    /** 批量并发（1-8）。 */
    concurrency: number;
    /** 全局追加负面词。 */
    globalNegative: string[];
    /** 是否把所选模板的 pitfalls 自动并入提示词约束段。 */
    includeTemplatePitfalls: boolean;
    /** 单次预估超过该金额（人民币）时先请求确认。 */
    budgetConfirmCny: number;
    /** 未知价是否一律确认。 */
    confirmUnknownPrice: boolean;
    cacheEnabled: boolean;
    cacheDir: string;
    cacheMaxEntries: number;
}
export declare const DEFAULT_SETTINGS: PluginSettings;
/** 规范化任意输入为完整设置（容错：坏字段回落默认值，永不抛异常）。 */
export declare function normalizeSettings(input: unknown): PluginSettings;
export declare const ASPECT_RATIO_CHOICES: readonly AspectRatio[];
export declare const RESOLUTION_CHOICES: readonly Resolution[];
export declare const FORMAT_CHOICES: readonly ImageFormat[];
