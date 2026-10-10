/** music/score.json 组装（规格 §6.4）：段落/节拍网格 + 歌词行时间轴 + 溯源。
 *  grid.source 三级如实标注：api（适配器 sectionsPath 命中）＞ local-analysis（本地
 *  PCM 分析）＞ estimate（按歌词段落均分兜底）——不许把兜底假装成 API 结果。
 */
const SECTION_TAG = /^\s*\[([^\]\n]{1,32})]\s*$/;
/** 歌词文本 → 段落结构（[Intro]/[Verse]/[Chorus]…；无标签整段作单段）。 */
export function parseLyricsSections(text) {
    const out = [];
    let current = null;
    for (const raw of String(text ?? '').split(/\r?\n/)) {
        const m = SECTION_TAG.exec(raw);
        if (m) {
            current = { section: m[1].trim(), lines: [] };
            out.push(current);
            continue;
        }
        if (raw.trim() === '')
            continue;
        if (!current) {
            current = { section: 'Lyrics', lines: [] };
            out.push(current);
        }
        current.lines.push(raw.trim());
    }
    return out;
}
/** 拍点网格（bpm+offset 已知时）；上限 beats 输出 512 个，超出以 bpm/offsetSec 表达。 */
export function beatsFrom(bpm, offsetSec, durationSec, cap = 512) {
    if (bpm === null || bpm <= 0 || offsetSec === null || durationSec <= 0)
        return [];
    const step = 60 / bpm;
    const beats = [];
    for (let t = offsetSec; t <= durationSec + 1e-9; t += step) {
        beats.push(Math.round(t * 100) / 100);
        if (beats.length >= cap)
            break;
    }
    return beats;
}
/** 歌词行时间轴：段落网格与歌词段落数一致时 zip 对齐，否则均分（估算）。 */
export function alignLyrics(sections, lyricsText, durationSec) {
    const parsed = parseLyricsSections(lyricsText);
    if (parsed.length === 0)
        return [];
    if (sections.length === parsed.length) {
        return parsed.map((p, i) => {
            const s = sections[i];
            return { section: p.section, startSec: s.startSec, endSec: s.endSec, lines: p.lines };
        });
    }
    // 均分（估算）：按段落占比平铺整曲
    const total = parsed.reduce((a, p) => a + Math.max(1, p.lines.length), 0);
    let cursor = 0;
    return parsed.map((p) => {
        const weight = Math.max(1, p.lines.length) / total;
        const startSec = Math.round(cursor * 100) / 100;
        cursor += weight * durationSec;
        const endSec = Math.round(Math.min(durationSec, cursor) * 100) / 100;
        return { section: p.section, startSec, endSec, lines: p.lines };
    });
}
/** 均分段落（无歌词/无信息时的兜底网格）。 */
export function evenSections(count, durationSec, labelPrefix = 'S') {
    const n = Math.max(1, Math.min(24, Math.floor(count)));
    const step = durationSec / n;
    return Array.from({ length: n }, (_, i) => ({
        label: `${labelPrefix}${i + 1}`,
        startSec: Math.round(i * step * 100) / 100,
        endSec: Math.round((i === n - 1 ? durationSec : (i + 1) * step) * 100) / 100,
    }));
}
export function assembleScore(input) {
    return {
        kind: input.kind,
        file: input.file,
        durationSec: Math.round(input.durationSec * 100) / 100,
        grid: input.grid,
        lyrics: alignLyrics(input.grid.sections, input.lyricsText ?? '', input.durationSec),
        model: input.model,
        channelId: input.channelId,
    };
}
