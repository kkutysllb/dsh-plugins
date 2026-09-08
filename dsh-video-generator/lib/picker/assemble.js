import { resolveModel } from "../model-catalog.js";
export function assemblePickerRows(ch, enumerated) {
    const rows = [];
    const seen = new Set();
    // 1. 已配置项优先（按 ch.models 顺序，保留用户原 kind 不被推断覆盖）
    for (const m of ch.models ?? []) {
        if (seen.has(m.model))
            continue;
        rows.push({ model: m.model, kind: m.kind, isConfigured: true, isNew: false });
        seen.add(m.model);
    }
    // 2. 新枚举项追加（按探测顺序，kind 走内置目录兜底 video）
    for (const model of enumerated ?? []) {
        if (seen.has(model))
            continue;
        const r = resolveModel(model);
        rows.push({ model, kind: r.entry.kind, isConfigured: false, isNew: true });
        seen.add(model);
    }
    return rows;
}
