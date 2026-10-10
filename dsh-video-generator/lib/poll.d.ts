/** 韧性轮询：仅对临时性错误（RelayError status 0/429/>=500）指数退避重试；终态绝不重试；总超时引用最后错误。 */
export interface PollOptions<T> {
    isFinal: (state: T) => boolean;
    delayMs?: number;
    maxPollMs?: number;
    maxDelayMs?: number;
    /** 取消信号：触发后 sleep/下一轮立即抛 PollAbortedError（调用方在 catch 里转中断语义）。 */
    signal?: AbortSignal;
}
/** 轮询被信号中止：不是上游失败，调用方应按取消/中断处置而非任务失败。 */
export declare class PollAbortedError extends Error {
    constructor();
}
export declare function isTransient(err: unknown): boolean;
export declare function pollUntil<T>(attempt: () => Promise<T>, opts: PollOptions<T>): Promise<T>;
/** 瞬时错误（网络/429/5xx）重试包装：非瞬时错误立即抛出。submit 类操作慎用（可能重复计费），轮询/下载类安全。 */
export declare function retryTransient<T>(fn: () => Promise<T>, attempts?: number, baseMs?: number): Promise<T>;
