import type { HttpOptions } from './http.ts';
import type { ChannelRecord, GenerateRequest, GenerateResult, ImageProvider, ProbeResult, ProviderHealth } from './types.ts';
export declare const RESPONSES_PATH = "/v1/responses";
export interface ResponsesImageCall {
    result?: string;
    url?: string;
    status: string;
    revisedPrompt?: string;
}
/** 从 Responses 响应里取出所有 image_generation_call 项。 */
export declare function extractImageCalls(body: unknown): ResponsesImageCall[];
/** 响应里的图像 token 用量（成本按 token 计，实测约 0.74 额度/token）。 */
export declare function imageTokensOf(body: unknown): number | undefined;
/** 构造 image_generation 工具块：尺寸与质量是工具参数，不是顶层字段。 */
export declare function buildImageTool(request: GenerateRequest, supportsQuality: boolean, quality: string | undefined): Record<string, unknown>;
/** 构造请求体；有参考图时 input 用 parts 形态（Responses 文档形态）。 */
export declare function buildResponsesBody(request: GenerateRequest, options: {
    supportsNegative: boolean;
    supportsQuality: boolean;
    quality?: string | undefined;
    references?: readonly string[] | undefined;
}): Record<string, unknown>;
export declare class OpenAiResponsesProvider implements ImageProvider {
    readonly kind: "openai-responses";
    private headers;
    health(channel: ChannelRecord, http?: HttpOptions): Promise<ProviderHealth>;
    /** 零成本端点可达性探测：绝不出图（哨兵模型）。 */
    private routeReport;
    probe(channel: ChannelRecord, options?: {
        realRun?: boolean;
        http?: HttpOptions;
        outputDir?: string;
    }): Promise<ProbeResult>;
    generate(channel: ChannelRecord, request: GenerateRequest): Promise<GenerateResult>;
}
