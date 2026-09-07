/** 中转站共享 HTTP 层：Bearer 鉴权 + 超时中止 + 双错误形态归一（规格附录 B）。 */
export class RelayError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
function authHeaders(apiKey) {
    return { Authorization: `Bearer ${apiKey}` };
}
function signalWithTimeout(timeoutMs) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    return { signal: ac.signal, done: () => clearTimeout(timer) };
}
function normalizeErrStatus(status, body) {
    const b = body;
    const msg = b?.error?.message ?? (typeof b?.message === 'string' ? b.message : `http-${status}`);
    return new RelayError(status, msg);
}
async function readError(res) {
    let body = null;
    try {
        body = await res.json();
    }
    catch {
        body = null;
    }
    throw normalizeErrStatus(res.status, body);
}
async function requestJson(fetchImpl, url, apiKey, init, timeoutMs) {
    const { signal, done } = signalWithTimeout(timeoutMs);
    try {
        const res = await fetchImpl(url, { ...init, signal });
        if (!res.ok)
            await readError(res);
        return (await res.json());
    }
    catch (err) {
        if (err instanceof RelayError)
            throw err;
        throw new RelayError(0, err instanceof Error ? err.message : 'network');
    }
    finally {
        done();
    }
}
export function postJson(url, apiKey, body, fetchImpl = fetch, timeoutMs = 120000) {
    return requestJson(fetchImpl, url, apiKey, {
        method: 'POST',
        headers: { ...authHeaders(apiKey), 'content-type': 'application/json' },
        body: JSON.stringify(body),
    }, timeoutMs);
}
export function getJson(url, apiKey, fetchImpl = fetch, timeoutMs = 15000) {
    return requestJson(fetchImpl, url, apiKey, { method: 'GET', headers: authHeaders(apiKey) }, timeoutMs);
}
