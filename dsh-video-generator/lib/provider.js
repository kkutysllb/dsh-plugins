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
