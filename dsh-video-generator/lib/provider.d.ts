/** 六方法 Provider 薄抽象（继承鲸影验证过的接口形态）。 */
export interface ProviderCapabilities {
    textToVideo?: boolean;
    imageToVideo?: boolean;
    image?: boolean;
    tts?: boolean;
    maxDurationSec?: number;
    resolutions?: string[];
    qualityTier?: number;
}
export interface ProviderQuote {
    qualityTier: number;
    costEstimate: number;
    currency: string;
}
export interface ProviderStatus {
    state: 'running' | 'done' | 'failed' | 'unknown';
    progress: number | null;
    error?: string;
}
export interface ProviderSubmitResult {
    jobId: string;
}
export interface ProviderFetchResult {
    outputs: string[];
    meta?: Record<string, unknown>;
}
export interface ProviderHealth {
    ok: boolean;
    quotaRemaining?: number | null;
}
export interface Provider {
    id: string;
    capabilities: ProviderCapabilities;
    quote(stage: string, spec: Record<string, unknown>): Promise<ProviderQuote>;
    submit(stage: string, spec: Record<string, unknown>): Promise<ProviderSubmitResult>;
    status(jobId: string): Promise<ProviderStatus>;
    fetch(jobId: string): Promise<ProviderFetchResult>;
    health(): Promise<ProviderHealth>;
}
export declare function assertProvider<T extends Provider>(p: T): T;
/** route() 的需求描述只接受布尔能力位；数值能力（时长/分辨率/tier）是排序与报价的输入，不是硬过滤条件。 */
export type ProviderNeed = Pick<ProviderCapabilities, 'textToVideo' | 'imageToVideo' | 'image' | 'tts'>;
/**
 * 按布尔能力位过滤并按 qualityTier 高->低（preferCost 时低->高）挑出 provider。
 * @param preferCost true 时按 qualityTier 升序（tier 低 ≈ 成本低）；真实报价见 quote().costEstimate，route 为同步函数不做报价排序
 */
export declare function route(providers: Provider[], need: ProviderNeed, preferCost?: boolean): Provider | null;
