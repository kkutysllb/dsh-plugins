/** 站点价目（规格附录 B.5）：/api/pricing 公开可读；quota_type=1 按次（model_price），0 按量（离线不可估）。 */
import { getJson } from "./providers/relay-http.js";
export async function fetchPricing(target, fetchImpl = fetch, timeoutMs = 15000) {
    const base = target.baseUrl.trim().replace(/\/+$/, '');
    // 归一：习惯性粘贴 /v1 结尾不静默 404
    const root = base.replace(/\/v1$/, '');
    const json = await getJson(`${root}/api/pricing`, target.apiKey, fetchImpl, timeoutMs);
    const table = new Map();
    for (const row of json?.data ?? []) {
        if (typeof row?.model_name === 'string')
            table.set(row.model_name, row);
    }
    return table;
}
/** 按次模型返回单次成本原始值（计价单位口径见附录 B.5）；按量/未知返回 null（调用方走确认）。 */
export function estimateCny(model, table) {
    const row = table.get(model);
    if (!row || row.quota_type !== 1)
        return null;
    const price = Number(row.model_price);
    return Number.isFinite(price) && price >= 0 ? price : null;
}
