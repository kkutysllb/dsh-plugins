import type { HttpOptions } from './http.ts';
import type { ChannelKind, ChannelRecord } from './types.ts';
export declare function alternateKindFor(kind: ChannelKind): ChannelKind | undefined;
/** 「端点被前置代理拦截」是唯一值得换端点重试的错误 —— 换一条路就有机会成功。 */
export declare function isEndpointBlocked(error: unknown): boolean;
export declare function alternateChannel(channel: ChannelRecord, kind: ChannelKind): ChannelRecord;
/** 本次失败该换到哪个类型：返回 undefined 表示不回退。注意这是零成本探测，不出图。 */
export declare function planFallback(channel: ChannelRecord, error: unknown, options?: {
    http?: HttpOptions | undefined;
}): Promise<{
    kind: ChannelKind;
    channel: ChannelRecord;
    note: string;
} | undefined>;
