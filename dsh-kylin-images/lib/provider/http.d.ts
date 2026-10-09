export interface HttpOptions {
    timeoutMs?: number | undefined;
    retries?: number | undefined;
    backoffBaseMs?: number | undefined;
    headers?: Record<string, string> | undefined;
    /** 测试注入点：替换 fetch（用于本地假上游）。 */
    fetchImpl?: typeof fetch | undefined;
    /** 测试注入点：替换等待（避免测试真的睡）。 */
    sleepImpl?: ((ms: number) => Promise<void>) | undefined;
    method?: string | undefined;
    /** 异步任务轮询间隔（默认 2s）。 */
    pollIntervalMs?: number | undefined;
    /** 异步任务整体超时（默认 5 分钟；超时视为失败，不记成功）。 */
    pollTimeoutMs?: number | undefined;
}
export declare const DEFAULT_TIMEOUT_MS = 120000;
export declare const DEFAULT_RETRIES = 3;
export declare const DEFAULT_BACKOFF_BASE_MS = 30000;
export interface JsonResponse {
    status: number;
    body: unknown;
    headers: Headers;
}
/**
 * 发一次 JSON 请求并归类错误；可重试错误会按退避重试。
 * 返回 {status, body, headers}；非 2xx 一律抛 ImageProviderError。
 */
export declare function requestJson(url: string, init: RequestInit, options?: HttpOptions): Promise<JsonResponse>;
/** 下载远程图片到本地（签名 URL 必须立刻落盘）。 */
export declare function downloadToFile(url: string, path: string, options?: HttpOptions): Promise<number>;
/** 把 base64 图片写盘，返回字节数。 */
export declare function writeBase64Image(data: string, path: string): number;
/** 从任意层级的响应体里取嵌套字段（容错，缺任一层返回 undefined）。 */
export declare function pickPath(value: unknown, path: readonly string[]): unknown;
/** 把可能是数组也可能是单值的字段归一成字符串数组。 */
export declare function asUrlList(value: unknown): string[];
