/** 中转站共享 HTTP 层：Bearer 鉴权 + 超时中止 + 双错误形态归一（规格附录 B）。 */
export declare class RelayError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
type FetchImpl = typeof fetch;
export declare function postJson<T = Record<string, unknown>>(url: string, apiKey: string, body: unknown, fetchImpl?: FetchImpl, timeoutMs?: number): Promise<T>;
export declare function getJson<T = Record<string, unknown>>(url: string, apiKey: string, fetchImpl?: FetchImpl, timeoutMs?: number): Promise<T>;
export {};
