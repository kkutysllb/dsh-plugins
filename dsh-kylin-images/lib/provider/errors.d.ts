/**
 * 通道错误归一。
 *
 * 分类口径来自上游 Apimart 生产契约（分析 §5）与 dsh-video-generator 附录 B 实测：
 * 不同的中转站/官方端点在 HTTP 层信号不一致，但都能归到有限的几类，
 * 上层据此决定「可重试 / 要改配置 / 要用户确认」。
 */
export type ImageErrorCode = 'API_KEY_INVALID' | 'BALANCE_REQUIRED' | 'RATE_LIMITED' | 'REQUEST_REJECTED' | 'UNAVAILABLE' | 'REQUEST_FAILED' | 'TIMEOUT' | 'NETWORK' | 'BAD_RESPONSE' | 'TASK_FAILED' | 'URL_EXPIRED' | 'ENDPOINT_BLOCKED';
export declare function isRetryable(code: ImageErrorCode): boolean;
export declare class ImageProviderError extends Error {
    readonly code: ImageErrorCode;
    readonly status: number | undefined;
    readonly retryAfterMs: number | undefined;
    readonly detail: string | undefined;
    constructor(code: ImageErrorCode, message: string, options?: {
        status?: number | undefined;
        retryAfterMs?: number | undefined;
        detail?: string | undefined;
    });
}
export declare function isImageProviderError(value: unknown): value is ImageProviderError;
/** 从 HTTP 状态 + 响应体判定错误码。 */
export declare function classifyStatus(status: number, body: unknown): ImageErrorCode;
/**
 * 解析 Retry-After（秒数或 HTTP 日期），夹到 1s..60s。
 * 缺失或非法时返回给定的兜底值。
 */
export declare function retryAfterMs(headers: Headers | undefined, fallbackMs: number, nowMs?: number): number;
/** 指数退避（基期 * 2^attempt），封顶 15 分钟。 */
export declare function backoffMs(attempt: number, baseMs: number, maxMs?: number): number;
/** 面向用户的错误文案（工具面与卡片直接用这段）。 */
export declare function describeError(error: unknown): string;
