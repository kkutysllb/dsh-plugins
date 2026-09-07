/** 韧性轮询：仅对临时性错误（RelayError status 0/429/>=500）指数退避重试；终态绝不重试；总超时引用最后错误。 */
export interface PollOptions<T> {
    isFinal: (state: T) => boolean;
    delayMs?: number;
    maxPollMs?: number;
    maxDelayMs?: number;
}
export declare function isTransient(err: unknown): boolean;
export declare function pollUntil<T>(attempt: () => Promise<T>, opts: PollOptions<T>): Promise<T>;
/** 瞬时错误（网络/429/5xx）重试包装：非瞬时错误立即抛出。submit 类操作慎用（可能重复计费），轮询/下载类安全。 */
export declare function retryTransient<T>(fn: () => Promise<T>, attempts?: number, baseMs?: number): Promise<T>;
