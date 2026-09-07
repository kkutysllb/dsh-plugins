/** 韧性轮询：仅对临时性错误（RelayError status 0/429/>=500）指数退避重试；终态绝不重试；总超时引用最后错误。 */
import { RelayError } from "./providers/relay-http.js";
export function isTransient(err) {
    if (!(err instanceof RelayError))
        return false;
    const s = err.status;
    return s === 0 || s === 429 || s >= 500;
}
export async function pollUntil(attempt, opts) {
    const delayMs = opts.delayMs ?? 5000;
    const maxDelayMs = opts.maxDelayMs ?? 30000;
    const maxPollMs = opts.maxPollMs ?? 600000;
    const start = Date.now();
    let delay = delayMs;
    let lastErr = null;
    for (;;) {
        try {
            const state = await attempt();
            if (opts.isFinal(state))
                return state;
            lastErr = null;
        }
        catch (err) {
            if (!isTransient(err))
                throw err;
            lastErr = err;
        }
        if (Date.now() - start > maxPollMs) {
            const detail = lastErr instanceof Error ? lastErr.message : 'unknown';
            throw new Error(`轮询超时（>${Math.round(maxPollMs / 1000)}s）：${detail}`);
        }
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, maxDelayMs);
    }
}
/** 瞬时错误（网络/429/5xx）重试包装：非瞬时错误立即抛出。submit 类操作慎用（可能重复计费），轮询/下载类安全。 */
export async function retryTransient(fn, attempts = 3, baseMs = 3000) {
    let lastErr = null;
    for (let n = 1; n <= attempts; n++) {
        try {
            return await fn();
        }
        catch (err) {
            if (!isTransient(err) || n === attempts)
                throw err;
            lastErr = err;
            await new Promise((r) => setTimeout(r, baseMs * 2 ** (n - 1)));
        }
    }
    throw lastErr;
}
