/** 六方法 Provider 薄抽象（继承鲸影验证过的接口形态）。 */
const REQUIRED = ['id', 'capabilities', 'quote', 'submit', 'status', 'fetch', 'health'];
export function assertProvider(p) {
    if (p == null)
        throw new Error('provider 缺少方法/字段: <null>');
    for (const m of REQUIRED) {
        if (p[m] == null) {
            throw new Error(`provider ${p.id} 缺少方法/字段: ${String(m)}`);
        }
    }
    return p;
}
/**
 * 按布尔能力位过滤并按 qualityTier 高->低（preferCost 时低->高）挑出 provider。
 * @param preferCost true 时按 qualityTier 升序（tier 低 ≈ 成本低）；真实报价见 quote().costEstimate，route 为同步函数不做报价排序
 */
export function route(providers, need, preferCost = false) {
    const ok = providers.filter((p) => Object.entries(need).every(([k, v]) => !v || Boolean(p.capabilities[k])));
    if (!ok.length)
        return null;
    ok.sort((a, b) => {
        const ta = a.capabilities.qualityTier ?? 5;
        const tb = b.capabilities.qualityTier ?? 5;
        return preferCost ? ta - tb : tb - ta;
    });
    return ok[0] ?? null;
}
