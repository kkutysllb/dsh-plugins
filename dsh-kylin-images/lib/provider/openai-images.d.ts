import type { HttpOptions } from './http.ts';
import { OPENAI_IMAGES_PATH, OPENAI_MODELS_PATH, joinUrl, resolveEndpoint } from './endpoint.ts';
import type { ChannelRecord, GenerateRequest, GenerateResult, ImageProvider, ProbeResult, ProviderHealth } from './types.ts';
export { OPENAI_IMAGES_PATH, OPENAI_MODELS_PATH, joinUrl, resolveEndpoint };
/** 参考图 -> data URL（聚合站与官方改图接口都吃这一形态）。 */
export declare function referenceImagePayload(paths: readonly string[]): Array<Record<string, unknown>>;
/** 把负向清单折进提示词（当前主流图像 API 没有原生负向字段）。 */
export declare function foldNegative(prompt: string, negative: string | undefined): string;
export declare class OpenAiImagesProvider implements ImageProvider {
    readonly kind: "openai-images";
    health(channel: ChannelRecord, http?: HttpOptions): Promise<ProviderHealth>;
    /** 零成本端点可达性探测：绝不出图（哨兵模型）。 */
    private routeReport;
    probe(channel: ChannelRecord, options?: {
        realRun?: boolean;
        http?: HttpOptions;
        outputDir?: string;
    }): Promise<ProbeResult>;
    private headers;
    generate(channel: ChannelRecord, request: GenerateRequest): Promise<GenerateResult>;
}
