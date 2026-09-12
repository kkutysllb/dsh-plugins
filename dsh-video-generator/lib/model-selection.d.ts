import type { ChannelModel, ModelKind } from './store/vault.ts';
export interface ModelSelectionChannel {
    id: string;
    label?: string;
    models?: ChannelModel[];
}
export declare class ModelUnavailableError extends Error {
    readonly code: "model-unavailable";
    readonly channelId: string;
    readonly channelLabel: string;
    readonly kind: ModelKind | string;
    readonly model: string | null;
    constructor(channel: ModelSelectionChannel, kind: ModelKind | string, model: string | null, reason?: string);
}
export declare function modelUnavailableFrom(channel: ModelSelectionChannel, kind: ModelKind | string, model: string | null | undefined, reason?: string): ModelUnavailableError;
export declare function selectConfiguredModel(channel: ModelSelectionChannel, kind: ModelKind): string;
/**
 * 判定上游是否明确表示模型或分发渠道不存在。
 * 429、超时、网络异常和 5xx 保持原有重试/失败语义。
 */
export declare function isExplicitModelUnavailable(error: unknown): boolean;
