/**
 * 成本护栏：三层查价（通道覆盖 > 内置目录 > unknown）+ 确认判定。
 *
 * 教训来自上游与本地实测：静默烧钱是这类插件最容易犯的错（20 页漫画 × 2k 图）。
 * 因此：未知价一律确认；超过阈值一律确认；每次记账。
 */
import type { Resolution } from '../prompt/vocab.ts';
import type { ChannelRecord } from './types.ts';
import type { PluginSettings } from '../store/settings.ts';
export interface QuoteResult {
    amount: number;
    currency: string;
    confidence: 'exact' | 'estimated' | 'unknown';
    source: 'channel-override' | 'builtin' | 'unknown';
    note: string;
}
/** 单张价（人民币）。通道覆盖优先，其次内置目录。 */
export declare function pricePerImage(channel: ChannelRecord, model: string, resolution: Resolution): {
    amount: number | null;
    currency: string;
    source: QuoteResult['source'];
    note: string;
};
export declare function quoteImages(input: {
    channel: ChannelRecord;
    model: string;
    count: number;
    resolution: Resolution;
}): QuoteResult;
/** 是否需要先向用户确认。 */
export declare function needsConfirmation(quote: QuoteResult, settings: PluginSettings): boolean;
export declare function describeQuote(quote: QuoteResult): string;
