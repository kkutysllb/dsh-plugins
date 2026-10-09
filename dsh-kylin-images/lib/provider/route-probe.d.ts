import type { HttpOptions } from './http.ts';
import type { ChannelKind } from './types.ts';
/** 哨兵模型名：上游不可能有，故该请求只可能失败，不可能产生费用。 */
export declare const ROUTE_PROBE_MODEL = "__dsh_route_probe__";
export declare const ROUTE_PROBE_TIMEOUT_MS = 15000;
export type RouteState = 'routed' | 'auth-rejected' | 'gateway-blocked' | 'unreachable';
export interface RouteVerdict {
    path: string;
    state: RouteState;
    status: number;
    note: string;
}
export type RecommendedStyle = 'sync-images' | 'responses-images' | 'unknown';
export interface RouteReport {
    images: RouteVerdict;
    responses: RouteVerdict;
    /** 依据证据给出的端点风格建议（两者都通时按同步出图记）。 */
    recommended: RecommendedStyle;
    /** 与所配通道类型冲突时的处置建议；无冲突为空串。 */
    advice: string;
}
/** 响应体像不像网关/反代的 HTML 错误页。 */
export declare function looksLikeHtml(text: string): boolean;
/** 路由是否真的到达了 API 层（凭据被拒也算到达：那是鉴权问题，不是路由问题）。 */
export declare function isRouted(state: RouteState): boolean;
export declare function classifyRoute(status: number, body: unknown, contentType: string): RouteState;
export declare function routeStateLabel(state: RouteState): string;
export declare function routeAdvice(kind: ChannelKind, images: RouteVerdict, responses: RouteVerdict): string;
/**
 * 对通道的两条 OpenAI 兼容路径做零成本可达性探测。
 * 用规范化缺省路径（不受通道 endpointPath 覆盖影响），因为目的是判断站点形态。
 */
export declare function probeRoutes(channel: {
    baseUrl: string;
    kind: ChannelKind;
}, headers: Record<string, string>, http?: HttpOptions): Promise<RouteReport>;
export declare function describeRoute(report: RouteReport): string;
