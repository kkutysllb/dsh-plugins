import type { ComposedPrompt } from '../prompt/compose.ts';
import type { HttpOptions } from '../provider/http.ts';
import type { QuoteResult } from '../provider/pricing.ts';
import type { ChannelRecord, GeneratedImage } from '../provider/types.ts';
import type { PluginRuntime } from './registry.ts';
export interface GenerationInput {
    prompt: unknown;
    channelId?: string | undefined;
    model?: string | undefined;
    outputDir?: string | undefined;
    fileStem?: string | undefined;
    count?: number | undefined;
    seed?: number | undefined;
    /** 用户已确认（超过阈值或未知价时的第二跳）。 */
    confirm?: boolean | undefined;
    /** false 表示绕过缓存。 */
    useCache?: boolean | undefined;
    /** 只算价不生成（批量预检用：避免预检就把钱花了）。 */
    dryRun?: boolean | undefined;
    templatePitfalls?: readonly string[] | undefined;
    referenceImages?: readonly string[] | undefined;
    http?: HttpOptions | undefined;
}
export interface GenerationOutcome {
    kind: 'generated' | 'cached' | 'confirm-required' | 'quoted' | 'error';
    message: string;
    channelId: string;
    model: string;
    quote: QuoteResult;
    images: GeneratedImage[];
    warnings: string[];
    composed: ComposedPrompt | undefined;
    durationMs: number;
}
/** 简写：{ text: '自然语言' } -> ImagePrompt v1。 */
export declare function normalizePromptInput(raw: unknown): unknown;
export declare function resolveChannel(runtime: PluginRuntime, channelId?: string): ChannelRecord | undefined;
export declare function runGeneration(runtime: PluginRuntime, input: GenerationInput): Promise<GenerationOutcome>;
/** 受限并发跑一批生成（保序返回结果）。 */
export declare function runBatch(runtime: PluginRuntime, items: readonly GenerationInput[], concurrency: number): Promise<GenerationOutcome[]>;
