import type { ChannelRecord, GenerateRequest, GenerateResult, ImageProvider, ProbeResult, ProviderHealth } from './types.ts';
export declare const MOCK_MODEL = "mock-image-v1";
export declare class MockProvider implements ImageProvider {
    readonly kind: "mock";
    health(channel: ChannelRecord): Promise<ProviderHealth>;
    /** mock 也要实现 probe：否则「测试通道」在不同通道类型下行为不一致。 */
    probe(channel: ChannelRecord, options?: {
        realRun?: boolean;
        http?: unknown;
        outputDir?: string;
    }): Promise<ProbeResult>;
    generate(channel: ChannelRecord, request: GenerateRequest): Promise<GenerateResult>;
}
